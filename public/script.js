/**
 * Beyond Rare - Complete Game Overhaul
 * Features:
 * - Stage system with 100+ rarities unlocked progressively
 * - Max 100 auto clickers that work like manual clicks
 * - 1.5x price increase on each purchase
 * - Client-side daily tasks
 * - Server only for leaderboard (userId + username)
 * - Backgrounds and skins in shop
 */

/******** GLOBAL STATE ********/
let gameState = {
  // Core
  points: 0,
  totalClicks: 0,
  startTime: Date.now(),
  
  // Stage system
  currentStage: 1,
  stageHistory: [],
  
  // Auto clickers
  autoClickerCount: 0,
  maxAutoClickers: 100,
  
  // Pricing
  purchaseCount: 0, // Total purchases for price scaling
  
  // Unlocks
  unlockedRarities: [],
  ownedBackgrounds: {},
  ownedSkins: {},
  
  // Active effects
  activeEffects: {
    doublePoints: false,
    goldenClick: false,
    luckBoost: false,
    timeFreeze: false,
    goldenMode: false
  },
  
  // Achievements (permanent across stages)
  achievements: [],
  
  // Daily tasks (client-side)
  dailyTasks: null,
  dailyTasksDate: null,
  streakCount: 0,
  lastStreakClaim: null,
  
  // Identity
  userId: null,
  username: null,
  
  // Active background/skin
  activeBackground: 'default',
  activeSkin: 'default'
};

// Load state from localStorage
function loadGameState() {
  const saved = localStorage.getItem('beyondRareState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameState = { ...gameState, ...parsed };
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
  }
  
  // Ensure userId exists
  if (!gameState.userId) {
    gameState.userId = generateUserId();
  }
  if (!gameState.username) {
    gameState.username = generateUsername();
  }
  
  saveGameState();
}

function saveGameState() {
  localStorage.setItem('beyondRareState', JSON.stringify(gameState));
}

/******** USER ID SYSTEM ********/
function generateUserId() {
  return 'u_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function generateUsername() {
  const adjectives = ['Swift', 'Lucky', 'Rare', 'Epic', 'Cosmic', 'Stellar', 'Mighty', 'Mystic', 'Golden', 'Crystal', 'Shadow', 'Blazing', 'Frost', 'Thunder', 'Neon'];
  const nouns = ['Hunter', 'Seeker', 'Finder', 'Explorer', 'Legend', 'Master', 'Champion', 'Voyager', 'Dreamer', 'Wizard', 'Phoenix', 'Dragon', 'Knight', 'Rogue', 'Sage'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

async function checkUserIdWithServer() {
  try {
    const response = await fetch('/api/user/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: gameState.userId })
    });
    const data = await response.json();
    
    if (data.exists) {
      // UserId already exists, this is fine - we're the same user
      return true;
    } else {
      // Register this userId
      await registerWithServer();
      return true;
    }
  } catch (error) {
    console.log('Server not available, playing locally');
    return false;
  }
}

async function registerWithServer() {
  try {
    await fetch('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: gameState.userId,
        username: gameState.username
      })
    });
  } catch (error) {
    console.error('Failed to register:', error);
  }
}

async function updateUsernameOnServer() {
  try {
    await fetch('/api/user/username', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: gameState.userId,
        username: gameState.username
      })
    });
  } catch (error) {
    console.error('Failed to update username:', error);
  }
}

async function syncStatsToServer() {
  if (!isOnline) return;
  
  try {
    await fetch('/api/user/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: gameState.userId,
        username: gameState.username,
        totalClicks: gameState.totalClicks,
        points: gameState.points,
        currentStage: gameState.currentStage,
        raritiesFound: gameState.unlockedRarities.length,
        completionPercent: calculateCompletionPercent()
      })
    });
  } catch (error) {
    console.error('Failed to sync stats:', error);
  }
}

/******** STAGE-BASED RARITY SYSTEM ********/
// Base rarities for Stage 1
const STAGE_1_RARITIES = [
  { name: "Average", chance: 40, points: 0, color: "#808080" },
  { name: "Common", chance: 25, points: 0, color: "#a0a0a0" },
  { name: "Uncommon", chance: 15, points: 1, color: "#50c878" },
  { name: "Slightly Rare", chance: 10, points: 2, color: "#4169e1" },
  { name: "Rare", chance: 5, points: 5, color: "#0000ff" },
  { name: "Very Rare", chance: 2.5, points: 10, color: "#8a2be2" },
  { name: "Super Rare", chance: 1.5, points: 25, color: "#9400d3" },
  { name: "Ultra Rare", chance: 0.7, points: 50, color: "#ff00ff" },
  { name: "Epic", chance: 0.2, points: 100, color: "#ff1493" },
  { name: "Legendary", chance: 0.1, points: 250, color: "#ffd700" }
];

// Additional rarities unlocked at higher stages
const STAGE_2_RARITIES = [
  { name: "Mythical", chance: 0.08, points: 400, color: "#ff4500" },
  { name: "Super Mythical", chance: 0.06, points: 600, color: "#ff6347" },
  { name: "Ultra Mythical", chance: 0.04, points: 900, color: "#dc143c" }
];

const STAGE_3_RARITIES = [
  { name: "Chroma", chance: 0.05, points: 1200, color: "#00ffff" },
  { name: "Super Chroma", chance: 0.035, points: 1600, color: "#00ced1" },
  { name: "Ultra Chroma", chance: 0.025, points: 2000, color: "#20b2aa" }
];

const STAGE_4_RARITIES = [
  { name: "Ethereal", chance: 0.03, points: 2500, color: "#e6e6fa" },
  { name: "Super Ethereal", chance: 0.02, points: 3200, color: "#d8bfd8" },
  { name: "Ultra Ethereal", chance: 0.012, points: 4000, color: "#dda0dd" }
];

