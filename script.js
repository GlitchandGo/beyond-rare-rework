/******** Global Variables & Persistent Storage ********/
let points = localStorage.getItem("points") ?  parseInt(localStorage.getItem("points")) : 0;
let startTime = localStorage.getItem("startTime") ? parseInt(localStorage.getItem("startTime")) : Date.now();
localStorage.setItem("startTime", startTime);
let autoClickersCount = localStorage.getItem("autoClickersCount") ? parseInt(localStorage.getItem("autoClickersCount")) : 0;
let autoInterval = null;
let doublePointsActive = false, goldenClickReady = false;
let luckBoostActive = false, timeFreezeActive = false, goldenModeActive = false;
let totalClicks = localStorage.getItem("totalClicks") ? parseInt(localStorage.getItem("totalClicks")) : 0;
let logData = JSON.parse(localStorage. getItem("logData")) || [];
let shopPriceMultiplier = localStorage.getItem("shopPriceMultiplier") ? parseFloat(localStorage.getItem("shopPriceMultiplier")) : 1;
let upstageCount = localStorage.getItem("upstageCount") ? parseInt(localStorage.getItem("upstageCount")) : 0;

/******** Shop Base Prices ********/
const SHOP_PRICES = {
  autoClicker: 100,
  doublePoints: 200,
  goldenClick: 400,
  luckBoost: 500,
  timeFreeze: 250,
  goldenMode: 2000
};

/******** Rarity Definitions ********/
const rarities = [
  { name:  "Average", chance: 40. 003 },
  { name: "Common", chance: 20 },
  { name: "Uncommon", chance: 17.6 },
  { name: "Slightly Rare", chance:  10 },
  { name: "Rare", chance: 5 },
  { name: "More Rare", chance:  3 },
  { name: "Very Rare", chance:  2 },
  { name: "Super Rare", chance:  1 },
  { name: "Ultra Rare", chance:  0.5 },
  { name: "Epic", chance: 0.4 },
  { name: "More Epic", chance: 0.2 },
  { name:  "Very Epic", chance: 0.15 },
  { name: "Super Epic", chance: 0.12 },
  { name: "Ultra Epic", chance: 0.1 },
  { name: "Legendary", chance: 0.08 },
  { name: "Legendary +", chance: 0.07 },
  { name: "Super Legendary", chance:  0.06 },
  { name: "Ultra Legendary", chance: 0.05 },
  { name: "Mythical", chance: 0.045 },
  { name: "Ultra Mythical", chance: 0.04 },
  { name: "Chroma", chance: 0.03 },
  { name: "Super Chroma", chance: 0.025 },
  { name: "Ultra Chroma", chance: 0.022 },
  { name: "Magical", chance: 0.02 },
  { name: "Super Magical", chance:  0.018 },
  { name: "Ultra Magical", chance: 0.016 },
  { name:  "Extreme", chance: 0.015 },
  { name: "Ultra Extreme", chance:  0.012 },
  { name: "Ethereal", chance: 0.01 },
  { name:  "Ultra Ethereal", chance: 0.008 },
  { name: "Stellar", chance:  0.006 },
  { name: "Ultra Stellar", chance: 0.005 },
  { name: "Extraordinary", chance: 0.003 },
  { name: "Ultra Extraordinary", chance: 0.002 },
  { name:  "Unknown", chance: 0.001 },
  { name:  "Glitched", chance:  0.0005 }
];

