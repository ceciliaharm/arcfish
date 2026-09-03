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
const reelBtn = document.getElementById("reelBtn");
const claimBtn = document.getElementById("claimBtn");
const walletInfo = document.getElementById("walletInfo");
const scoreEl = document.getElementById("score");
const fishCountEl = document.getElementById("fishCount");
const rewardEl = document.getElementById("reward");
const messageEl = document.getElementById("message");
const txStatus = document.getElementById("txStatus");
const hook = document.getElementById("hook");
const gameArea = document.getElementById("gameArea");
const particlesContainer = document.getElementById("particles");

const catchModal = document.getElementById("catchModal");
const catchEmoji = document.getElementById("catchEmoji");
const catchName = document.getElementById("catchName");
const catchPoints = document.getElementById("catchPoints");
const catchReward = document.getElementById("catchReward");
const closeModal = document.getElementById("closeModal");

// 30 jenis ikan
const fishTypes = [
  { emoji: "🐟", name: "Blue Fish", points: 10, reward: 0.3 },
  { emoji: "🐠", name: "Clownfish", points: 15, reward: 0.4 },
  { emoji: "🐡", name: "Pufferfish", points: 20, reward: 0.5 },
  { emoji: "🦈", name: "Shark", points: 50, reward: 1.2 },
  { emoji: "🐋", name: "Blue Whale", points: 100, reward: 2.5 },
  { emoji: "🐬", name: "Dolphin", points: 40, reward: 1.0 },
  { emoji: "🐙", name: "Octopus", points: 35, reward: 0.9 },
  { emoji: "🦑", name: "Squid", points: 30, reward: 0.8 },
  { emoji: "🦐", name: "Shrimp", points: 8, reward: 0.2 },
  { emoji: "🦞", name: "Lobster", points: 45, reward: 1.1 },
  { emoji: "🦀", name: "Crab", points: 25, reward: 0.6 },
  { emoji: "🐚", name: "Shell", points: 12, reward: 0.3 },
  { emoji: "🌊", name: "Wave Spirit", points: 60, reward: 1.5 },
  { emoji: "⭐", name: "Starfish", points: 18, reward: 0.5 },
  { emoji: "🌟", name: "Golden Star", points: 80, reward: 2.0 },
  { emoji: "💎", name: "Diamond Fish", points: 120, reward: 3.0 },
  { emoji: "👑", name: "King Fish", points: 150, reward: 4.0 },
  { emoji: "🔥", name: "Fire Fish", points: 70, reward: 1.8 },
  { emoji: "❄️", name: "Ice Fish", points: 65, reward: 1.6 },
  { emoji: "🌈", name: "Rainbow Fish", points: 90, reward: 2.2 },
  { emoji: "👻", name: "Ghost Fish", points: 55, reward: 1.3 },
  { emoji: "🐉", name: "Sea Dragon", points: 200, reward: 5.0 },
  { emoji: "🧚", name: "Fairy Fish", points: 75, reward: 1.9 },
  { emoji: "🧿", name: "Mystic Eye", points: 85, reward: 2.1 },
  { emoji: "🪙", name: "Coin Fish", points: 40, reward: 1.0 },
  { emoji: "💍", name: "Ring Fish", points: 95, reward: 2.4 },
  { emoji: "⚡", name: "Thunder Fish", points: 70, reward: 1.7 },
  { emoji: "🌙", name: "Moon Fish", points: 88, reward: 2.2 },
  { emoji: "☀️", name: "Sun Fish", points: 92, reward: 2.3 },
  { emoji: "🌀", name: "Vortex Fish", points: 110, reward: 2.8 }
];

function showMessage(text, type = "success") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function showTxStatus(text, type = "pending") {
  txStatus.textContent = text;
  txStatus.className = `tx-status ${type}`;
}

function showCatchPopup(fish) {
  catchEmoji.textContent = fish.emoji;
  catchName.textContent = fish.name;
  catchPoints.textContent = `+${fish.points} points`;
  catchReward.textContent = `+${fish.reward} USDC`;
  catchModal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => {
  catchModal.classList.add("hidden");
});