const STAGE_5_RARITIES = [
  { name: "Stellar", chance: 0.015, points: 5000, color: "#ffe4b5" },
  { name: "Super Stellar", chance: 0.01, points: 6500, color: "#ffdab9" },
  { name: "Ultra Stellar", chance: 0.007, points: 8000, color: "#ffefd5" }
];

const STAGE_6_RARITIES = [
  { name: "Cosmic", chance: 0.008, points: 10000, color: "#191970" },
  { name: "Super Cosmic", chance: 0.005, points: 13000, color: "#000080" },
  { name: "Ultra Cosmic", chance: 0.003, points: 16000, color: "#0f0f3d" }
];

const STAGE_7_RARITIES = [
  { name: "Divine", chance: 0.004, points: 20000, color: "#fff8dc" },
  { name: "Super Divine", chance: 0.0025, points: 27000, color: "#fffff0" },
  { name: "Ultra Divine", chance: 0.0015, points: 35000, color: "#fffaf0" }
];

const STAGE_8_RARITIES = [
  { name: "Transcendent", chance: 0.002, points: 45000, color: "#7fffd4" },
  { name: "Super Transcendent", chance: 0.0012, points: 60000, color: "#66cdaa" },
  { name: "Ultra Transcendent", chance: 0.0007, points: 80000, color: "#3cb371" }
];

const STAGE_9_RARITIES = [
  { name: "Infinite", chance: 0.0008, points: 100000, color: "#4b0082" },
  { name: "Super Infinite", chance: 0.0005, points: 140000, color: "#8b008b" },
  { name: "Ultra Infinite", chance: 0.0003, points: 200000, color: "#9932cc" }
];

const STAGE_10_RARITIES = [
  { name: "Omega", chance: 0.0004, points: 300000, color: "#b8860b" },
  { name: "Super Omega", chance: 0.00025, points: 450000, color: "#daa520" },
  { name: "Ultra Omega", chance: 0.00015, points: 700000, color: "#ffd700" },
  { name: "BEYOND RARE", chance: 0.0001, points: 1000000, color: "linear-gradient(90deg, red, orange, yellow, green, blue, purple)" }
];

// Secret rarity unlocked after all others
const SECRET_RARITY = { name: "???GLITCHED???", chance: 0.00005, points: 5000000, color: "#00ff00" };

function getRaritiesForStage(stage) {
  let rarities = [...STAGE_1_RARITIES];
  
  if (stage >= 2) rarities = rarities.concat(STAGE_2_RARITIES);
  if (stage >= 3) rarities = rarities.concat(STAGE_3_RARITIES);
  if (stage >= 4) rarities = rarities.concat(STAGE_4_RARITIES);
  if (stage >= 5) rarities = rarities.concat(STAGE_5_RARITIES);
  if (stage >= 6) rarities = rarities.concat(STAGE_6_RARITIES);
  if (stage >= 7) rarities = rarities.concat(STAGE_7_RARITIES);
  if (stage >= 8) rarities = rarities.concat(STAGE_8_RARITIES);
  if (stage >= 9) rarities = rarities.concat(STAGE_9_RARITIES);
  if (stage >= 10) rarities = rarities.concat(STAGE_10_RARITIES);
  
  // Add glitched rarity if all current stage rarities are unlocked
  if (hasAllCurrentRarities()) {
    rarities.push(SECRET_RARITY);
  }
  
  return rarities;
}

function hasAllCurrentRarities() {
  const currentRarities = getRaritiesForStage(gameState.currentStage);
  return currentRarities.every(r => gameState.unlockedRarities.includes(r.name));
}

function getTotalRaritiesForStage(stage) {
  return getRaritiesForStage(stage).length;
}

/******** SHOP SYSTEM ********/
const BASE_PRICES = {
  autoClicker: 100,
  doublePoints: 200,
  goldenClick: 400,
  luckBoost: 500,
  timeFreeze: 250,
  goldenMode: 2000
};

function getItemPrice(basePrice) {
  // Each purchase increases price by 1.5x
  return Math.floor(basePrice * Math.pow(1.5, gameState.purchaseCount));
}

function getAutoClickerPrice() {
  // Auto clickers scale with count owned
  return Math.floor(BASE_PRICES.autoClicker * Math.pow(1.5, gameState.autoClickerCount));
}

/******** BACKGROUNDS ********/
const BACKGROUNDS = {
  // Stage 1 backgrounds
  "Classic Blue": { cost: 200, requiredStage: 1, color: "#add8e6" },
  "Classic Green": { cost: 200, requiredStage: 1, color: "#90ee90" },
  "Classic Red": { cost: 200, requiredStage: 1, color: "#ffcccb" },
  "Classic Yellow": { cost: 200, requiredStage: 1, color: "#fffacd" },
  "Classic Purple": { cost: 200, requiredStage: 1, color: "#d8bfd8" },
  
  // Stage 2 backgrounds
  "Ocean Depth": { cost: 500, requiredStage: 2, color: "linear-gradient(135deg, #006994, #00008b)" },
  "Forest Mist": { cost: 500, requiredStage: 2, color: "linear-gradient(135deg, #228b22, #006400)" },
  "Sunset Glow": { cost: 500, requiredStage: 2, color: "linear-gradient(135deg, #ff4500, #ffd700)" },
  
  // Stage 3 backgrounds
  "Rainbow": { cost: 1000, requiredStage: 3, color: "linear-gradient(90deg, red, orange, yellow, green, blue, purple)" },
  "Aurora": { cost: 1000, requiredStage: 3, color: "linear-gradient(135deg, #00ff7f, #00bfff, #9400d3)" },
  "Twilight": { cost: 1000, requiredStage: 3, color: "linear-gradient(135deg, #191970, #4b0082, #800080)" },
  
  // Stage 4+ backgrounds
  "Ethereal Dream": { cost: 2000, requiredStage: 4, color: "linear-gradient(135deg, #e6e6fa, #dda0dd, #9370db)" },
  "Stellar Night": { cost: 3000, requiredStage: 5, color: "linear-gradient(135deg, #0c0c0c, #1a1a2e, #4a4a6a)" },
  "Cosmic Void": { cost: 5000, requiredStage: 6, color: "linear-gradient(135deg, #000, #0f0f3d, #191970)" },
  "Divine Light": { cost: 8000, requiredStage: 7, color: "linear-gradient(135deg, #fff8dc, #ffd700, #fff)" },
  "Transcendence": { cost: 15000, requiredStage: 8, color: "linear-gradient(135deg, #7fffd4, #00fa9a, #00ced1)" },
  "Infinite Abyss": { cost: 30000, requiredStage: 9, color: "linear-gradient(135deg, #4b0082, #000, #9932cc)" },
  "Omega Dimension": { cost: 100000, requiredStage: 10, color: "linear-gradient(45deg, gold, silver, gold, silver)" }
};

