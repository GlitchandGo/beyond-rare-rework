/******** Global Variables & Persistent Storage ********/
let points = localStorage.getItem("points") ? parseInt(localStorage.getItem("points")) : 0;
let startTime = localStorage.getItem("startTime") ? parseInt(localStorage.getItem("startTime")) : Date.now();
localStorage.setItem("startTime", startTime);
let autoClickersCount = localStorage.getItem("autoClickersCount") ? parseInt(localStorage.getItem("autoClickersCount")) : 0;
let autoInterval = null;
let doublePointsActive = false, goldenClickReady = false;
let luckBoostActive = false, timeFreezeActive = false, goldenModeActive = false;
let totalClicks = localStorage.getItem("totalClicks") ? parseInt(localStorage.getItem("totalClicks")) : 0;
let logData = JSON.parse(localStorage.getItem("logData")) || [];
let shopPriceMultiplier = localStorage.getItem("shopPriceMultiplier") ? parseFloat(localStorage.getItem("shopPriceMultiplier")) : 1;
let upstageCount = localStorage.getItem("upstageCount") ? parseInt(localStorage.getItem("upstageCount")) : 0;

// Player identification for leaderboard
let playerId = localStorage.getItem("playerId") || generatePlayerId();
let playerName = localStorage.getItem("playerName") || "Player_" + playerId.substring(0, 6);
localStorage.setItem("playerId", playerId);
localStorage.setItem("playerName", playerName);

// Achievements system
let unlockedAchievements = JSON.parse(localStorage.getItem("unlockedAchievements")) || [];
let achievementQueue = [];
let isShowingAchievement = false;

// Shop items purchased tracking
let purchasedShopItems = JSON.parse(localStorage.getItem("purchasedShopItems")) || {};

/******** Shop Base Prices ********/
const SHOP_PRICES = {
  autoClicker: 100,
  doublePoints: 200,
  goldenClick: 400,
  luckBoost: 500,
  timeFreeze: 250,
  goldenMode: 2000
};

// Total shop item types for completion tracking
const TOTAL_SHOP_ITEMS = Object.keys(SHOP_PRICES).length;

/******** Rarity Definitions ********/
const rarities = [
  { name: "Average", chance: 40.003 },
  { name: "Common", chance: 20 },
  { name: "Uncommon", chance: 17.6 },
  { name: "Slightly Rare", chance: 10 },
  { name: "Rare", chance: 5 },
  { name: "More Rare", chance: 3 },
  { name: "Very Rare", chance: 2 },
  { name: "Super Rare", chance: 1 },
  { name: "Ultra Rare", chance: 0.5 },
  { name: "Epic", chance: 0.4 },
  { name: "More Epic", chance: 0.2 },
  { name: "Very Epic", chance: 0.15 },
  { name: "Super Epic", chance: 0.12 },
  { name: "Ultra Epic", chance: 0.1 },
  { name: "Legendary", chance: 0.08 },
  { name: "Legendary +", chance: 0.07 },
  { name: "Super Legendary", chance: 0.06 },
  { name: "Ultra Legendary", chance: 0.05 },
  { name: "Mythical", chance: 0.045 },
  { name: "Ultra Mythical", chance: 0.04 },
  { name: "Chroma", chance: 0.03 },
  { name: "Super Chroma", chance: 0.025 },
  { name: "Ultra Chroma", chance: 0.022 },
  { name: "Magical", chance: 0.02 },
  { name: "Super Magical", chance: 0.018 },
  { name: "Ultra Magical", chance: 0.016 },
  { name: "Extreme", chance: 0.015 },
  { name: "Ultra Extreme", chance: 0.012 },
  { name: "Ethereal", chance: 0.01 },
  { name: "Ultra Ethereal", chance: 0.008 },
  { name: "Stellar", chance: 0.006 },
  { name: "Ultra Stellar", chance: 0.005 },
  { name: "Extraordinary", chance: 0.003 },
  { name: "Ultra Extraordinary", chance: 0.002 },
  { name: "Unknown", chance: 0.001 },
  { name: "Glitched", chance: 0.0005 }
];

const TOTAL_RARITIES = rarities.length;

const rarityPoints = {
  "Average": 0,
  "Common": 0,
  "Uncommon": 0,
  "Slightly Rare": 1,
  "Rare": 2,
  "More Rare": 2,
  "Very Rare": 3,
  "Super Rare": 5,
  "Ultra Rare": 8,
  "Epic": 10,
  "More Epic": 15,
  "Very Epic": 20,
  "Super Epic": 25,
  "Ultra Epic": 30,
  "Legendary": 40,
  "Legendary +": 50,
  "Super Legendary": 75,
  "Ultra Legendary": 90,
  "Mythical": 100,
  "Ultra Mythical": 150,
  "Chroma": 200,
  "Super Chroma": 250,
  "Ultra Chroma": 350,
  "Magical": 500,
  "Super Magical": 750,
  "Ultra Magical": 900,
  "Extreme": 1000,
  "Ultra Extreme": 1200,
  "Ethereal": 1500,
  "Ultra Ethereal": 1800,
  "Stellar": 2000,
  "Ultra Stellar": 2500,
  "Extraordinary": 3000,
  "Ultra Extraordinary": 4000,
  "Unknown": 5000,
  "Glitched": 10000
};

