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
    textOverlay.style. backgroundColor = "rgba(255, 255, 255, 0.7)";
    textOverlay.style. padding = "5px";
    textOverlay.textContent = `${bgName} - ${bgData.cost} pts (Requires ${bgData.requiredRarity})`;
    li.appendChild(textOverlay);
    
    if (ownedBackgrounds[bgName]) {
      if (activeBackground === bgName && activeSeasonalBackground === "") {
        const activeLabel = document.createElement("div");
        activeLabel.textContent = "Active";
        activeLabel. style.backgroundColor = "rgba(0,0,0,0.7)";
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
      if (points >= bgData.cost && logHasRarity(bgData. requiredRarity)) {
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
  
  seasonalMainBackgrounds. forEach(bg => {
    let available = false;
    if (bg.availableMonths) {
      if (bg.availableMonths.includes(currentMonth)) {
        available = true;
      }
    } else if (bg.availableDates) {
      if (now >= bg.availableDates. start && now <= bg.availableDates.end) {
        available = true;
      }
    }
    if (available) {
      hasSeasonalItems = true;
      const li = document.createElement("li");
      li.style.background = bg. color;
      li.style.position = "relative";
      const textOverlay = document.createElement("div");
      textOverlay.style. backgroundColor = "rgba(255, 255, 255, 0.7)";
      textOverlay. style.padding = "5px";
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
            ownedSeasonalBackgrounds[bg. name] = true;
            localStorage.setItem("ownedSeasonalBackgrounds", JSON. stringify(ownedSeasonalBackgrounds));
            updateShopDisplays();
            updateBackgroundShop();
          };
          li.appendChild(buyBtn);
        } else {
          li. classList.add("disabled");
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
  
  seasonalEventBackgrounds. forEach(bg => {
    let available = false;
    if (bg.availableDates) {
      if (now >= bg.availableDates.start && now <= bg.availableDates.end) {
        available = true;
      }
    } else if (bg.availableMonths) {
      if (bg. availableMonths. includes(currentMonth)) {
        available = true;
      }
    }
    if (available) {
      hasEventItems = true;
      const li = document. createElement("li");
      li.style. background = bg.color;
      li. style.position = "relative";
      const limitedIcon = document.createElement("div");
      limitedIcon.textContent = "🕘";
      limitedIcon.className = "seasonal-event-icon";
      li.appendChild(limitedIcon);
      
      const textOverlay = document.createElement("div");
      textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      textOverlay.style. padding = "5px";
      textOverlay.textContent = `${bg.name} - ${bg. cost} pts`;
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
          selectBtn.onclick = () => setSeasonalBackground(bg.name, bg. color);
          li.appendChild(selectBtn);
        }
      } else {
        if (points >= bg.cost) {
          const buyBtn = document.createElement("button");
          buyBtn.textContent = "Buy";
          buyBtn.onclick = () => {
            points -= bg.cost;
            localStorage. setItem("points", points);
            ownedSeasonalBackgrounds[bg. name] = true;
            localStorage.setItem("ownedSeasonalBackgrounds", JSON.stringify(ownedSeasonalBackgrounds));
            updateShopDisplays();
            updateBackgroundShop();
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
    noItems. textContent = "No special event backgrounds available right now.";
    noItems.style. fontStyle = "italic";
    list. appendChild(noItems);
  }
}

function purchaseBackground(bgName) {
  const bgData = backgroundsPermanent[bgName];
  if (! bgData || points < bgData.cost || ! logHasRarity(bgData.requiredRarity)) return;
  points -= bgData.cost;
  localStorage. setItem("points", points);
  ownedBackgrounds[bgName] = true;
  localStorage. setItem("ownedBackgrounds", JSON.stringify(ownedBackgrounds));
  updateShopDisplays();
  updateBackgroundShop();
}

function setBackground(bgName) {
  if (! ownedBackgrounds[bgName]) return;
  activeBackground = bgName;
  activeSeasonalBackground = "";
  localStorage.setItem("activeBackground", bgName);
  localStorage.setItem("activeSeasonalBackground", "");
  if (backgroundsPermanent[bgName]) {
    document.body.style. background = backgroundsPermanent[bgName]. color;
  } else {
    document.body.style. background = "";
  }
  updateBackgroundShop();
}

function setSeasonalBackground(bgName, color) {
  activeSeasonalBackground = bgName;
  localStorage.setItem("activeSeasonalBackground", bgName);
  document.body.style. background = color;
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

function resetGame() {
  if (confirm("Are you sure you want to reset the game?  This will clear all progress. ")) {
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
    shopPriceMultiplier = 1;
    upstageCount = 0;
    logData = [];
    totalClicks = 0;
    ownedSeasonalBackgrounds = {};
    localStorage.removeItem("ownedSeasonalBackgrounds");
    activeSeasonalBackground = "";
    localStorage. removeItem("activeSeasonalBackground");
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
  document.body.style. background = "linear-gradient(135deg, #e0f7fa, #fce4ec)";
}

function restoreBackground() {
  if (activeSeasonalBackground) {
    let seasonalBg = seasonalMainBackgrounds.find(bg => bg.name === activeSeasonalBackground);
    if (! seasonalBg) {
      seasonalBg = seasonalEventBackgrounds.find(bg => bg.name === activeSeasonalBackground);
    }
    if (seasonalBg) {
      document.body.style.background = seasonalBg. color;
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
  if (confirm("Upstage?  This will reset your rarity log and stats but keep your backgrounds.  Shop prices will increase by 50%.  Continue?")) {
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
  }
}

/******** Initialization ********/
function init() {
  updateShopDisplays();
  updateLogElement();
  updateStats();
  restoreBackground();
  startAutoClickers();
}

/******** Main Click Button Event Listener ********/
document.getElementById("clickButton").addEventListener("click", function() {
  generateRarity(true);
});

// Initialize the game
init();