/******** BUTTON SKINS ********/
const BUTTON_SKINS = {
  "default": { name: "Classic", cost: 0, gradient: "linear-gradient(135deg, #ff6b6b, #ee5a24)", unlocked: true },
  "ocean": { name: "Ocean Wave", cost: 300, gradient: "linear-gradient(135deg, #0099ff, #00ccff)" },
  "forest": { name: "Forest", cost: 300, gradient: "linear-gradient(135deg, #2ecc71, #27ae60)" },
  "sunset": { name: "Sunset", cost: 300, gradient: "linear-gradient(135deg, #f39c12, #e74c3c)" },
  "amethyst": { name: "Amethyst", cost: 500, gradient: "linear-gradient(135deg, #9b59b6, #8e44ad)" },
  "gold": { name: "Gold Rush", cost: 1000, gradient: "linear-gradient(135deg, #f1c40f, #f39c12)" },
  "diamond": { name: "Diamond", cost: 2000, gradient: "linear-gradient(135deg, #ecf0f1, #bdc3c7, #ecf0f1)" },
  "rainbow": { name: "Rainbow", cost: 5000, gradient: "linear-gradient(90deg, red, orange, yellow, green, blue, purple)" },
  "cosmic": { name: "Cosmic", cost: 10000, gradient: "linear-gradient(135deg, #000, #9b59b6, #3498db, #000)" },
  "divine": { name: "Divine", cost: 25000, gradient: "linear-gradient(135deg, #fff, #ffd700, #fff)" }
};

/******** CLIENT-SIDE DAILY TASKS ********/
function generateDailyTasks() {
  const today = new Date().toDateString();
  
  // Check if we already have tasks for today
  if (gameState.dailyTasksDate === today && gameState.dailyTasks) {
    return;
  }
  
  // Generate 3 random tasks
  const taskPool = [
    { id: 'clicks_50', name: 'Click 50 times', target: 50, type: 'clicks', reward: 100 },
    { id: 'clicks_100', name: 'Click 100 times', target: 100, type: 'clicks', reward: 250 },
    { id: 'clicks_500', name: 'Click 500 times', target: 500, type: 'clicks', reward: 750 },
    { id: 'rare_1', name: 'Find a Rare rarity', target: 1, type: 'findRare', rarity: 'Rare', reward: 150 },
    { id: 'epic_1', name: 'Find an Epic rarity', target: 1, type: 'findRare', rarity: 'Epic', reward: 500 },
    { id: 'points_500', name: 'Earn 500 points', target: 500, type: 'points', reward: 200 },
    { id: 'points_2000', name: 'Earn 2000 points', target: 2000, type: 'points', reward: 600 },
    { id: 'new_rarity', name: 'Discover a new rarity', target: 1, type: 'newRarity', reward: 300 }
  ];
  
  // Shuffle and pick 3
  const shuffled = taskPool.sort(() => Math.random() - 0.5);
  const selectedTasks = shuffled.slice(0, 3).map(task => ({
    ...task,
    progress: 0,
    completed: false,
    claimed: false
  }));
  
  gameState.dailyTasks = selectedTasks;
  gameState.dailyTasksDate = today;
  saveGameState();
}

function updateDailyTaskProgress(type, value, rarity = null) {
  if (!gameState.dailyTasks) return;
  
  gameState.dailyTasks.forEach(task => {
    if (task.completed) return;
    
    if (task.type === type) {
      if (type === 'findRare' && task.rarity !== rarity) return;
      task.progress = Math.min(task.target, task.progress + value);
      if (task.progress >= task.target) {
        task.completed = true;
      }
    }
  });
  
  saveGameState();
  updateTasksDisplay();
}

function claimTaskReward(taskId) {
  const task = gameState.dailyTasks?.find(t => t.id === taskId);
  if (!task || !task.completed || task.claimed) return;
  
  task.claimed = true;
  gameState.points += task.reward;
  saveGameState();
  updateUI();
  showNotification(`+${task.reward} points claimed!`);
}

function claimDailyStreak() {
  const today = new Date().toDateString();
  
  if (gameState.lastStreakClaim === today) {
    showNotification('Already claimed today!');
    return;
  }
  
  // Check if streak continues
  if (gameState.lastStreakClaim) {
    const lastClaim = new Date(gameState.lastStreakClaim);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastClaim.toDateString() === yesterday.toDateString()) {
      gameState.streakCount++;
    } else {
      gameState.streakCount = 1;
    }
  } else {
    gameState.streakCount = 1;
  }
  
  gameState.lastStreakClaim = today;
  
  // Reward based on streak
  const reward = Math.floor(50 * gameState.streakCount);
  gameState.points += reward;
  
  saveGameState();
  updateUI();
  showNotification(`Day ${gameState.streakCount} streak! +${reward} points!`);
}