/******** Permanent Backgrounds ********/
const backgroundsPermanent = {
  "White": { cost: 200, requiredRarity: "Common", color: "#ffffff" },
  "Light Red": { cost: 200, requiredRarity: "Mythical", color: "#ffcccb" },
  "Medium Red": { cost: 200, requiredRarity: "Mythical", color: "#ff6666" },
  "Dark Red": { cost: 200, requiredRarity: "Mythical", color: "#8b0000" },
  "Light Blue": { cost: 200, requiredRarity: "Rare", color: "#add8e6" },
  "Medium Blue": { cost: 200, requiredRarity: "Rare", color: "#6495ed" },
  "Dark Blue": { cost: 200, requiredRarity: "Rare", color: "#00008b" },
  "Light Yellow": { cost: 200, requiredRarity: "Legendary", color: "#fffacd" },
  "Medium Yellow": { cost: 200, requiredRarity: "Legendary", color: "#f0e68c" },
  "Dark Yellow": { cost: 200, requiredRarity: "Legendary", color: "#ffd700" },
  "Light Orange": { cost: 200, requiredRarity: "Chroma", color: "#ffdab9" },
  "Medium Orange": { cost: 200, requiredRarity: "Chroma", color: "#ffa500" },
  "Dark Orange": { cost: 200, requiredRarity: "Chroma", color: "#ff8c00" },
  "Light Green": { cost: 200, requiredRarity: "Uncommon", color: "#90ee90" },
  "Medium Green": { cost: 200, requiredRarity: "Uncommon", color: "#32cd32" },
  "Dark Green": { cost: 200, requiredRarity: "Uncommon", color: "#006400" },
  "Light Purple": { cost: 200, requiredRarity: "Epic", color: "#d8bfd8" },
  "Medium Purple": { cost: 200, requiredRarity: "Epic", color: "#9370db" },
  "Dark Purple": { cost: 200, requiredRarity: "Epic", color: "#4b0082" },
  "Rainbow": { cost: 500, requiredRarity: "Chroma", color: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)" },
  "Red-Blue Gradient": { cost: 400, requiredRarity: "Ultra Legendary", color: "linear-gradient(45deg, red, blue)" },
  "Red-Yellow Gradient": { cost: 400, requiredRarity: "Ultra Legendary", color: "linear-gradient(45deg, red, yellow)" },
  "Blue-Yellow Gradient": { cost: 400, requiredRarity: "Ultra Legendary", color: "linear-gradient(45deg, blue, yellow)" },
  "Ethereal Glow": { cost: 600, requiredRarity: "Ethereal", color: "linear-gradient(135deg, #2e0854, #7b68ee)" },
  "Stellar Night": { cost: 800, requiredRarity: "Stellar", color: "linear-gradient(135deg, #0c0c0c, #1a1a2e, #4a4a6a)" },
  "Unknown Void": { cost: 1000, requiredRarity: "Unknown", color: "linear-gradient(135deg, #000000, #1a0a2e)" }
};

const TOTAL_PERMANENT_BACKGROUNDS = Object.keys(backgroundsPermanent).length;

/******** Seasonal Backgrounds ********/
const seasonalMainBackgrounds = [
  { name: "Cherry Blossom Bliss", cost: 500, availableMonths: [2,3,4], color: "linear-gradient(135deg, #FFC0CB, #FFFAF0)" },
  { name: "Meadow Bloom", cost: 500, availableMonths: [2,3,4], color: "linear-gradient(135deg, #50C878, #FFD700)" },
  { name: "Ocean Sunset", cost: 500, availableMonths: [5,6,7], color: "linear-gradient(135deg, #008080, #FF4500)" },
  { name: "Summer Vibes", cost: 500, availableMonths: [5,6,7], color: "linear-gradient(135deg, #40E0D0, #FFD700)" },
  { name: "Harvest Glow", cost: 500, availableMonths: [8,9,10], color: "linear-gradient(135deg, #FF8C00, #8B4513)" },
  { name: "Crisp Autumn", cost: 500, availableMonths: [8,9,10], color: "linear-gradient(135deg, #DC143C, #FFBF00)" },
  { name: "Frostbite Chill", cost: 500, availableMonths: [11,0,1], color: "linear-gradient(135deg, #B0E0E6, #DCDCDC)" },
  { name: "Snowy Cabin", cost: 500, availableMonths: [11,0,1], color: "linear-gradient(135deg, #006400, #8B4513)" }
];

const seasonalEventBackgrounds = [
  { name: "July 4th Fireworks", cost: 750, availableDates: { start: new Date(new Date().getFullYear(), 5, 15), end: new Date(new Date().getFullYear(), 6, 15) }, color: "linear-gradient(135deg, #002868, #BF0A30, #FFFFFF)" },
  { name: "Halloween Haunt", cost: 750, availableDates: { start: new Date(new Date().getFullYear(), 9, 15), end: new Date(new Date().getFullYear(), 9, 31) }, color: "linear-gradient(135deg, #555555, #FF6600, #000000)" },
  { name: "Christmas Cheer", cost: 750, availableMonths: [11], color: "linear-gradient(135deg, #D32F2F, #008000)" },
  { name: "Summer Freedom", cost: 750, availableDates: { start: new Date(new Date().getFullYear(), 4, 28), end: new Date(new Date().getFullYear(), 5, 10) }, color: "linear-gradient(135deg, #87CEEB, #FFD700, #32CD32)" },
  { name: "Happy New Year", cost: 750, availableDates: { start: new Date(new Date().getFullYear(), 0, 1), end: new Date(new Date().getFullYear(), 0, 5) }, color: "linear-gradient(135deg, #00008B, #FFD700, #C0C0C0)" }
];

const TOTAL_SEASONAL_BACKGROUNDS = seasonalMainBackgrounds.length + seasonalEventBackgrounds.length;

let ownedBackgrounds = JSON.parse(localStorage.getItem("ownedBackgrounds")) || {};
let activeBackground = localStorage.getItem("activeBackground") || "Light Blue";

let ownedSeasonalBackgrounds = JSON.parse(localStorage.getItem("ownedSeasonalBackgrounds")) || {};
let activeSeasonalBackground = localStorage.getItem("activeSeasonalBackground") || "";

