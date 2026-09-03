const ARC_CHAIN_ID = 5042002;
const ARC_RPC = "https://rpc.testnet.arc.network";

let provider, signer, userAddress;
let score = 0, fishCount = 0;
let isCasting = false, isProcessing = false;
let username = localStorage.getItem("arcfish_user") || "";

const fishList = [
  {e:"🐟",n:"Blue Fish",p:12},
  {e:"🐠",n:"Clownfish",p:18},
  {e:"🐡",n:"Puffer",p:25},
  {e:"🦈",n:"Shark",p:60},
  {e:"🐋",n:"Whale",p:120},
  {e:"🐬",n:"Dolphin",p:45},
  {e:"🐙",n:"Octopus",p:40},
  {e:"🦑",n:"Squid",p:35},
  {e:"🦐",n:"Shrimp",p:8},
  {e:"🦞",n:"Lobster",p:55},
  {e:"🦀",n:"Crab",p:30},
  {e:"🌟",n:"Golden Star",p:90},
  {e:"💎",n:"Diamond Fish",p:150},
  {e:"👑",n:"King Fish",p:200},
  {e:"🐉",n:"Sea Dragon",p:300},
  {e:"🌈",n:"Rainbow",p:110},
  {e:"🔥",n:"Fire Fish",p:80},
  {e:"❄️",n:"Ice Fish",p:75},
  {e:"⚡",n:"Thunder",p:85},
  {e:"🌙",n:"Moon Fish",p:95}
];

// Elements
const startScreen = document.getElementById("startScreen");
const game = document.getElementById("game");
const usernameInput = document.getElementById("usernameInput");
const setUsernameBtn = document.getElementById("setUsernameBtn");
const playerName = document.getElementById("playerName");
const scoreEl = document.getElementById("score");
const fishCountEl = document.getElementById("fishCount");
const connectBtn = document.getElementById("connectBtn");
const castBtn = document.getElementById("castBtn");
const walletInfo = document.getElementById("walletInfo");
const hook = document.getElementById("hook");
const struggle = document.getElementById("struggle");
const catchModal = document.getElementById("catchModal");
const catchEmoji = document.getElementById("catchEmoji");
const catchName = document.getElementById("catchName");
const catchPoints = document.getElementById("catchPoints");
const closeModal = document.getElementById("closeModal");
const leaderboardList = document.getElementById("leaderboardList");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const toast = document.getElementById("message");

// ===== USERNAME =====
if (username) {
  startScreen.classList.add("hidden");
  game.classList.remove("hidden");
  playerName.textContent = username;
} 

setUsernameBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (name.length < 3) return alert("Minimal 3 karakter");
  username = name;
  localStorage.setItem("arcfish_user", name);
  startScreen.classList.add("hidden");
  game.classList.remove("hidden");
  playerName.textContent = name;
};

// ===== LEADERBOARD (Top 100) =====
function getLB() {
  return JSON.parse(localStorage.getItem("arcfish_lb") || "[]");
}

function renderLB() {
  const lb = getLB().slice(0, 100);
  if (!lb.length) {
    leaderboardList.innerHTML = `<div style="text-align:center;opacity:0.5;padding:20px">Belum ada score</div>`;
    return;
  }
  leaderboardList.innerHTML = lb.map((p, i) => `
    <div class="lb-item">
      <span class="lb-rank">#${i+1}</span>
      <span>${p.name}</span>
      <span class="lb-score">${p.score}</span>
    </div>
  `).join("");
}

saveScoreBtn.onclick = () => {
  if (!username || score === 0) return;
  let lb = getLB();
  const exist = lb.find(x => x.name === username);
  if (exist) {
    if (score > exist.score) exist.score = score;
  } else {
    lb.push({ name: username, score });
  }
  lb.sort((a, b) => b.score - a.score);
  lb = lb.slice(0, 100);
  localStorage.setItem("arcfish_lb", JSON.stringify(lb));
  renderLB();
  showToast("Score tersimpan!");
};

renderLB();

// ===== HELPERS =====
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function showCatch(fish) {
  catchEmoji.textContent = fish.e;
  catchName.textContent = fish.n;
  catchPoints.textContent = `+${fish.p} points`;
  catchModal.classList.remove("hidden");
}
closeModal.onclick = () => catchModal.classList.add("hidden");

// ===== CATCH WITH STRUGGLE =====
function doCatch() {
  const fish = fishList[Math.floor(Math.random() * fishList.length)];
  
  // Tampilkan struggle
  struggle.textContent = fish.e;
  struggle.classList.remove("hidden");
  struggle.classList.add("fighting");
  struggle.style.top = "70%";

  showToast("Ikan melawan!");

  setTimeout(() => {
    struggle.style.top = "40%";
  }, 1600);

  setTimeout(() => {
    struggle.classList.add("hidden");
    struggle.classList.remove("fighting");

    score += fish.p;
    fishCount += 1;
    scoreEl.textContent = score;
    fishCountEl.textContent = fishCount;

    showCatch(fish);
  }, 2600);
}

// ===== WALLET =====
async function connect() {
  if (!window.ethereum) return showToast("Install MetaMask!");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + ARC_CHAIN_ID.toString(16) }]
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
          blockExplorerUrls: ["https://testnet.arcscan.app"]
        }]
      });
    }
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  walletInfo.textContent = userAddress.slice(0,6) + "..." + userAddress.slice(-4);
  connectBtn.textContent = "Connected";
  connectBtn.disabled = true;
  castBtn.disabled = false;
  showToast("Connected to Arc Testnet");
}

connectBtn.onclick = connect;

// ===== CAST (ON-CHAIN) =====
castBtn.onclick = async () => {
  if (isCasting || isProcessing || !signer) return;

  isProcessing = true;
  castBtn.disabled = true;

  try {
    showToast("Confirm transaction in MetaMask...");
    const tx = await signer.sendTransaction({
      to: userAddress,
      value: 0,
      gasLimit: 100000
    });
    showToast("Waiting confirmation...");
    await tx.wait();

    // Sukses → mulai mancing
    isCasting = true;
    hook.style.top = "78%";
    showToast("Line cast!");

    // Selalu dapat ikan + struggle
    setTimeout(doCatch, 900);

    // Reset setelah beberapa detik
    setTimeout(() => {
      hook.style.top = "35%";
      isCasting = false;
      castBtn.disabled = false;
      isProcessing = false;
    }, 4500);

  } catch (err) {
    showToast(err.reason || err.message || "Transaction rejected");
    castBtn.disabled = false;
    isProcessing = false;
  }
};

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
}