/******** STAGE ADVANCEMENT ********/
function canAdvanceStage() {
  // Can advance if:
  // 1. Found all rarities for current stage
  // 2. Have enough points (points threshold increases each stage)
  const rarities = getRaritiesForStage(gameState.currentStage);
  const hasAllRarities = rarities.every(r => gameState.unlockedRarities.includes(r.name));
  const pointsThreshold = gameState.currentStage * 10000 * Math.pow(2, gameState.currentStage - 1);
  
  return hasAllRarities || gameState.points >= pointsThreshold;
}

function advanceStage() {
  if (!canAdvanceStage()) return;
  
  // Save stage completion to history
  gameState.stageHistory.push({
    stage: gameState.currentStage,
    points: gameState.points,
    rarities: [...gameState.unlockedRarities],
    totalClicks: gameState.totalClicks,
    completedAt: new Date().toISOString()
  });
  
  // Reset points and auto clickers (keep backgrounds, achievements, skins)
  gameState.currentStage++;
  gameState.points = 0;
  gameState.autoClickerCount = 0;
  gameState.unlockedRarities = [];
  gameState.totalClicks = 0;
  gameState.purchaseCount = 0;
  gameState.activeEffects = {
    doublePoints: false,
    goldenClick: false,
    luckBoost: false,
    timeFreeze: false,
    goldenMode: false
  };
  
  stopAutoClickers();
  saveGameState();
  updateUI();
  showNotification(`Welcome to Stage ${gameState.currentStage}!`);
  checkForStageNotification();
}

function showStageAdvancePrompt() {
  const modal = document.getElementById('stageModal');
  if (modal) modal.style.display = 'block';
}

/******** CLICK MECHANICS ********/
function doClick(isManual = true) {
  gameState.totalClicks++;
  
  // Generate rarity
  const rarities = getRaritiesForStage(gameState.currentStage);
  let foundRarity = null;
  
  // Apply luck boost if active
  let modifiedRarities = rarities;
  if (gameState.activeEffects.luckBoost) {
    modifiedRarities = rarities.map(r => ({
      ...r,
      chance: r.points > 0 ? r.chance * 2 : r.chance
    }));
  }
  
  // Golden mode: only epic+ rarities
  if (gameState.activeEffects.goldenMode) {
    modifiedRarities = modifiedRarities.filter(r => r.points >= 100);
  }
  
  // Golden click: guaranteed rare+
  if (isManual && gameState.activeEffects.goldenClick) {
    modifiedRarities = modifiedRarities.filter(r => r.points >= 10);
    gameState.activeEffects.goldenClick = false;
  }
  
  // Roll for rarity
  const totalChance = modifiedRarities.reduce((sum, r) => sum + r.chance, 0);
  let roll = Math.random() * totalChance;
  let cumulative = 0;
  
  for (const rarity of modifiedRarities) {
    cumulative += rarity.chance;
    if (roll <= cumulative) {
      foundRarity = rarity;
      break;
    }
  }
  
  if (!foundRarity) foundRarity = modifiedRarities[0];
  
  // Calculate points
  let earnedPoints = foundRarity.points;
  if (gameState.activeEffects.doublePoints) {
    earnedPoints *= 2;
  }
  
  gameState.points += earnedPoints;
  
  // Check if new rarity
  const isNew = !gameState.unlockedRarities.includes(foundRarity.name);
  if (isNew) {
    gameState.unlockedRarities.push(foundRarity.name);
    updateDailyTaskProgress('newRarity', 1);
    checkAchievements();
  }
  
  // Update daily tasks
  updateDailyTaskProgress('clicks', 1);
  updateDailyTaskProgress('points', earnedPoints);
  updateDailyTaskProgress('findRare', 1, foundRarity.name);
  
  saveGameState();
  showResult(foundRarity, earnedPoints, isNew);
  updateUI();
  checkForStageNotification();
  
  // Sync to server periodically
  if (gameState.totalClicks % 50 === 0) {
    syncStatsToServer();
  }
}

function showResult(rarity, points, isNew) {
  const resultElem = document.getElementById('result');
  if (!resultElem) return;
  
  let text = `You got: ${rarity.name}`;
  if (points > 0) text += ` (+${points} pts)`;
  if (isNew) text += ' ✨ NEW!';
  
  resultElem.textContent = text;
  resultElem.style.color = rarity.color;
  if (rarity.color.includes('gradient')) {
    resultElem.style.background = rarity.color;
    resultElem.style.webkitBackgroundClip = 'text';
    resultElem.style.webkitTextFillColor = 'transparent';
  } else {
    resultElem.style.background = 'none';
    resultElem.style.webkitTextFillColor = rarity.color;
  }
}

/******** AUTO CLICKERS ********/
let autoClickerInterval = null;

function getAutoClickerSpeed() {
  // Base: 2 seconds, gets faster with more clickers
  // Formula: 2000ms / (1 + 0.1 * count), minimum 200ms
  if (gameState.autoClickerCount <= 0) return 2000;
  return Math.max(200, Math.floor(2000 / (1 + 0.1 * gameState.autoClickerCount)));
}

function startAutoClickers() {
  if (gameState.autoClickerCount <= 0 || gameState.activeEffects.timeFreeze) return;
  
  stopAutoClickers();
  
  const speed = getAutoClickerSpeed();
  autoClickerInterval = setInterval(() => {
    if (!gameState.activeEffects.timeFreeze) {
      // Each auto clicker does one click per interval
      for (let i = 0; i < gameState.autoClickerCount; i++) {
        doClick(false);
      }
    }
  }, speed);
}

function stopAutoClickers() {
  if (autoClickerInterval) {
    clearInterval(autoClickerInterval);
    autoClickerInterval = null;
  }
}

