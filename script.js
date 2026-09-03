const ARC_CHAIN_ID = 5042002;
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARC_EXPLORER = "https://testnet.arcscan.app";

let provider, signer, userAddress;
let score = 0, fishCount = 0, virtualReward = 0;
let isCasting = false, isProcessingTx = false;
let currentUsername = localStorage.getItem("arcfish_username") || "";
let currentCharacter = localStorage.getItem("arcfish_character") || "";

const startScreen = document.getElementById("startScreen");
const gameWrapper = document.getElementById("gameWrapper");
const stepUsername = document.getElementById("stepUsername");
const stepCharacter = document.getElementById("stepCharacter");
const usernameInput = document.getElementById("usernameInput");
const nextToCharacter = document.getElementById("nextToCharacter");
const startGameBtn = document.getElementById("startGameBtn");
const playerCharacter = document.getElementById("playerCharacter");
const displayUsername = document.getElementById("displayUsername");
const displayCharacter = document.getElementById("displayCharacter");

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
const struggleFish = document.getElementById("struggleFish");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const leaderboardList = document.getElementById("leaderboardList");

const catchModal = document.getElementById("catchModal");
const catchEmoji = document.getElementById("catchEmoji");
const catchName = document.getElementById("catchName");
const catchPoints = document.getElementById("catchPoints");
const catchReward = document.getElementById("catchReward");
const closeModal = document.getElementById("closeModal");

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

let selectedChar = "";

// ===== START FLOW =====
if (currentUsername && currentCharacter) {
  // Sudah pernah set → langsung masuk game
  startScreen.classList.add("hidden");
  gameWrapper.classList.remove("hidden");
  applyPlayerData();
} 

nextToCharacter.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name.length < 3) {
    alert("Username minimal 3 karakter");
    return;
  }
  currentUsername = name;
  localStorage.setItem("arcfish_username", name);
  stepUsername.classList.add("hidden");
  stepCharacter.classList.remove("hidden");
});

document.querySelectorAll(".char-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".char-option").forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    selectedChar = opt.dataset.char;
    startGameBtn.disabled = false;
  });
});

startGameBtn.addEventListener("click", () => {
  currentCharacter = selectedChar;
  localStorage.setItem("arcfish_character", selectedChar);
  startScreen.classList.add("hidden");
  gameWrapper.classList.remove("hidden");
  applyPlayerData();
});

function applyPlayerData() {
  displayUsername.textContent = currentUsername;
  const emoji = currentCharacter === "female" ? "👩‍✈️" : "👨‍✈️";
  displayCharacter.textContent = emoji;
  playerCharacter.textContent = emoji;
}

// ===== HELPERS =====
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
closeModal.addEventListener("click", () => catchModal.classList.add("hidden"));

// ===== CATCH WITH STRUGGLE =====
function catchWithStruggle(fish) {
  // Tampilkan ikan bergeliat di air
  struggleFish.textContent = fish.emoji;
  struggleFish.classList.remove("hidden");
  struggleFish.classList.add("fighting");
  struggleFish.style.top = "65%";

  showMessage("Ikan melawan! Sedang bergeliat memakan umpan...");

  // Setelah 1.8 detik, tarik ke permukaan
  setTimeout(() => {
    struggleFish.style.top = "35%";
    struggleFish.classList.remove("fighting");
  }, 1800);

  // Setelah sampai permukaan, tampilkan popup
  setTimeout(() => {
    struggleFish.classList.add("hidden");
    
    score += fish.points;
    fishCount += 1;
    virtualReward += fish.reward;

    scoreEl.textContent = score;
    fishCountEl.textContent = fishCount;
    rewardEl.textContent = `${virtualReward.toFixed(1)} USDC`;

    showCatchPopup(fish);
    if (virtualReward >= 3) claimBtn.disabled = false;
  }, 2800);
}

function catchRandomFish() {
  const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
  catchWithStruggle(type);
}