const rarityPoints = {
  "Average": 0,
  "Common":  0,
  "Uncommon": 0,
  "Slightly Rare": 1,
  "Rare": 2,
  "More Rare": 2,
  "Very Rare": 3,
  "Super Rare": 5,
  "Ultra Rare": 8,
  "Epic": 10,
  "More Epic":  15,
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
  "Ultra Stellar":  2500,
  "Extraordinary":  3000,
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
  "Dark Blue": { cost: 200, requiredRarity:  "Rare", color: "#00008b" },
  "Light Yellow": { cost: 200, requiredRarity: "Legendary", color: "#fffacd" },
  "Medium Yellow":  { cost: 200, requiredRarity: "Legendary", color: "#f0e68c" },
  "Dark Yellow": { cost:  200, requiredRarity: "Legendary", color: "#ffd700" },
  "Light Orange": { cost: 200, requiredRarity: "Chroma", color: "#ffdab9" },
  "Medium Orange":  { cost: 200, requiredRarity: "Chroma", color: "#ffa500" },
  "Dark Orange":  { cost: 200, requiredRarity: "Chroma", color: "#ff8c00" },
  "Light Green": { cost: 200, requiredRarity: "Uncommon", color: "#90ee90" },
  "Medium Green":  { cost: 200, requiredRarity: "Uncommon", color: "#32cd32" },
  "Dark Green":  { cost: 200, requiredRarity: "Uncommon", color: "#006400" },
  "Light Purple": { cost: 200, requiredRarity:  "Epic", color: "#d8bfd8" },
  "Medium Purple": { cost: 200, requiredRarity:  "Epic", color:  "#9370db" },
  "Dark Purple": { cost: 200, requiredRarity:  "Epic", color:  "#4b0082" },
  "Rainbow": { cost: 500, requiredRarity: "Chroma", color: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)" },
  "Red-Blue Gradient": { cost:  400, requiredRarity: "Ultra Legendary", color:  "linear-gradient(45deg, red, blue)" },
  "Red-Yellow Gradient": { cost: 400, requiredRarity: "Ultra Legendary", color:  "linear-gradient(45deg, red, yellow)" },
  "Blue-Yellow Gradient": { cost:  400, requiredRarity: "Ultra Legendary", color:  "linear-gradient(45deg, blue, yellow)" },
  "Ethereal Glow": { cost:  600, requiredRarity: "Ethereal", color:  "linear-gradient(135deg, #2e0854, #7b68ee)" },
  "Stellar Night":  { cost: 800, requiredRarity: "Stellar", color: "linear-gradient(135deg, #0c0c0c, #1a1a2e, #4a4a6a)" },
  "Unknown Void":  { cost: 1000, requiredRarity: "Unknown", color: "linear-gradient(135deg, #000000, #1a0a2e)" }
};

/******** Seasonal Backgrounds ********/
const seasonalMainBackgrounds = [
  { name:  "Cherry Blossom Bliss", cost: 500, availableMonths: [2,3,4], color: "linear-gradient(135deg, #FFC0CB, #FFFAF0)" },
  { name: "Meadow Bloom", cost: 500, availableMonths: [2,3,4], color: "linear-gradient(135deg, #50C878, #FFD700)" },
  { name: "Ocean Sunset", cost: 500, availableMonths: [5,6,7], color: "linear-gradient(135deg, #008080, #FF4500)" },
  { name: "Summer Vibes", cost: 500, availableMonths: [5,6,7], color: "linear-gradient(135deg, #40E0D0, #FFD700)" },
  { name: "Harvest Glow", cost: 500, availableMonths: [8,9,10], color: "linear-gradient(135deg, #FF8C00, #8B4513)" },
  { name:  "Crisp Autumn", cost: 500, availableMonths: [8,9,10], color: "linear-gradient(135deg, #DC143C, #FFBF00)" },
  { name: "Frostbite Chill", cost: 500, availableMonths: [11,0,1], color:  "linear-gradient(135deg, #B0E0E6, #DCDCDC)" },
  { name:  "Snowy Cabin", cost: 500, availableMonths: [11,0,1], color:  "linear-gradient(135deg, #006400, #8B4513)" }
];