/******** Achievement Definitions ********/
const achievements = [
  // Rarity milestone achievements
  { id: "first_rare", name: "Getting Started", description: "Unlock your first Rare rarity", icon: "🌟", check: () => logData.includes("Rare") },
  { id: "first_epic", name: "Epic Discovery", description: "Unlock your first Epic rarity", icon: "💜", check: () => logData.includes("Epic") },
  { id: "first_legendary", name: "Legendary Hunter", description: "Unlock your first Legendary rarity", icon: "⭐", check: () => logData.includes("Legendary") },
  { id: "first_mythical", name: "Myth Seeker", description: "Unlock your first Mythical rarity", icon: "🔥", check: () => logData.includes("Mythical") },
  { id: "first_chroma", name: "Rainbow Chaser", description: "Unlock your first Chroma rarity", icon: "🌈", check: () => logData.includes("Chroma") },
  { id: "first_ethereal", name: "Beyond Reality", description: "Unlock your first Ethereal rarity", icon: "👻", check: () => logData.includes("Ethereal") },
  { id: "first_stellar", name: "Star Gazer", description: "Unlock your first Stellar rarity", icon: "✨", check: () => logData.includes("Stellar") },
  { id: "first_unknown", name: "The Unknown", description: "Unlock the Unknown rarity", icon: "❓", check: () => logData.includes("Unknown") },
  { id: "glitched", name: "System Error", description: "Unlock the Glitched rarity", icon: "🐛", check: () => logData.includes("Glitched") },
  
  // Completion percentage achievements
  { id: "complete_10", name: "Just Beginning", description: "Reach 10% completion", icon: "📊", check: () => calculateCompletionPercentage() >= 10 },
  { id: "complete_25", name: "Quarter Way", description: "Reach 25% completion", icon: "📈", check: () => calculateCompletionPercentage() >= 25 },
  { id: "complete_50", name: "Halfway There", description: "Reach 50% completion", icon: "🎯", check: () => calculateCompletionPercentage() >= 50 },
  { id: "complete_75", name: "Almost Done", description: "Reach 75% completion", icon: "🏆", check: () => calculateCompletionPercentage() >= 75 },
  { id: "complete_100", name: "Completionist", description: "Reach 100% completion", icon: "👑", check: () => calculateCompletionPercentage() >= 100 },
  
  // Shop achievements
  { id: "first_purchase", name: "First Purchase", description: "Buy your first shop item", icon: "🛒", check: () => Object.keys(purchasedShopItems).length >= 1 },
  { id: "all_shop", name: "Big Spender", description: "Purchase all shop item types", icon: "💰", check: () => Object.keys(purchasedShopItems).length >= TOTAL_SHOP_ITEMS },
  
  // Background achievements
  { id: "first_bg", name: "Interior Designer", description: "Purchase your first background", icon: "🎨", check: () => Object.keys(ownedBackgrounds).length >= 1 },
  { id: "all_perm_bg", name: "Background Master", description: "Own all permanent backgrounds", icon: "🖼️", check: () => Object.keys(ownedBackgrounds).length >= TOTAL_PERMANENT_BACKGROUNDS },
  
  // Click milestones
  { id: "clicks_100", name: "Clicker", description: "Reach 100 total clicks", icon: "👆", check: () => totalClicks >= 100 },
  { id: "clicks_1000", name: "Dedicated Clicker", description: "Reach 1,000 total clicks", icon: "🖱️", check: () => totalClicks >= 1000 },
  { id: "clicks_10000", name: "Click Master", description: "Reach 10,000 total clicks", icon: "⚡", check: () => totalClicks >= 10000 },
  
  // Upstage achievement
  { id: "first_upstage", name: "New Game+", description: "Upstage for the first time", icon: "🔄", check: () => upstageCount >= 1 }
];

/******** Leaderboard Data (simulated online storage) ********/
// In a real implementation, this would use a backend service
// For now, we use localStorage to simulate, with mock data for demonstration
let leaderboardData = JSON.parse(localStorage.getItem("leaderboardData")) || [];

// Leaderboard update throttle (prevent spam writes)
let lastLeaderboardUpdate = 0;
const LEADERBOARD_UPDATE_INTERVAL = 30000; // 30 seconds minimum between updates

/******** Helper Functions ********/
function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

function calculateCompletionPercentage() {
  // Weight distribution for completion:
  // - Rarities: 50% (most important)
  // - Permanent Backgrounds: 25%
  // - Seasonal Backgrounds: 15%
  // - Shop Items: 10%
  
  const raritiesUnlocked = logData.length;
  const raritiesWeight = 50;
  const raritiesPercent = (raritiesUnlocked / TOTAL_RARITIES) * raritiesWeight;
  
  const permBgOwned = Object.keys(ownedBackgrounds).length;
  const permBgWeight = 25;
  const permBgPercent = (permBgOwned / TOTAL_PERMANENT_BACKGROUNDS) * permBgWeight;
  
  const seasonalBgOwned = Object.keys(ownedSeasonalBackgrounds).length;
  const seasonalBgWeight = 15;
  const seasonalBgPercent = (seasonalBgOwned / TOTAL_SEASONAL_BACKGROUNDS) * seasonalBgWeight;
  
  const shopItemsPurchased = Object.keys(purchasedShopItems).length;
  const shopWeight = 10;
  const shopPercent = (shopItemsPurchased / TOTAL_SHOP_ITEMS) * shopWeight;
  
  const totalPercent = raritiesPercent + permBgPercent + seasonalBgPercent + shopPercent;
  
  return Math.min(100, Math.round(totalPercent * 100) / 100);
}

function getCompletionBreakdown() {
  return {
    rarities: {
      current: logData.length,
      total: TOTAL_RARITIES,
      percent: Math.round((logData.length / TOTAL_RARITIES) * 100)
    },
    permanentBackgrounds: {
      current: Object.keys(ownedBackgrounds).length,
      total: TOTAL_PERMANENT_BACKGROUNDS,
      percent: Math.round((Object.keys(ownedBackgrounds).length / TOTAL_PERMANENT_BACKGROUNDS) * 100)
    },
    seasonalBackgrounds: {
      current: Object.keys(ownedSeasonalBackgrounds).length,
      total: TOTAL_SEASONAL_BACKGROUNDS,
      percent: Math.round((Object.keys(ownedSeasonalBackgrounds).length / TOTAL_SEASONAL_BACKGROUNDS) * 100)
    },
    shopItems: {
      current: Object.keys(purchasedShopItems).length,
      total: TOTAL_SHOP_ITEMS,
      percent: Math.round((Object.keys(purchasedShopItems).length / TOTAL_SHOP_ITEMS) * 100)
    }
  };
}

/******** Achievement System ********/
function checkAchievements() {
  achievements.forEach(achievement => {
    if (!unlockedAchievements.includes(achievement.id) && achievement.check()) {
      unlockAchievement(achievement);
    }
  });
}

