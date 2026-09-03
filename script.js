const ARC_CHAIN_ID = 5042002;
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARC_EXPLORER = "https://testnet.arcscan.app";

let provider, signer, userAddress;
let score = 0;
let fishCount = 0;
let virtualReward = 0;
let isCasting = false;
let isProcessingTx = false;

const connectBtn = document.getElementById("connectBtn");
const castBtn = document.getElementById("castBtn");
const claimBtn = document.getElementById("claimBtn");
const walletInfo = document.getElementById("walletInfo");
const scoreEl = document.getElementById("score");
const fishCountEl = document.getElementById("fishCount");
const rewardEl = document.getElementById("reward");
const messageEl = document.getElementById("message");
const txStatus = document.getElementById("txStatus");
const hook = document.getElementById("hook");
const gameArea = document.getElementById("gameArea");

const fishTypes = [
  { emoji: "🐟", points: 10, reward: 0.5 },
  { emoji: "🐠", points: 20, reward: 1 },
  { emoji: "🐡", points: 30, reward: 1.5 },
  { emoji: "🦈", points: 50, reward: 3 },
  { emoji: "🐋", points: 100, reward: 5 },
];

function showMessage(text, type = "success") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function showTxStatus(text, type = "pending") {
  txStatus.textContent = text;
  txStatus.className = `tx-status ${type}`;
}

async function switchToArcNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + ARC_CHAIN_ID.toString(16) }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x" + ARC_CHAIN_ID.toString(16),
          chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: [ARC_RPC],
          blockExplorerUrls: [ARC_EXPLORER],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    showMessage("Please install MetaMask!", "error");
    return;
  }

  try {
    showTxStatus("Connecting wallet...", "pending");
    await switchToArcNetwork();

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    walletInfo.textContent = `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    connectBtn.textContent = "Connected";
    connectBtn.disabled = true;
    castBtn.disabled = false;

    showMessage("Wallet connected to Arc Testnet!", "success");
    showTxStatus("");
  } catch (err) {
    console.error(err);
    showMessage("Failed to connect: " + (err.message || err), "error");
    showTxStatus("");
  }
}

async function sendGameTransaction(actionName) {
  if (isProcessingTx) return false;
  if (!signer) {
    showMessage("Connect wallet first!", "error");
    return false;
  }

  isProcessingTx = true;
  castBtn.disabled = true;
  claimBtn.disabled = true;

  try {
    showTxStatus(`Sending "${actionName}" transaction... Confirm in MetaMask`, "pending");

    // Perbaikan: Tidak pakai "data" supaya tidak error di Arc Testnet
    const tx = await signer.sendTransaction({
      to: userAddress,     // kirim ke diri sendiri
      value: 0,            // 0 USDC
      gasLimit: 100000
    });

    showTxStatus(`Transaction sent! Waiting confirmation... ${tx.hash.slice(0, 10)}...`, "pending");

    await tx.wait();

    showTxStatus(`✅ ${actionName} confirmed on Arc Testnet!`, "success");
    showMessage(`On-chain action "${actionName}" successful!`, "success");

    isProcessingTx = false;
    castBtn.disabled = false;
    if (virtualReward >= 5) claimBtn.disabled = false;
    return true;

  } catch (err) {
    console.error(err);
    showTxStatus("Transaction failed or rejected", "error");
    showMessage(err.reason || err.message || "Transaction rejected", "error");
    isProcessingTx = false;
    castBtn.disabled = false;
    if (virtualReward >= 5) claimBtn.disabled = false;
    return false;
  }
}

function spawnFish() {
  const fish = document.createElement("div");
  fish.className = "fish";

  const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
  fish.textContent = type.emoji;

  const top = 110 + Math.random() * 140;
  fish.style.top = `${top}px`;
  fish.style.left = "-50px";

  const duration = 4 + Math.random() * 3;
  fish.style.animationDuration = `${duration}s`;

  fish.addEventListener("click", async () => {
    if (isProcessingTx || isCasting === false) return;

    const success = await sendGameTransaction("Catch-" + type.emoji);
    if (!success) return;

    score += type.points;
    fishCount += 1;
    virtualReward += type.reward;

    scoreEl.textContent = score;
    fishCountEl.textContent = fishCount;
    rewardEl.textContent = `${virtualReward.toFixed(1)} USDC`;

    fish.remove();
    showMessage(`Caught ${type.emoji}! +${type.points} pts`);

    if (virtualReward >= 5) claimBtn.disabled = false;
  });

  gameArea.appendChild(fish);

  setTimeout(() => {
    if (fish.parentNode) fish.remove();
  }, duration * 1000);
}

castBtn.addEventListener("click", async () => {
  if (isCasting || isProcessingTx) return;

  const success = await sendGameTransaction("CastLine");
  if (!success) return;

  isCasting = true;
  hook.style.top = "200px";
  showMessage("Line cast on-chain! Click the fish quickly!");

  for (let i = 0; i < 5; i++) {
    setTimeout(spawnFish, i * 700);
  }

  setTimeout(() => {
    hook.style.top = "70px";
    isCasting = false;
  }, 6000);
});

claimBtn.addEventListener("click", async () => {
  if (virtualReward < 5 || isProcessingTx) return;

  const success = await sendGameTransaction("ClaimReward");
  if (!success) return;

  showMessage(`Successfully claimed ${virtualReward.toFixed(1)} virtual USDC on-chain!`);
  virtualReward = 0;
  rewardEl.textContent = "0 USDC";
  claimBtn.disabled = true;
});

connectBtn.addEventListener("click", connectWallet);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