function createParticles(x, y) {
  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = x + "px";
    p.style.top = y + "px";
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 70;
    p.style.setProperty("--tx", Math.cos(angle) * distance + "px");
    p.style.setProperty("--ty", Math.sin(angle) * distance + "px");
    particlesContainer.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
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

    walletInfo.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    connectBtn.textContent = "Connected ✓";
    connectBtn.disabled = true;
    castBtn.disabled = false;

    showMessage("Connected to Arc Testnet!", "success");
    showTxStatus("");
  } catch (err) {
    showMessage("Failed to connect wallet", "error");
    showTxStatus("");
  }
}

// Hanya Cast Line yang pakai transaksi on-chain
async function sendCastTransaction() {
  if (isProcessingTx) return false;
  if (!signer) {
    showMessage("Connect wallet first!", "error");
    return false;
  }

  isProcessingTx = true;
  castBtn.disabled = true;

  try {
    showTxStatus("Sending Cast Line transaction... Confirm in MetaMask", "pending");

    const tx = await signer.sendTransaction({
      to: userAddress,
      value: 0,
      gasLimit: 100000
    });

    showTxStatus(`Waiting confirmation... ${tx.hash.slice(0, 10)}...`, "pending");
    await tx.wait();

    showTxStatus("✅ Cast Line confirmed on Arc Testnet!", "success");
    isProcessingTx = false;
    return true;

  } catch (err) {
    showTxStatus("Transaction failed or rejected", "error");
    showMessage(err.reason || err.message || "Rejected", "error");
    isProcessingTx = false;
    castBtn.disabled = false;
    return false;
  }
}

function spawnFish() {
  const fishEl = document.createElement("div");
  fishEl.className = "fish";

  const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
  fishEl.textContent = type.emoji;

  const top = 150 + Math.random() * 160;
  fishEl.style.top = `${top}px`;
  fishEl.style.left = "-100px";

  // Lebih lambat = lebih mudah diklik
  const duration = 8 + Math.random() * 5;
  fishEl.style.animationDuration = `${duration}s`;

  // Klik ikan = tangkap (TIDAK pakai transaksi)
  fishEl.addEventListener("click", () => {
    if (!isCasting) return;

    // Particles
    const rect = fishEl.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    createParticles(rect.left - areaRect.left + 20, rect.top - areaRect.top + 20);

    // Update score (lokal)
    score += type.points;
    fishCount += 1;
    virtualReward += type.reward;

    scoreEl.textContent = score;
    fishCountEl.textContent = fishCount;
    rewardEl.textContent = `${virtualReward.toFixed(1)} USDC`;

    fishEl.remove();
    showCatchPopup(type);

    if (virtualReward >= 3) claimBtn.disabled = false;
  });

  gameArea.appendChild(fishEl);

  setTimeout(() => {
    if (fishEl.parentNode) fishEl.remove();
  }, duration * 1000);
}

// CAST LINE (On-Chain)
castBtn.addEventListener("click", async () => {
  if (isCasting || isProcessingTx) return;

  const success = await sendCastTransaction();
  if (!success) return;

  isCasting = true;
  castBtn.disabled = true;
  reelBtn.disabled = false;

  hook.style.top = "70%";
  showMessage("Line cast! Click the fish to catch them!");

  // Spawn banyak ikan
  for (let i = 0; i < 10; i++) {
    setTimeout(spawnFish, i * 450);
  }
});

// REEL IN (Tidak pakai transaksi)
reelBtn.addEventListener("click", () => {
  if (!isCasting) return;

  hook.style.top = "26%";
  isCasting = false;
  reelBtn.disabled = true;
  castBtn.disabled = false;

  // Hapus semua ikan yang tersisa
  document.querySelectorAll(".fish").forEach(f => f.remove());

  showMessage("Line reeled in!");
});

// CLAIM (Tidak pakai transaksi)
claimBtn.addEventListener("click", () => {
  if (virtualReward < 3) return;

  showMessage(`Successfully claimed ${virtualReward.toFixed(1)} USDC virtual reward!`);
  virtualReward = 0;
  rewardEl.textContent = "0 USDC";
  claimBtn.disabled = true;
});

connectBtn.addEventListener("click", connectWallet);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