function restartAutoClickers() {
  stopAutoClickers();
  startAutoClickers();
}

/******** SHOP FUNCTIONS ********/
function purchaseAutoClicker() {
  if (gameState.autoClickerCount >= gameState.maxAutoClickers) {
    showNotification('Max auto clickers reached!');
    return;
  }
  
  const price = getAutoClickerPrice();
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.autoClickerCount++;
  gameState.purchaseCount++;
  saveGameState();
  restartAutoClickers();
  updateUI();
  showNotification('Auto Clicker purchased!');
}

function purchaseDoublePoints() {
  const price = getItemPrice(BASE_PRICES.doublePoints);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.activeEffects.doublePoints = true;
  saveGameState();
  updateUI();
  showNotification('Double Points activated for 30s!');
  
  setTimeout(() => {
    gameState.activeEffects.doublePoints = false;
    saveGameState();
    updateUI();
  }, 30000);
}

function purchaseGoldenClick() {
  const price = getItemPrice(BASE_PRICES.goldenClick);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.activeEffects.goldenClick = true;
  saveGameState();
  updateUI();
  showNotification('Golden Click ready! Next click is guaranteed rare+!');
}

function purchaseLuckBoost() {
  const price = getItemPrice(BASE_PRICES.luckBoost);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.activeEffects.luckBoost = true;
  saveGameState();
  updateUI();
  showNotification('Luck Boost activated for 60s!');
  
  setTimeout(() => {
    gameState.activeEffects.luckBoost = false;
    saveGameState();
    updateUI();
  }, 60000);
}

function purchaseTimeFreeze() {
  const price = getItemPrice(BASE_PRICES.timeFreeze);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.activeEffects.timeFreeze = true;
  stopAutoClickers();
  saveGameState();
  updateUI();
  showNotification('Time Freeze activated for 30s!');
  
  setTimeout(() => {
    gameState.activeEffects.timeFreeze = false;
    startAutoClickers();
    saveGameState();
    updateUI();
  }, 30000);
}

function purchaseGoldenMode() {
  const price = getItemPrice(BASE_PRICES.goldenMode);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.activeEffects.goldenMode = true;
  saveGameState();
  updateUI();
  showNotification('Golden Mode activated for 30s!');
  document.body.classList.add('golden-mode');
  
  setTimeout(() => {
    gameState.activeEffects.goldenMode = false;
    document.body.classList.remove('golden-mode');
    saveGameState();
    updateUI();
  }, 30000);
}

function purchaseBackground(bgName) {
  const bg = BACKGROUNDS[bgName];
  if (!bg) return;
  
  if (gameState.currentStage < bg.requiredStage) {
    showNotification(`Requires Stage ${bg.requiredStage}!`);
    return;
  }
  
  const price = getItemPrice(bg.cost);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.ownedBackgrounds[bgName] = true;
  saveGameState();
  updateUI();
  showNotification(`${bgName} background purchased!`);
}

function setBackground(bgName) {
  if (bgName === 'default') {
    gameState.activeBackground = 'default';
    document.body.style.background = 'linear-gradient(135deg, #e0f7fa, #fce4ec)';
  } else if (gameState.ownedBackgrounds[bgName]) {
    gameState.activeBackground = bgName;
    document.body.style.background = BACKGROUNDS[bgName].color;
  }
  saveGameState();
  updateUI();
}

function purchaseSkin(skinId) {
  const skin = BUTTON_SKINS[skinId];
  if (!skin || skinId === 'default') return;
  
  const price = getItemPrice(skin.cost);
  if (gameState.points < price) {
    showNotification('Not enough points!');
    return;
  }
  
  gameState.points -= price;
  gameState.purchaseCount++;
  gameState.ownedSkins[skinId] = true;
  saveGameState();
  updateUI();
  showNotification(`${skin.name} skin purchased!`);
}

function setSkin(skinId) {
  const skin = BUTTON_SKINS[skinId];
  if (!skin) return;
  if (skinId !== 'default' && !gameState.ownedSkins[skinId]) return;
  
  gameState.activeSkin = skinId;
  const btn = document.getElementById('clickButton');
  if (btn) btn.style.background = skin.gradient;
  saveGameState();
}

/******** ACHIEVEMENTS ********/
const ACHIEVEMENTS_DEF = [
  { id: 'first_click', name: 'First Click', desc: 'Click for the first time', check: () => gameState.totalClicks >= 1 },
  { id: 'clicks_100', name: 'Clicker', desc: 'Click 100 times', check: () => gameState.totalClicks >= 100 },
  { id: 'clicks_1000', name: 'Click Master', desc: 'Click 1,000 times', check: () => gameState.totalClicks >= 1000 },
  { id: 'clicks_10000', name: 'Click Legend', desc: 'Click 10,000 times', check: () => gameState.totalClicks >= 10000 },
  { id: 'rare_find', name: 'Rare Hunter', desc: 'Find a Rare rarity', check: () => gameState.unlockedRarities.includes('Rare') },
  { id: 'epic_find', name: 'Epic Discovery', desc: 'Find an Epic rarity', check: () => gameState.unlockedRarities.includes('Epic') },
  { id: 'legendary_find', name: 'Legendary', desc: 'Find a Legendary rarity', check: () => gameState.unlockedRarities.includes('Legendary') },
  { id: 'stage_2', name: 'Stage 2', desc: 'Reach Stage 2', check: () => gameState.currentStage >= 2 },
  { id: 'stage_5', name: 'Halfway', desc: 'Reach Stage 5', check: () => gameState.currentStage >= 5 },
  { id: 'stage_10', name: 'Endgame', desc: 'Reach Stage 10', check: () => gameState.currentStage >= 10 },
  { id: 'auto_10', name: 'Automation', desc: 'Own 10 auto clickers', check: () => gameState.autoClickerCount >= 10 },
  { id: 'auto_50', name: 'Factory', desc: 'Own 50 auto clickers', check: () => gameState.autoClickerCount >= 50 },
  { id: 'auto_100', name: 'Automation Master', desc: 'Own 100 auto clickers', check: () => gameState.autoClickerCount >= 100 },
  { id: 'streak_7', name: 'Week Streak', desc: 'Get a 7-day streak', check: () => gameState.streakCount >= 7 },
  { id: 'streak_30', name: 'Month Streak', desc: 'Get a 30-day streak', check: () => gameState.streakCount >= 30 }
];