function unlockAchievement(achievement) {
  if (unlockedAchievements.includes(achievement.id)) return;
  
  unlockedAchievements.push(achievement.id);
  localStorage.setItem("unlockedAchievements", JSON.stringify(unlockedAchievements));
  
  // Queue the achievement popup
  achievementQueue.push(achievement);
  processAchievementQueue();
}

function processAchievementQueue() {
  if (isShowingAchievement || achievementQueue.length === 0) return;
  
  isShowingAchievement = true;
  const achievement = achievementQueue.shift();
  showAchievementPopup(achievement);
}

function showAchievementPopup(achievement) {
  const popup = document.createElement("div");
  popup.className = "achievement-popup";
  popup.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-content">
      <div class="achievement-title">Achievement Unlocked!</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.description}</div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Trigger animation
  setTimeout(() => popup.classList.add("show"), 10);
  
  // Remove after delay
  setTimeout(() => {
    popup.classList.remove("show");
    popup.classList.add("hide");
    setTimeout(() => {
      popup.remove();
      isShowingAchievement = false;
      processAchievementQueue();
    }, 500);
  }, 3000);
}

/******** Leaderboard Functions ********/
function updateLeaderboard() {
  const now = Date.now();
  if (now - lastLeaderboardUpdate < LEADERBOARD_UPDATE_INTERVAL) return;
  
  lastLeaderboardUpdate = now;
  
  const playerData = {
    id: playerId,
    name: playerName,
    percent: calculateCompletionPercentage(),
    timestamp: now
  };
  
  // Update or add player data
  const existingIndex = leaderboardData.findIndex(p => p.id === playerId);
  if (existingIndex >= 0) {
    leaderboardData[existingIndex] = playerData;
  } else {
    leaderboardData.push(playerData);
  }
  
  // Sort by percentage (descending), then by timestamp (earlier = higher rank for ties)
  leaderboardData.sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.timestamp - b.timestamp;
  });
  
  // Keep only top 100
  leaderboardData = leaderboardData.slice(0, 100);
  
  localStorage.setItem("leaderboardData", JSON.stringify(leaderboardData));
}

function getLeaderboard() {
  return leaderboardData;
}