const seasonalEventBackgrounds = [
  { name: "July 4th Fireworks", cost:  750, availableDates: { start: new Date(new Date().getFullYear(), 5, 15), end: new Date(new Date().getFullYear(), 6, 15) }, color: "linear-gradient(135deg, #002868, #BF0A30, #FFFFFF)" },
  { name: "Halloween Haunt", cost: 750, availableDates: { start:  new Date(new Date().getFullYear(), 9, 15), end: new Date(new Date().getFullYear(), 9, 31) }, color: "linear-gradient(135deg, #555555, #FF6600, #000000)" },
  { name: "Christmas Cheer", cost: 750, availableMonths: [11], color: "linear-gradient(135deg, #D32F2F, #008000)" },
  { name: "Summer Freedom", cost: 750, availableDates: { start: new Date(new Date().getFullYear(), 4, 28), end: new Date(new Date().getFullYear(), 5, 10) }, color: "linear-gradient(135deg, #87CEEB, #FFD700, #32CD32)" },
  { name: "Happy New Year", cost: 750, availableDates: { start:  new Date(new Date().getFullYear(), 0, 1), end: new Date(new Date().getFullYear(), 0, 5) }, color: "linear-gradient(135deg, #00008B, #FFD700, #C0C0C0)" }
];

let ownedBackgrounds = JSON.parse(localStorage. getItem("ownedBackgrounds")) || {};
let activeBackground = localStorage.getItem("activeBackground") || "Light Blue";

let ownedSeasonalBackgrounds = JSON.parse(localStorage.getItem("ownedSeasonalBackgrounds")) || {};
let activeSeasonalBackground = localStorage.getItem("activeSeasonalBackground") || "";