function checkAchievements() {
  ACHIEVEMENTS_DEF.forEach(ach => {
    if (!gameState.achievements.includes(ach.id) && ach.check()) {
      gameState.achievements.push(ach.id);
      showNotification(`Achievement Unlocked: ${ach.name}!`);
    }
  });
  saveGameState();
}

/******** UI UPDATES ********/
function updateUI() {
  // Points
  const pointsDisplay = document.getElementById('pointsDisplay');
  const shopPointsDisplay = document.getElementById('shopPointsDisplay');
  if (pointsDisplay) pointsDisplay.textContent = formatNumber(gameState.points);
  if (shopPointsDisplay) shopPointsDisplay.textContent = formatNumber(gameState.points);
  
  // Stage
  const stageDisplay = document.getElementById('stageDisplay');
  if (stageDisplay) stageDisplay.textContent = `Stage ${gameState.currentStage}`;
  
  // Auto clickers
  const autoCount = document.getElementById('autoCount');
  const shopAutoCount = document.getElementById('shopAutoCount');
  if (autoCount) autoCount.textContent = `${gameState.autoClickerCount}/${gameState.maxAutoClickers}`;
  if (shopAutoCount) shopAutoCount.textContent = `${gameState.autoClickerCount}/${gameState.maxAutoClickers}`;
  
  // Username
  const usernameDisplay = document.getElementById('playerNameDisplay');
  if (usernameDisplay) usernameDisplay.textContent = gameState.username;
  
  // Streak
  const streakCount = document.getElementById('streakCount');
  if (streakCount) streakCount.textContent = gameState.streakCount;
  
  // Total clicks
  const totalClicksDisplay = document.getElementById('totalClicks');
  if (totalClicksDisplay) totalClicksDisplay.textContent = formatNumber(gameState.totalClicks);
  
  // Completion
  const completionDisplay = document.getElementById('completionPercent');
  if (completionDisplay) completionDisplay.textContent = calculateCompletionPercent().toFixed(1) + '%';
  
  // Update shop prices
  updateShopPrices();
  
  // Update rarity log
  updateRarityLog();
  
  // Update active effects display
  updateEffectsDisplay();
  
  // Update tasks display
  updateTasksDisplay();
}

function updateShopPrices() {
  const priceUpdates = [
    ['autoClickerBtn', getAutoClickerPrice()],
    ['doublePointsBtn', getItemPrice(BASE_PRICES.doublePoints)],
    ['goldenClickBtn', getItemPrice(BASE_PRICES.goldenClick)],
    ['luckBoostBtn', getItemPrice(BASE_PRICES.luckBoost)],
    ['timeFreezeBtn', getItemPrice(BASE_PRICES.timeFreeze)],
    ['goldenModeBtn', getItemPrice(BASE_PRICES.goldenMode)]
  ];
  
  priceUpdates.forEach(([id, price]) => {
    const btn = document.getElementById(id);
    if (btn) {
      const priceSpan = btn.querySelector('.shop-item-price');
      if (priceSpan) priceSpan.textContent = formatNumber(price) + ' pts';
    }
  });
}

function updateRarityLog() {
  const logElem = document.getElementById('log');
  if (!logElem) return;
  
  logElem.innerHTML = '';
  const rarities = getRaritiesForStage(gameState.currentStage);
  
  // Sort by points (rarity)
  const sortedUnlocked = gameState.unlockedRarities
    .map(name => rarities.find(r => r.name === name))
    .filter(Boolean)
    .sort((a, b) => a.points - b.points);
  
  sortedUnlocked.forEach(rarity => {
    const li = document.createElement('li');
    li.textContent = rarity.name;
    li.style.color = rarity.color;
    if (rarity.color.includes('gradient')) {
      li.style.background = rarity.color;
      li.style.webkitBackgroundClip = 'text';
      li.style.webkitTextFillColor = 'transparent';
    }
    logElem.appendChild(li);
  });
}

function updateEffectsDisplay() {
  const effects = gameState.activeEffects;
  
  const updates = [
    ['shopDoubleStatus', effects.doublePoints ? 'Active' : 'Off'],
    ['shopGoldenStatus', effects.goldenClick ? 'Ready!' : 'Off'],
    ['shopLuckBoostStatus', effects.luckBoost ? 'Active' : 'Off'],
    ['shopTimeFreezeStatus', effects.timeFreeze ? 'Active' : 'Off'],
    ['shopGoldenModeStatus', effects.goldenMode ? 'Active' : 'Off']
  ];
  
  updates.forEach(([id, status]) => {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = status;
  });
}

function updateTasksDisplay() {
  const tasksProgress = document.getElementById('challengesProgress');
  if (tasksProgress && gameState.dailyTasks) {
    const completed = gameState.dailyTasks.filter(t => t.completed).length;
    tasksProgress.textContent = `${completed}/3`;
  }
}

function checkForStageNotification() {
  if (canAdvanceStage() && !document.getElementById('stageNotification')) {
    showStageNotification();
  }
}