// ===== LEADERBOARD =====
function getLeaderboard() {
  return JSON.parse(localStorage.getItem("arcfish_leaderboard") || "[]");
}
function renderLeaderboard() {
  const board = getLeaderboard();
  if (board.length === 0) {
    leaderboardList.innerHTML = `<div class="lb-empty">No scores yet</div>`;
    return;
  }
  leaderboardList.innerHTML = board.map((p, i) => `
    <div class="lb-item">
      <div class="lb-rank">#${i+1}</div>
      <div class="lb-name">${p.name}</div>
      <div class="lb-score">${p.score}</div>
    </div>
  `).join("");
}
saveScoreBtn.addEventListener("click", () => {
  if (!currentUsername || score === 0) return;
  let board = getLeaderboard();
  const exist = board.find(p => p.name === currentUsername);
  if (exist) {
    if (score > exist.score) exist.score = score;
  } else {
    board.push({ name: currentUsername, score });
  }
  board.sort((a,b) => b.score - a.score);
  board = board.slice(0, 10);
  localStorage.setItem("arcfish_leaderboard", JSON.stringify(board));
  renderLeaderboard();
  showMessage("Score saved!", "success");
});

// ===== WALLET & TX =====
async function switchToArcNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + ARC_CHAIN_ID.toString(16) }],
    });
  } catch (e) {
    if (e.code === 4902) {
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
    } else throw e;
  }
}

async function connectWallet() {
  if (!window.ethereum) return showMessage("Install MetaMask!", "error");
  try {
    showTxStatus("Connecting...", "pending");
    await switchToArcNetwork();
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    walletInfo.textContent = `${userAddress.slice(0,6)}...${userAddress.slice(-4)}`;
    connectBtn.textContent = "Connected ✓";
    connectBtn.disabled = true;
    castBtn.disabled = false;
    showMessage("Connected!", "success");
    showTxStatus("");
  } catch (e) {
    showMessage("Gagal connect", "error");
    showTxStatus("");
  }
}

async function sendCastTransaction() {
  if (isProcessingTx || !signer) return false;
  isProcessingTx = true;
  castBtn.disabled = true;
  try {
    showTxStatus("Sending Cast Line... Confirm in MetaMask", "pending");
    const tx = await signer.sendTransaction({ to: userAddress, value: 0, gasLimit: 100000 });
    showTxStatus(`Waiting... ${tx.hash.slice(0,10)}...`, "pending");
    await tx.wait();
    showTxStatus("✅ Confirmed!", "success");
    isProcessingTx = false;
    return true;
  } catch (e) {
    showTxStatus("Failed", "error");
    showMessage(e.reason || e.message || "Rejected", "error");
    isProcessingTx = false;
    castBtn.disabled = false;
    return false;
  }
}

function spawnFish() {
  const el = document.createElement("div");
  el.className = "fish";
  const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
  el.textContent = type.emoji;
  el.style.top = `${160 + Math.random() * 180}px`;
  el.style.left = "-100px";
  const dur = 9 + Math.random() * 4;
  el.style.animationDuration = dur + "s";

  el.addEventListener("click", () => {
    if (!isCasting) return;
    el.remove();
    catchWithStruggle(type);
  });

  gameArea.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000);
}

// CAST
castBtn.addEventListener("click", async () => {
  if (isCasting || isProcessingTx) return;
  const ok = await sendCastTransaction();
  if (!ok) return;

  isCasting = true;
  castBtn.disabled = true;
  reelBtn.disabled = false;
  hook.style.top = "75%";
  showMessage("Line cast!");

  // Selalu dapat ikan + struggle
  setTimeout(() => catchRandomFish(), 800);
  if (Math.random() > 0.4) setTimeout(() => catchRandomFish(), 3200);

  for (let i = 0; i < 7; i++) {
    setTimeout(spawnFish, 1000 + i * 600);
  }
});

// REEL
reelBtn.addEventListener("click", () => {
  if (!isCasting) return;
  hook.style.top = "32%";
  isCasting = false;
  reelBtn.disabled = true;
  castBtn.disabled = false;
  document.querySelectorAll(".fish").forEach(f => f.remove());
  struggleFish.classList.add("hidden");
  showMessage("Line reeled in!");
});

// CLAIM
claimBtn.addEventListener("click", () => {
  if (virtualReward < 3) return;
  showMessage(`Claimed ${virtualReward.toFixed(1)} USDC virtual!`);
  virtualReward = 0;
  rewardEl.textContent = "0 USDC";
  claimBtn.disabled = true;
});

connectBtn.addEventListener("click", connectWallet);
renderLeaderboard();

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