/******** Timer Update (every 100ms) ********/
function updateTimer() {
  if (! timeFreezeActive) {
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
  document. getElementById("autoCount").innerText = autoClickersCount;
  document.getElementById("doubleStatus").innerText = doublePointsActive ?  "On" : "Off";
  document.getElementById("goldenStatus").innerText = goldenClickReady ?  "Ready" : "Not Ready";
  document. getElementById("luckBoostStatus").innerText = luckBoostActive ? "Active" : "Inactive";
  document. getElementById("timeFreezeStatus").innerText = timeFreezeActive ? "Active" : "Inactive";
  document.getElementById("goldenModeStatus").innerText = goldenModeActive ? "Active" : "Inactive";
  
  document.getElementById("autoClickerBtn").innerText = "Buy Auto Clicker (" + Math.round(SHOP_PRICES. autoClicker * shopPriceMultiplier) + " pts)";
  document.getElementById("doublePointsBtn").innerText = "Buy Double Points (" + Math.round(SHOP_PRICES. doublePoints * shopPriceMultiplier) + " pts)";
  document.getElementById("goldenClickBtn").innerText = "Buy Golden Click (" + Math. round(SHOP_PRICES.goldenClick * shopPriceMultiplier) + " pts)";
  document.getElementById("luckBoostBtn").innerText = "Buy Luck Boost (" + Math.round(SHOP_PRICES.luckBoost * shopPriceMultiplier) + " pts)";
  document.getElementById("timeFreezeBtn").innerText = "Buy Time Freeze (" + Math.round(SHOP_PRICES.timeFreeze * shopPriceMultiplier) + " pts)";
  document.getElementById("goldenModeBtn").innerText = "Buy Golden Mode (" + Math.round(SHOP_PRICES. goldenMode * shopPriceMultiplier) + " pts)";
}

function updateLogElement() {
  const logElem = document.getElementById("log");
  logElem.innerHTML = "";
  logData.sort((a, b) => (rarityPoints[a] || 0) - (rarityPoints[b] || 0));
  logData.forEach(rarity => {
    let li = document.createElement("li");
    li.textContent = rarity;
    li.className = getClassName(rarity);
    logElem. appendChild(li);
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
  
  const chancesList = document.getElementById("chancesList");
  chancesList. innerHTML = "";
  rarities.forEach(rarity => {
    if (rarity. name === "Glitched" && ! logData.includes("Glitched")) return;
    let li = document.createElement("li");
    li.textContent = logData.includes(rarity.name)
      ? (rarity.name + ": " + rarity.chance + "%")
      : "??? ";
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
  let raritiesUpToUltraLegendary = rarities. filter((r, i) => i <= indexUltraLegendary);
  let unlockUpstage = raritiesUpToUltraLegendary.every(r => logData.includes(r.name));
  document.getElementById("upstageButton").style.display = unlockUpstage ? "block" : "none";
}

function getClassName(rarity) {
  return rarity.toLowerCase().replace(/ /g, "-").replace(/\+/g, "plus");
}

/******** Rarity Generation ********/
function generateRarity(isManual = true) {
  totalClicks++;
  localStorage.setItem("totalClicks", totalClicks);
  
  // Check for Glitched rarity
  let canGlitch = rarities.filter(r => r. name !== "Glitched").every(r => logData.includes(r. name));
  if (canGlitch && Math.random() < 0.000005) {
    if (!logData.includes("Glitched")) {
      logData. push("Glitched");
    }
    let earned = rarityPoints["Glitched"];
    if (doublePointsActive) earned *= 2;
    points += earned;
    localStorage.setItem("logData", JSON.stringify(logData));
    updateLogElement();
    updateStats();
    document.getElementById("result").innerText = "You got:  Glitched (+" + earned + " pts)";
    document.getElementById("result").className = getClassName("Glitched");
    localStorage.setItem("points", points);
    updateShopDisplays();
    return;
  }
  
  let foundRarity = "";
  let multiplier = 1;
  
  if (isManual && goldenClickReady) {
    // Golden Click:  Guaranteed Epic or above
    let eligible = rarities.filter(r => r. name !== "Glitched" && (rarityPoints[r.name] || 0) >= rarityPoints["Epic"]);
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
    let eligible = rarities. filter(r => r.name !== "Glitched" && (rarityPoints[r.name] || 0) >= rarityPoints["Epic"]);
    let totalChance = eligible. reduce((sum, r) => sum + r.chance, 0);
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
    // Luck Boost:  Doubles chances for Uncommon+
    let modifiedRarities = rarities. filter(r => r. name !== "Glitched").map(r => {
      if (r.name !== "Average" && r.name !== "Common") {
        return { name: r.name, chance: r.chance * 2 };
      }
      return { name: r.name, chance: r. chance };
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
    let normalRarities = rarities. filter(r => r.name !== "Glitched");
    let totalChance = normalRarities.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math. random() * totalChance;
    let cumulative = 0;
    for (let r of normalRarities) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  }
  
  if (! foundRarity) {
    foundRarity = "Average";
  }
  
  if (doublePointsActive) multiplier *= 2;
  
  let basePoints = rarityPoints[foundRarity] || 0;
  let earned = basePoints * multiplier;
  points += earned;
  localStorage.setItem("points", points);
  updateShopDisplays();
  
  const resultElem = document. getElementById("result");
  resultElem. innerText = "You got: " + foundRarity + " (+" + earned + " pts)";
  resultElem.className = getClassName(foundRarity);
  
  if (! logData.includes(foundRarity)) {
    logData.push(foundRarity);
    localStorage.setItem("logData", JSON.stringify(logData));
    updateLogElement();
  }
  updateStats();
}

/******** Auto Clicker Functions ********/
function startAutoClickers() {
  if (autoClickersCount > 0 && !autoInterval && ! timeFreezeActive) {
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
    localStorage. setItem("points", points);
    autoClickersCount++;
    localStorage.setItem("autoClickersCount", autoClickersCount);
    updateShopDisplays();
    startAutoClickers();
  } else {
    alert("Not enough pts for Auto Clicker!");
  }
}

function purchaseDoublePoints() {
  const cost = Math. round(SHOP_PRICES.doublePoints * shopPriceMultiplier);
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    doublePointsActive = true;
    updateShopDisplays();
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
    updateShopDisplays();
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
    updateShopDisplays();
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
    localStorage. setItem("points", points);
    updateShopDisplays();
    if (! timeFreezeActive) {
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
    updateShopDisplays();
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