function showStageNotification() {
  const existing = document.getElementById('stageNotification');
  if (existing) existing.remove();
  
  const notif = document.createElement('div');
  notif.id = 'stageNotification';
  notif.className = 'stage-notification';
  notif.innerHTML = `
    <span>🎉 Ready to advance to Stage ${gameState.currentStage + 1}!</span>
    <button onclick="advanceStage()">Go to Next Stage</button>
    <button onclick="this.parentElement.remove()">Later</button>
  `;
  document.body.appendChild(notif);
}

function showNotification(message) {
  const notif = document.createElement('div');
  notif.className = 'toast-notification';
  notif.textContent = message;
  document.body.appendChild(notif);
  
  setTimeout(() => notif.classList.add('show'), 10);
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

function calculateCompletionPercent() {
  const rarities = getRaritiesForStage(gameState.currentStage);
  const found = gameState.unlockedRarities.filter(r => rarities.some(rr => rr.name === r)).length;
  return (found / rarities.length) * 100;
}

/******** MODALS ********/
function toggleShopModal() {
  const modal = document.getElementById('shopModal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
  if (modal.style.display === 'block') {
    updateShopModal();
  }
}

function updateShopModal() {
  updateUI();
  updateBackgroundShop();
  updateSkinShop();
}

function updateBackgroundShop() {
  const container = document.getElementById('backgroundShopList');
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(BACKGROUNDS).forEach(([name, bg]) => {
    const li = document.createElement('li');
    li.className = 'bg-shop-item';
    li.style.background = bg.color;
    
    const info = document.createElement('div');
    info.className = 'bg-info';
    info.innerHTML = `
      <span class="bg-name">${name}</span>
      <span class="bg-price">${formatNumber(getItemPrice(bg.cost))} pts</span>
      <span class="bg-stage">Stage ${bg.requiredStage}+</span>
    `;
    li.appendChild(info);
    
    if (gameState.ownedBackgrounds[name]) {
      if (gameState.activeBackground === name) {
        const badge = document.createElement('span');
        badge.className = 'active-badge';
        badge.textContent = 'Active';
        li.appendChild(badge);
      } else {
        const btn = document.createElement('button');
        btn.textContent = 'Use';
        btn.onclick = () => setBackground(name);
        li.appendChild(btn);
      }
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Buy';
      btn.disabled = gameState.currentStage < bg.requiredStage || gameState.points < getItemPrice(bg.cost);
      btn.onclick = () => purchaseBackground(name);
      li.appendChild(btn);
    }
    
    container.appendChild(li);
  });
}

function updateSkinShop() {
  const container = document.getElementById('skinsGrid');
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(BUTTON_SKINS).forEach(([id, skin]) => {
    const div = document.createElement('div');
    div.className = 'skin-item';
    div.style.background = skin.gradient;
    
    div.innerHTML = `
      <span class="skin-name">${skin.name}</span>
      <span class="skin-price">${id === 'default' ? 'Free' : formatNumber(getItemPrice(skin.cost)) + ' pts'}</span>
    `;
    
    const owned = id === 'default' || gameState.ownedSkins[id];
    
    if (owned) {
      if (gameState.activeSkin === id) {
        div.classList.add('active');
      } else {
        div.onclick = () => setSkin(id);
        div.style.cursor = 'pointer';
      }
    } else {
      div.classList.add('locked');
      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';
      buyBtn.onclick = (e) => {
        e.stopPropagation();
        purchaseSkin(id);
      };
      div.appendChild(buyBtn);
    }
    
    container.appendChild(div);
  });
}

function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
  if (modal.style.display === 'block') {
    updateSettingsModal();
  }
}

function updateSettingsModal() {
  updateUI();
  updateAchievementsList();
  updateStatsDisplay();
}

function updateAchievementsList() {
  const container = document.getElementById('achievementsList');
  if (!container) return;
  
  container.innerHTML = '';
  ACHIEVEMENTS_DEF.forEach(ach => {
    const li = document.createElement('li');
    li.className = 'achievement-item';
    
    if (gameState.achievements.includes(ach.id)) {
      li.classList.add('unlocked');
      li.innerHTML = `<span class="ach-icon">⭐</span> <span class="ach-name">${ach.name}</span>`;
    } else {
      li.classList.add('locked');
      li.innerHTML = `<span class="ach-icon">🔒</span> <span class="ach-name">???</span>`;
    }
    container.appendChild(li);
  });
}

function updateStatsDisplay() {
  const rarities = getRaritiesForStage(gameState.currentStage);
  const chancesList = document.getElementById('chancesList');
  if (chancesList) {
    chancesList.innerHTML = '';
    rarities.forEach(r => {
      const li = document.createElement('li');
      if (gameState.unlockedRarities.includes(r.name)) {
        li.textContent = `${r.name}: ${r.chance}% (${r.points} pts)`;
        li.style.color = r.color;
      } else {
        li.textContent = '???';
        li.style.color = '#999';
      }
      chancesList.appendChild(li);
    });
  }
}

function toggleLeaderboardModal() {
  const modal = document.getElementById('leaderboardModal');
  const isOpening = modal.style.display !== 'block';
  modal.style.display = isOpening ? 'block' : 'none';
  
  if (isOpening) {
    fetchLeaderboard();
  }
}

async function fetchLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) return;
  
  list.innerHTML = '<li class="loading">Loading...</li>';
  
  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    
    if (data.success && data.leaderboard) {
      displayLeaderboard(data.leaderboard);
    } else {
      list.innerHTML = '<li class="error">Failed to load leaderboard</li>';
    }
  } catch (error) {
    list.innerHTML = '<li class="error">Server not available</li>';
  }
}