function displayLeaderboard() {
  const leaderboardList = document.getElementById("leaderboardList");
  if (!leaderboardList) return;
  
  leaderboardList.innerHTML = "";
  
  const data = getLeaderboard();
  
  if (data.length === 0) {
    leaderboardList.innerHTML = "<li class='leaderboard-empty'>No players yet. Keep playing!</li>";
    return;
  }
  
  data.forEach((player, index) => {
    const li = document.createElement("li");
    li.className = "leaderboard-entry";
    if (player.id === playerId) {
      li.classList.add("leaderboard-self");
    }
    
    let rankIcon = "";
    if (index === 0) rankIcon = "🥇";
    else if (index === 1) rankIcon = "🥈";
    else if (index === 2) rankIcon = "🥉";
    else rankIcon = `#${index + 1}`;
    
    li.innerHTML = `
      <span class="leaderboard-rank">${rankIcon}</span>
      <span class="leaderboard-name">${escapeHtml(player.name)}</span>
      <span class="leaderboard-percent">${player.percent.toFixed(1)}%</span>
    `;
    
    leaderboardList.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function changePlayerName() {
  const newName = prompt("Enter your new name (max 20 characters):", playerName);
  if (newName && newName.trim().length > 0) {
    playerName = newName.trim().substring(0, 20);
    localStorage.setItem("playerName", playerName);
    updateLeaderboard();
    displayLeaderboard();
    updateStats();
  }
}

/******** Timer Update (every 100ms) ********/
function updateTimer() {
  if (!timeFreezeActive) {
    const now = Date.now();
    const secondsElapsed = ((now - startTime) / 1000).toFixed(1);
    document.getElementById("timer").innerText = "Time: " + secondsElapsed + "s";
    localStorage.setItem("startTime", startTime);
  }
}
setInterval(updateTimer, 100);

/******** Display Update Functions ********/
function updateShopDisplays() {
  document.getElementById("pointsDisplay").innerText = points;
  document.getElementById("autoCount").innerText = autoClickersCount;
  document.getElementById("doubleStatus").innerText = doublePointsActive ? "On" : "Off";
  document.getElementById("goldenStatus").innerText = goldenClickReady ? "Ready" : "Not Ready";
  document.getElementById("luckBoostStatus").innerText = luckBoostActive ? "Active" : "Inactive";
  document.getElementById("timeFreezeStatus").innerText = timeFreezeActive ? "Active" : "Inactive";
  document.getElementById("goldenModeStatus").innerText = goldenModeActive ? "Active" : "Inactive";
  
  document.getElementById("autoClickerBtn").innerText = "Buy Auto Clicker (" + Math.round(SHOP_PRICES.autoClicker * shopPriceMultiplier) + " pts)";
  document.getElementById("doublePointsBtn").innerText = "Buy Double Points (" + Math.round(SHOP_PRICES.doublePoints * shopPriceMultiplier) + " pts)";
  document.getElementById("goldenClickBtn").innerText = "Buy Golden Click (" + Math.round(SHOP_PRICES.goldenClick * shopPriceMultiplier) + " pts)";
  document.getElementById("luckBoostBtn").innerText = "Buy Luck Boost (" + Math.round(SHOP_PRICES.luckBoost * shopPriceMultiplier) + " pts)";
  document.getElementById("timeFreezeBtn").innerText = "Buy Time Freeze (" + Math.round(SHOP_PRICES.timeFreeze * shopPriceMultiplier) + " pts)";
  document.getElementById("goldenModeBtn").innerText = "Buy Golden Mode (" + Math.round(SHOP_PRICES.goldenMode * shopPriceMultiplier) + " pts)";
}

function updateLogElement() {
  const logElem = document.getElementById("log");
  logElem.innerHTML = "";
  logData.sort((a, b) => (rarityPoints[a] || 0) - (rarityPoints[b] || 0));
  logData.forEach(rarity => {
    let li = document.createElement("li");
    li.textContent = rarity;
    li.className = getClassName(rarity);
    logElem.appendChild(li);
  });
}

function updateStats() {
  document.getElementById("totalClicks").textContent = totalClicks;
  let rarestValue = 0, rarest = "None";
  logData.forEach(rarityName => {
    let value = rarityPoints[rarityName] || 0;
    if (value > rarestValue) {
      rarestValue = value;
      rarest = rarityName;
    }
  });
  document.getElementById("rarestFind").textContent = rarest;
  
  // Update completion percentage display
  const completionPercent = calculateCompletionPercentage();
  const completionDisplay = document.getElementById("completionPercent");
  if (completionDisplay) {
    completionDisplay.textContent = completionPercent.toFixed(1) + "%";
  }
  
  // Update completion breakdown
  const breakdown = getCompletionBreakdown();
  const breakdownElem = document.getElementById("completionBreakdown");
  if (breakdownElem) {
    breakdownElem.innerHTML = `
      <div class="breakdown-item">
        <span class="breakdown-label">Rarities:</span>
        <span class="breakdown-value">${breakdown.rarities.current} / ${breakdown.rarities.total}</span>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${breakdown.rarities.percent}%"></div></div>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">Permanent Backgrounds:</span>
        <span class="breakdown-value">${breakdown.permanentBackgrounds.current} / ${breakdown.permanentBackgrounds.total}</span>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${breakdown.permanentBackgrounds.percent}%"></div></div>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">Seasonal Backgrounds:</span>
        <span class="breakdown-value">${breakdown.seasonalBackgrounds.current} / ${breakdown.seasonalBackgrounds.total}</span>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${breakdown.seasonalBackgrounds.percent}%"></div></div>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">Shop Items:</span>
        <span class="breakdown-value">${breakdown.shopItems.current} / ${breakdown.shopItems.total}</span>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${breakdown.shopItems.percent}%"></div></div>
      </div>
    `;
  }
  
  // Update player name display
  const playerNameDisplay = document.getElementById("playerNameDisplay");
  if (playerNameDisplay) {
    playerNameDisplay.textContent = playerName;
  }
  
  // Update achievements display
  const achievementsElem = document.getElementById("achievementsList");
  if (achievementsElem) {
    achievementsElem.innerHTML = "";
    achievements.forEach(achievement => {
      const li = document.createElement("li");
      li.className = "achievement-item";
      if (unlockedAchievements.includes(achievement.id)) {
        li.classList.add("unlocked");
        li.innerHTML = `<span class="ach-icon">${achievement.icon}</span> <span class="ach-name">${achievement.name}</span>`;
      } else {
        li.classList.add("locked");
        li.innerHTML = `<span class="ach-icon">🔒</span> <span class="ach-name">???</span>`;
      }
      achievementsElem.appendChild(li);
    });
  }
  
  const chancesList = document.getElementById("chancesList");
  chancesList.innerHTML = "";
  rarities.forEach(rarity => {
    if (rarity.name === "Glitched" && !logData.includes("Glitched")) return;
    let li = document.createElement("li");
    li.textContent = logData.includes(rarity.name)
      ? (rarity.name + ": " + rarity.chance + "%")
      : "???";
    chancesList.appendChild(li);
  });
  
  // Mastery Medals
  let medal1 = rarities.every(r => logData.includes(r.name)) ? "🏅" : "";
  let permanentUnlocked = Object.keys(backgroundsPermanent).every(key => ownedBackgrounds[key]);
  let seasonalMainUnlocked = seasonalMainBackgrounds.every(bg => ownedSeasonalBackgrounds[bg.name]);
  let seasonalEventUnlocked = seasonalEventBackgrounds.every(bg => ownedSeasonalBackgrounds[bg.name]);
  let medal2 = (permanentUnlocked && seasonalMainUnlocked && seasonalEventUnlocked) ? "🏅" : "";
  let medal3 = (upstageCount > 0) ? "🏅" : "";
  let medals = medal1 + medal2 + medal3;
  document.getElementById("masteryMedals").innerText = "Mastery Medals: " + medals;
  
  // Upstage Button
  let indexUltraLegendary = rarities.findIndex(r => r.name === "Ultra Legendary");
  let raritiesUpToUltraLegendary = rarities.filter((r, i) => i <= indexUltraLegendary);
  let unlockUpstage = raritiesUpToUltraLegendary.every(r => logData.includes(r.name));
  document.getElementById("upstageButton").style.display = unlockUpstage ? "block" : "none";
  
  // Update leaderboard periodically
  updateLeaderboard();
  displayLeaderboard();
}

function getClassName(rarity) {
  return rarity.toLowerCase().replace(/ /g, "-").replace(/\+/g, "plus");
}

/******** Rarity Generation ********/
function generateRarity(isManual = true) {
  totalClicks++;
  localStorage.setItem("totalClicks", totalClicks);
  
  // Check for Glitched rarity
  let canGlitch = rarities.filter(r => r.name !== "Glitched").every(r => logData.includes(r.name));
  if (canGlitch && Math.random() < 0.000005) {
    if (!logData.includes("Glitched")) {
      logData.push("Glitched");
    }
    let earned = rarityPoints["Glitched"];
    if (doublePointsActive) earned *= 2;
    points += earned;
    localStorage.setItem("logData", JSON.stringify(logData));
    updateLogElement();
    updateStats();
    document.getElementById("result").innerText = "You got: Glitched (+" + earned + " pts)";
    document.getElementById("result").className = getClassName("Glitched");
    localStorage.setItem("points", points);
    updateShopDisplays();
    checkAchievements();
    return;
  }
  
  let foundRarity = "";
  let multiplier = 1;
  
  if (isManual && goldenClickReady) {
    // Golden Click: Guaranteed Epic or above
    let eligible = rarities.filter(r => r.name !== "Glitched" && (rarityPoints[r.name] || 0) >= rarityPoints["Epic"]);
    let totalChance = eligible.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math.random() * totalChance;
    let cumulative = 0;
    for (let r of eligible) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
    goldenClickReady = false;
  } else if (goldenModeActive) {
    // Golden Mode: Only Epic or above
    let eligible = rarities.filter(r => r.name !== "Glitched" && (rarityPoints[r.name] || 0) >= rarityPoints["Epic"]);
    let totalChance = eligible.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math.random() * totalChance;
    let cumulative = 0;
    for (let r of eligible) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  } else if (luckBoostActive) {
    // Luck Boost: Doubles chances for Uncommon+
    let modifiedRarities = rarities.filter(r => r.name !== "Glitched").map(r => {
      if (r.name !== "Average" && r.name !== "Common") {
        return { name: r.name, chance: r.chance * 2 };
      }
      return { name: r.name, chance: r.chance };
    });
    let totalChance = modifiedRarities.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math.random() * totalChance;
    let cumulative = 0;
    for (let r of modifiedRarities) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  } else {
    // Normal rarity generation
    let normalRarities = rarities.filter(r => r.name !== "Glitched");
    let totalChance = normalRarities.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math.random() * totalChance;
    let cumulative = 0;
    for (let r of normalRarities) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  }
  
  if (!foundRarity) {
    foundRarity = "Average";
  }
  
  if (doublePointsActive) multiplier *= 2;
  
  let basePoints = rarityPoints[foundRarity] || 0;
  let earned = basePoints * multiplier;
  points += earned;
  localStorage.setItem("points", points);
  updateShopDisplays();
  
  const resultElem = document.getElementById("result");
  resultElem.innerText = "You got: " + foundRarity + " (+" + earned + " pts)";
  resultElem.className = getClassName(foundRarity);
  
  if (!logData.includes(foundRarity)) {
    logData.push(foundRarity);
    localStorage.setItem("logData", JSON.stringify(logData));
    updateLogElement();
  }
  updateStats();
  checkAchievements();
}

/******** Auto Clicker Functions ********/
function startAutoClickers() {
  if (autoClickersCount > 0 && !autoInterval && !timeFreezeActive) {
    autoInterval = setInterval(() => {
      for (let i = 0; i < autoClickersCount; i++) {
        generateRarity(false);
      }
    }, 2000);
  }
}

function stopAutoClickers() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
  }
}

/******** Shop Purchase Functions ********/
function purchaseAutoClicker() {
  const cost = Math.round(SHOP_PRICES.autoClicker * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    autoClickersCount++;
    localStorage.setItem("autoClickersCount", autoClickersCount);
    purchasedShopItems["autoClicker"] = true;
    localStorage.setItem("purchasedShopItems", JSON.stringify(purchasedShopItems));
    updateShopDisplays();
    startAutoClickers();
    checkAchievements();
  } else {
    alert("Not enough pts for Auto Clicker!");
  }
}

function purchaseDoublePoints() {
  const cost = Math.round(SHOP_PRICES.doublePoints * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    doublePointsActive = true;
    purchasedShopItems["doublePoints"] = true;
    localStorage.setItem("purchasedShopItems", JSON.stringify(purchasedShopItems));
    updateShopDisplays();
    checkAchievements();
    setTimeout(() => {
      doublePointsActive = false;
      updateShopDisplays();
    }, 30000);
  } else {
    alert("Not enough pts for Double Points!");
  }
}

function purchaseGoldenClick() {
  const cost = Math.round(SHOP_PRICES.goldenClick * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    goldenClickReady = true;
    purchasedShopItems["goldenClick"] = true;
    localStorage.setItem("purchasedShopItems", JSON.stringify(purchasedShopItems));
    updateShopDisplays();
    checkAchievements();
  } else {
    alert("Not enough pts for Golden Click!");
  }
}

function purchaseLuckBoost() {
  const cost = Math.round(SHOP_PRICES.luckBoost * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    luckBoostActive = true;
    purchasedShopItems["luckBoost"] = true;
    localStorage.setItem("purchasedShopItems", JSON.stringify(purchasedShopItems));
    updateShopDisplays();
    checkAchievements();
    setTimeout(() => {
      luckBoostActive = false;
      updateShopDisplays();
    }, 60000);
  } else {
    alert("Not enough pts for Luck Boost!");
  }
}

function purchaseTimeFreeze() {
  const cost = Math.round(SHOP_PRICES.timeFreeze * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    purchasedShopItems["timeFreeze"] = true;
    localStorage.setItem("purchasedShopItems", JSON.stringify(purchasedShopItems));
    updateShopDisplays();
    checkAchievements();
    if (!timeFreezeActive) {
      timeFreezeActive = true;
      let freezeStart = Date.now();
      stopAutoClickers();
      setTimeout(() => {
        timeFreezeActive = false;
        let freezeDuration = Date.now() - freezeStart;
        startTime += freezeDuration;
        localStorage.setItem("startTime", startTime);
        updateShopDisplays();
        startAutoClickers();
      }, 30000);
    }
  } else {
    alert("Not enough pts for Time Freeze!");
  }
}

function purchaseGoldenMode() {
  const cost = Math.round(SHOP_PRICES.goldenMode * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    purchasedShopItems["goldenMode"] = true;
    localStorage.setItem("purchasedShopItems", JSON.stringify(purchasedShopItems));
    updateShopDisplays();
    checkAchievements();
    if (!goldenModeActive) {
      goldenModeActive = true;
      updateShopDisplays();
      document.body.style.background = "#FFD700";
      setTimeout(() => {
        goldenModeActive = false;
        restoreBackground();
        updateShopDisplays();
      }, 30000);
    }
  } else {
    alert("Not enough pts for Golden Mode!");
  }
}

/******** Background Shop Functions ********/
function updateBackgroundShop() {
  const list = document.getElementById("backgroundShopList");
  list.innerHTML = "";
  
  // Header for Permanent Backgrounds
  const headerFixed = document.createElement("h5");
  headerFixed.textContent = "Permanent Backgrounds";
  list.appendChild(headerFixed);
  
  for (const bgName in backgroundsPermanent) {
    const bgData = backgroundsPermanent[bgName];
    const li = document.createElement("li");
    li.style.background = bgData.color;
    const textOverlay = document.createElement("div");
    textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    textOverlay.style.padding = "5px";
    textOverlay.textContent = `${bgName} - ${bgData.cost} pts (Requires ${bgData.requiredRarity})`;
    li.appendChild(textOverlay);
    
    if (ownedBackgrounds[bgName]) {
      if (activeBackground === bgName && activeSeasonalBackground === "") {
        const activeLabel = document.createElement("div");
        activeLabel.textContent = "Active";
        activeLabel.style.backgroundColor = "rgba(0,0,0,0.7)";
        activeLabel.style.color = "white";
        activeLabel.style.padding = "5px";
        li.appendChild(activeLabel);
      } else {
        const selectBtn = document.createElement("button");
        selectBtn.textContent = "Select";
        selectBtn.onclick = () => setBackground(bgName);
        li.appendChild(selectBtn);
      }
    } else {
      if (points >= bgData.cost && logHasRarity(bgData.requiredRarity)) {
        const buyBtn = document.createElement("button");
        buyBtn.textContent = "Buy";
        buyBtn.onclick = () => purchaseBackground(bgName);
        li.appendChild(buyBtn);
      } else {
        li.classList.add("disabled");
      }
    }
    list.appendChild(li);
  }
  
  // Add Seasonal Backgrounds
  addSeasonalBackgroundsToShop(list);
}

function addSeasonalBackgroundsToShop(list) {
  // Header for Main Seasonal Backgrounds
  const headerMain = document.createElement("h5");
  headerMain.textContent = "Seasonal Backgrounds";
  list.appendChild(headerMain);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  
  let hasSeasonalItems = false;
  
  seasonalMainBackgrounds.forEach(bg => {
    let available = false;
    if (bg.availableMonths) {
      if (bg.availableMonths.includes(currentMonth)) {
        available = true;
      }
    } else if (bg.availableDates) {
      if (now >= bg.availableDates.start && now <= bg.availableDates.end) {
        available = true;
      }
    }
    if (available) {
      hasSeasonalItems = true;
      const li = document.createElement("li");
      li.style.background = bg.color;
      li.style.position = "relative";
      const textOverlay = document.createElement("div");
      textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      textOverlay.style.padding = "5px";
      textOverlay.textContent = `${bg.name} - ${bg.cost} pts`;
      li.appendChild(textOverlay);
      
      if (ownedSeasonalBackgrounds[bg.name]) {
        if (activeSeasonalBackground === bg.name) {
          const activeLabel = document.createElement("div");
          activeLabel.textContent = "Active";
          activeLabel.style.backgroundColor = "rgba(0,0,0,0.7)";
          activeLabel.style.color = "white";
          activeLabel.style.padding = "5px";
          li.appendChild(activeLabel);
        } else {
          const selectBtn = document.createElement("button");
          selectBtn.textContent = "Select";
          selectBtn.onclick = () => setSeasonalBackground(bg.name, bg.color);
          li.appendChild(selectBtn);
        }
      } else {
        if (points >= bg.cost) {
          const buyBtn = document.createElement("button");
          buyBtn.textContent = "Buy";
          buyBtn.onclick = () => {
            points -= bg.cost;
            localStorage.setItem("points", points);
            ownedSeasonalBackgrounds[bg.name] = true;
            localStorage.setItem("ownedSeasonalBackgrounds", JSON.stringify(ownedSeasonalBackgrounds));
            updateShopDisplays();
            updateBackgroundShop();
            checkAchievements();
          };
          li.appendChild(buyBtn);
        } else {
          li.classList.add("disabled");
        }
      }
      list.appendChild(li);
    }
  });
  
  if (!hasSeasonalItems) {
    const noItems = document.createElement("li");
    noItems.textContent = "No seasonal backgrounds available this month.";
    noItems.style.fontStyle = "italic";
    list.appendChild(noItems);
  }
  
  // Header for Special Event Backgrounds
  const headerEvent = document.createElement("h5");
  headerEvent.textContent = "Special Event Backgrounds";
  list.appendChild(headerEvent);
  
  let hasEventItems = false;
  
  seasonalEventBackgrounds.forEach(bg => {
    let available = false;
    if (bg.availableDates) {
      if (now >= bg.availableDates.start && now <= bg.availableDates.end) {
        available = true;
      }
    } else if (bg.availableMonths) {
      if (bg.availableMonths.includes(currentMonth)) {
        available = true;
      }
    }
    if (available) {
      hasEventItems = true;
      const li = document.createElement("li");
      li.style.background = bg.color;
      li.style.position = "relative";
      const limitedIcon = document.createElement("div");
      limitedIcon.textContent = "🕘";
      limitedIcon.className = "seasonal-event-icon";
      li.appendChild(limitedIcon);
      
      const textOverlay = document.createElement("div");
      textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      textOverlay.style.padding = "5px";
      textOverlay.textContent = `${bg.name} - ${bg.cost} pts`;
      li.appendChild(textOverlay);
      
      if (ownedSeasonalBackgrounds[bg.name]) {
        if (activeSeasonalBackground === bg.name) {
          const activeLabel = document.createElement("div");
          activeLabel.textContent = "Active";
          activeLabel.style.backgroundColor = "rgba(0,0,0,0.7)";
          activeLabel.style.color = "white";
          activeLabel.style.padding = "5px";
          li.appendChild(activeLabel);
        } else {
          const selectBtn = document.createElement("button");
          selectBtn.textContent = "Select";
          selectBtn.onclick = () => setSeasonalBackground(bg.name, bg.color);
          li.appendChild(selectBtn);
        }
      } else {
        if (points >= bg.cost) {
          const buyBtn = document.createElement("button");
          buyBtn.textContent = "Buy";
          buyBtn.onclick = () => {
            points -= bg.cost;
            localStorage.setItem("points", points);
            ownedSeasonalBackgrounds[bg.name] = true;
            localStorage.setItem("ownedSeasonalBackgrounds", JSON.stringify(ownedSeasonalBackgrounds));
            updateShopDisplays();
            updateBackgroundShop();
            checkAchievements();
          };
          li.appendChild(buyBtn);
        } else {
          li.classList.add("disabled");
        }
      }
      list.appendChild(li);
    }
  });
  
  if (!hasEventItems) {
    const noItems = document.createElement("li");
    noItems.textContent = "No special event backgrounds available right now.";
    noItems.style.fontStyle = "italic";
    list.appendChild(noItems);
  }
}

function purchaseBackground(bgName) {
  const bgData = backgroundsPermanent[bgName];
  if (!bgData || points < bgData.cost || !logHasRarity(bgData.requiredRarity)) return;
  points -= bgData.cost;
  localStorage.setItem("points", points);
  ownedBackgrounds[bgName] = true;
  localStorage.setItem("ownedBackgrounds", JSON.stringify(ownedBackgrounds));
  updateShopDisplays();
  updateBackgroundShop();
  checkAchievements();
}

function setBackground(bgName) {
  if (!ownedBackgrounds[bgName]) return;
  activeBackground = bgName;
  activeSeasonalBackground = "";
  localStorage.setItem("activeBackground", bgName);
  localStorage.setItem("activeSeasonalBackground", "");
  if (backgroundsPermanent[bgName]) {
    document.body.style.background = backgroundsPermanent[bgName].color;
  } else {
    document.body.style.background = "";
  }
  updateBackgroundShop();
}

function setSeasonalBackground(bgName, color) {
  activeSeasonalBackground = bgName;
  localStorage.setItem("activeSeasonalBackground", bgName);
  document.body.style.background = color;
  updateBackgroundShop();
}

function logHasRarity(requiredRarity) {
  return logData.includes(requiredRarity);
}

/******** Modal & Reset Functions ********/
function toggleSettingsModal() {
  const modal = document.getElementById("settingsModal");
  modal.style.display = (modal.style.display === "block") ? "none" : "block";
  updateShopDisplays();
  updateBackgroundShop();
  updateStats();
}

function toggleLeaderboardModal() {
  const modal = document.getElementById("leaderboardModal");
  modal.style.display = (modal.style.display === "block") ? "none" : "block";
  displayLeaderboard();
}

function resetGame() {
  if (confirm("Are you sure you want to reset the game? This will clear all progress.")) {
    points = 0;
    localStorage.setItem("points", points);
    autoClickersCount = 0;
    localStorage.setItem("autoClickersCount", 0);
    doublePointsActive = false;
    goldenClickReady = false;
    luckBoostActive = false;
    timeFreezeActive = false;
    goldenModeActive = false;
    ownedBackgrounds = {};
    activeBackground = "Light Blue";
    localStorage.removeItem("ownedBackgrounds");
    localStorage.removeItem("activeBackground");
    localStorage.removeItem("logData");
    localStorage.removeItem("totalClicks");
    localStorage.removeItem("shopPriceMultiplier");
    localStorage.removeItem("upstageCount");
    localStorage.removeItem("purchasedShopItems");
    localStorage.removeItem("unlockedAchievements");
    shopPriceMultiplier = 1;
    upstageCount = 0;
    logData = [];
    totalClicks = 0;
    purchasedShopItems = {};
    unlockedAchievements = [];
    ownedSeasonalBackgrounds = {};
    localStorage.removeItem("ownedSeasonalBackgrounds");
    activeSeasonalBackground = "";
    localStorage.removeItem("activeSeasonalBackground");
    stopAutoClickers();
    document.getElementById("log").innerHTML = "";
    updateShopDisplays();
    startTime = Date.now();
    localStorage.setItem("startTime", startTime);
    setDefaultBackground();
    updateBackgroundShop();
    updateStats();
  }
}

/******** Background Utility Functions ********/
function setDefaultBackground() {
  document.body.style.background = "linear-gradient(135deg, #e0f7fa, #fce4ec)";
}

function restoreBackground() {
  if (activeSeasonalBackground) {
    let seasonalBg = seasonalMainBackgrounds.find(bg => bg.name === activeSeasonalBackground);
    if (!seasonalBg) {
      seasonalBg = seasonalEventBackgrounds.find(bg => bg.name === activeSeasonalBackground);
    }
    if (seasonalBg) {
      document.body.style.background = seasonalBg.color;
      return;
    }
  }
  if (activeBackground && backgroundsPermanent[activeBackground]) {
    document.body.style.background = backgroundsPermanent[activeBackground].color;
  } else {
    setDefaultBackground();
  }
}

/******** Upstage Function ********/
function upstageGame() {
  if (confirm("Upstage? This will reset your rarity log and stats but keep your backgrounds. Shop prices will increase by 50%. Continue?")) {
    logData = [];
    totalClicks = 0;
    localStorage.setItem("logData", JSON.stringify(logData));
    localStorage.setItem("totalClicks", totalClicks);
    shopPriceMultiplier *= 1.5;
    localStorage.setItem("shopPriceMultiplier", shopPriceMultiplier);
    upstageCount++;
    localStorage.setItem("upstageCount", upstageCount);
    document.getElementById("log").innerHTML = "";
    updateStats();
    updateShopDisplays();
    checkAchievements();
  }
}

/******** Initialization ********/
function init() {
  // Add demo leaderboard data if empty (for demonstration)
  if (leaderboardData.length === 0) {
    leaderboardData = [
      { id: "demo_1", name: "RarityMaster", percent: 87.5, timestamp: Date.now() - 86400000 },
      { id: "demo_2", name: "ClickerPro", percent: 72.3, timestamp: Date.now() - 172800000 },
      { id: "demo_3", name: "GlitchHunter", percent: 65.1, timestamp: Date.now() - 259200000 },
      { id: "demo_4", name: "BeyondRare", percent: 54.8, timestamp: Date.now() - 345600000 },
      { id: "demo_5", name: "LegendSeeker", percent: 41.2, timestamp: Date.now() - 432000000 }
    ];
    localStorage.setItem("leaderboardData", JSON.stringify(leaderboardData));
  }
  
  updateShopDisplays();
  updateLogElement();
  updateStats();
  restoreBackground();
  startAutoClickers();
  checkAchievements();
}

/******** Main Click Button Event Listener ********/
document.getElementById("clickButton").addEventListener("click", function() {
  generateRarity(true);
});

// Initialize the game
init();