function displayLeaderboard(leaderboard) {
  const list = document.getElementById('leaderboardList');
  if (!list) return;
  
  list.innerHTML = '';
  
  if (leaderboard.length === 0) {
    list.innerHTML = '<li class="empty">No players yet!</li>';
    return;
  }
  
  leaderboard.forEach((player, index) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-entry';
    
    if (player.userId === gameState.userId) {
      li.classList.add('leaderboard-self');
    }
    
    let rankIcon = '';
    if (index === 0) rankIcon = '🥇';
    else if (index === 1) rankIcon = '🥈';
    else if (index === 2) rankIcon = '🥉';
    else rankIcon = `#${index + 1}`;
    
    li.innerHTML = `
      <span class="leaderboard-rank">${rankIcon}</span>
      <span class="leaderboard-name">${escapeHtml(player.username)}</span>
      <span class="leaderboard-stage">Stage ${player.currentStage}</span>
      <span class="leaderboard-percent">${player.completionPercent.toFixed(1)}%</span>
    `;
    
    list.appendChild(li);
  });
}

function toggleChallengesModal() {
  const modal = document.getElementById('challengesModal');
  const isOpening = modal.style.display !== 'block';
  modal.style.display = isOpening ? 'block' : 'none';
  
  if (isOpening) {
    displayChallenges();
  }
}

function displayChallenges() {
  generateDailyTasks();
  
  const dateElem = document.getElementById('challengesDate');
  if (dateElem) dateElem.textContent = `Daily Challenges - ${new Date().toLocaleDateString()}`;
  
  const list = document.getElementById('challengesList');
  if (!list) return;
  
  list.innerHTML = '';
  
  gameState.dailyTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    
    const progressPercent = Math.min(100, (task.progress / task.target) * 100);
    
    li.innerHTML = `
      <div class="challenge-header">
        <span class="challenge-name">${task.name}</span>
        <span class="challenge-reward">+${task.reward} pts</span>
      </div>
      <div class="challenge-progress-bar">
        <div class="challenge-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <div class="challenge-progress-text">${task.progress} / ${task.target}</div>
      ${task.completed && !task.claimed ? `<button onclick="claimTaskReward('${task.id}')">Claim</button>` : ''}
      ${task.claimed ? '<span class="claimed">✓ Claimed</span>' : ''}
    `;
    
    list.appendChild(li);
  });
}

function toggleStreakModal() {
  const modal = document.getElementById('streakModal');
  const isOpening = modal.style.display !== 'block';
  modal.style.display = isOpening ? 'block' : 'none';
  
  if (isOpening) {
    displayStreak();
  }
}

function displayStreak() {
  const currentStreak = document.getElementById('currentStreak');
  if (currentStreak) currentStreak.textContent = gameState.streakCount;
  
  const claimBtn = document.getElementById('claimStreakBtn');
  if (claimBtn) {
    const today = new Date().toDateString();
    if (gameState.lastStreakClaim === today) {
      claimBtn.disabled = true;
      claimBtn.textContent = 'Already Claimed Today';
    } else {
      claimBtn.disabled = false;
      claimBtn.textContent = 'Claim Daily Streak!';
    }
  }
}

function toggleSkinsModal() {
  const modal = document.getElementById('skinsModal');
  modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
  if (modal.style.display === 'block') {
    updateSkinShop();
  }
}

function changePlayerName() {
  const newName = prompt('Enter your new name (max 20 characters):', gameState.username);
  if (newName && newName.trim().length > 0) {
    gameState.username = newName.trim().substring(0, 20);
    saveGameState();
    updateUsernameOnServer();
    updateUI();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function resetGame() {
  if (confirm('Are you sure? This will reset EVERYTHING including stages!')) {
    localStorage.removeItem('beyondRareState');
    location.reload();
  }
}

/******** MODAL CLOSE HANDLERS ********/
function setupModalCloseHandlers() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

/******** CONNECTION STATUS ********/
let isOnline = true;

async function checkConnection() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    isOnline = data.success;
    updateConnectionStatus();
  } catch {
    isOnline = false;
    updateConnectionStatus();
  }
}

function updateConnectionStatus() {
  let statusElem = document.getElementById('connectionStatus');
  if (!statusElem) {
    statusElem = document.createElement('div');
    statusElem.id = 'connectionStatus';
    statusElem.className = 'connection-status';
    document.body.appendChild(statusElem);
  }
  
  if (isOnline) {
    statusElem.className = 'connection-status online';
    statusElem.innerHTML = '<span class="connection-dot"></span> Online';
  } else {
    statusElem.className = 'connection-status offline';
    statusElem.innerHTML = '<span class="connection-dot"></span> Local Mode';
  }
}

/******** TIMER ********/
function updateTimer() {
  if (!gameState.activeEffects.timeFreeze) {
    const now = Date.now();
    const secondsElapsed = ((now - gameState.startTime) / 1000).toFixed(1);
    const timerElem = document.getElementById('timer');
    if (timerElem) timerElem.textContent = `Time: ${secondsElapsed}s`;
  }
}

/******** INITIALIZATION ********/
async function init() {
  loadGameState();
  generateDailyTasks();
  
  // Restore background and skin
  if (gameState.activeBackground !== 'default' && gameState.ownedBackgrounds[gameState.activeBackground]) {
    setBackground(gameState.activeBackground);
  }
  if (gameState.activeSkin !== 'default') {
    setSkin(gameState.activeSkin);
  }
  
  updateUI();
  setupModalCloseHandlers();
  startAutoClickers();
  
  // Timer update
  setInterval(updateTimer, 100);
  
  // Check connection and register
  await checkConnection();
  if (isOnline) {
    await checkUserIdWithServer();
    await syncStatsToServer();
  }
  
  // Periodic sync
  setInterval(() => {
    if (isOnline) syncStatsToServer();
  }, 30000);
  
  // Periodic connection check
  setInterval(checkConnection, 60000);
  
  checkAchievements();
}

// Set up click button
document.getElementById('clickButton')?.addEventListener('click', () => doClick(true));

// Initialize
init();
