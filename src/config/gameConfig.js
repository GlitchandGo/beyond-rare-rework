/**
 * Game Configuration
 * Central configuration for game mechanics, rarities, and rewards
 */

module.exports = {
  // Username validation rules
  usernameRules: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    patternDescription: 'Username can only contain letters, numbers, and underscores'
  },

  // Reserved usernames (cannot be used)
  reservedUsernames: [
    'admin', 'administrator', 'system', 'moderator', 'mod', 'staff',
    'support', 'help', 'info', 'null', 'undefined', 'player', 'user',
    'test', 'demo', 'guest', 'anonymous', 'root', 'server', 'bot',
    'beyond', 'rare', 'beyondrare', 'glitched', 'unknown'
  ],

  // All rarities in order (index determines tier)
  rarities: [
    { name: "Average", points: 0, tier: 0 },
    { name: "Common", points: 0, tier: 0 },
    { name: "Uncommon", points: 0, tier: 1 },
    { name: "Slightly Rare", points: 1, tier: 1 },
    { name: "Rare", points: 2, tier: 2 },
    { name: "More Rare", points: 2, tier: 2 },
    { name: "Very Rare", points: 3, tier: 2 },
    { name: "Super Rare", points: 5, tier: 3 },
    { name: "Ultra Rare", points: 8, tier: 3 },
    { name: "Epic", points: 10, tier: 4 },
    { name: "More Epic", points: 15, tier: 4 },
    { name: "Very Epic", points: 20, tier: 4 },
    { name: "Super Epic", points: 25, tier: 4 },
    { name: "Ultra Epic", points: 30, tier: 4 },
    { name: "Legendary", points: 40, tier: 5 },
    { name: "Legendary +", points: 50, tier: 5 },
    { name: "Super Legendary", points: 75, tier: 5 },
    { name: "Ultra Legendary", points: 90, tier: 5 },
    { name: "Mythical", points: 100, tier: 6 },
    { name: "Ultra Mythical", points: 150, tier: 6 },
    { name: "Chroma", points: 200, tier: 7 },
    { name: "Super Chroma", points: 250, tier: 7 },
    { name: "Ultra Chroma", points: 350, tier: 7 },
    { name: "Magical", points: 500, tier: 8 },
    { name: "Super Magical", points: 750, tier: 8 },
    { name: "Ultra Magical", points: 900, tier: 8 },
    { name: "Extreme", points: 1000, tier: 9 },
    { name: "Ultra Extreme", points: 1200, tier: 9 },
    { name: "Ethereal", points: 1500, tier: 10 },
    { name: "Ultra Ethereal", points: 1800, tier: 10 },
    { name: "Stellar", points: 2000, tier: 11 },
    { name: "Ultra Stellar", points: 2500, tier: 11 },
    { name: "Extraordinary", points: 3000, tier: 12 },
    { name: "Ultra Extraordinary", points: 4000, tier: 12 },
    { name: "Unknown", points: 5000, tier: 13 },
    { name: "Glitched", points: 10000, tier: 14 }
  ],

  // Rarity tier thresholds for challenges
  rarityTiers: {
    "Rare+": 4,      // Index where Rare+ starts
    "Epic+": 9,      // Index where Epic+ starts  
    "Legendary+": 14, // Index where Legendary+ starts
    "Chroma+": 20    // Index where Chroma+ starts
  },

  // Shop items
  shopItems: [
    { id: 'autoClicker', name: 'Auto Clicker', baseCost: 100 },
    { id: 'doublePoints', name: 'Double Points', baseCost: 200 },
    { id: 'goldenClick', name: 'Golden Click', baseCost: 400 },
    { id: 'luckBoost', name: 'Luck Boost', baseCost: 500 },
    { id: 'timeFreeze', name: 'Time Freeze', baseCost: 250 },
    { id: 'goldenMode', name: 'Golden Mode', baseCost: 2000 }
  ],

  // Button skins - Light variants (unlocked via daily challenges)
  buttonSkinsLight: [
    { id: 'light_red', name: 'Light Red', primary: '#ffcccb', secondary: '#ff9999' },
    { id: 'light_blue', name: 'Light Blue', primary: '#add8e6', secondary: '#87ceeb' },
    { id: 'light_green', name: 'Light Green', primary: '#90ee90', secondary: '#98fb98' },
    { id: 'light_yellow', name: 'Light Yellow', primary: '#fffacd', secondary: '#ffff99' },
    { id: 'light_purple', name: 'Light Purple', primary: '#e6e6fa', secondary: '#dda0dd' },
    { id: 'light_orange', name: 'Light Orange', primary: '#ffdab9', secondary: '#ffcc99' },
    { id: 'light_pink', name: 'Light Pink', primary: '#ffb6c1', secondary: '#ffc0cb' },
    { id: 'light_cyan', name: 'Light Cyan', primary: '#e0ffff', secondary: '#afeeee' }
  ],

  // Button skins - Dark variants (unlocked via streak or purchase)
  buttonSkinsDark: [
    { id: 'dark_red', name: 'Dark Red', primary: '#8b0000', secondary: '#a52a2a' },
    { id: 'dark_blue', name: 'Dark Blue', primary: '#00008b', secondary: '#191970' },
    { id: 'dark_green', name: 'Dark Green', primary: '#006400', secondary: '#228b22' },
    { id: 'dark_yellow', name: 'Dark Yellow', primary: '#b8860b', secondary: '#daa520' },
    { id: 'dark_purple', name: 'Dark Purple', primary: '#4b0082', secondary: '#800080' },
    { id: 'dark_orange', name: 'Dark Orange', primary: '#ff4500', secondary: '#ff6347' },
    { id: 'dark_pink', name: 'Dark Pink', primary: '#c71585', secondary: '#db7093' },
    { id: 'dark_cyan', name: 'Dark Cyan', primary: '#008b8b', secondary: '#20b2aa' }
  ],

  // Daily challenges pool
  dailyChallenges: [
    { id: 'earn_2000_points', name: 'Earn 2000 Points', target: 2000, type: 'points' },
    { id: 'get_chroma_plus', name: 'Get anything Chroma+', target: 1, type: 'rarity_tier', tier: 'Chroma+' },
    { id: 'get_25_rare_plus', name: 'Get 25 Rare+ Finds', target: 25, type: 'rarity_tier_count', tier: 'Rare+' },
    { id: 'get_15_epic_plus', name: 'Get 15 Epic+ Finds', target: 15, type: 'rarity_tier_count', tier: 'Epic+' },
    { id: 'get_8_legendary_plus', name: 'Get 8 Legendary+ Finds', target: 8, type: 'rarity_tier_count', tier: 'Legendary+' },
    { id: 'manual_clicks_250', name: '250 Manual Clicks', target: 250, type: 'manual_clicks' },
    { id: 'purchase_10_items', name: 'Purchase 10 Items', target: 10, type: 'purchases' },
    { id: 'earn_300_in_60s', name: 'Earn 300 Points in 60 Seconds', target: 300, type: 'points_timed', timeWindow: 60 },
    { id: 'make_daily_leaderboard', name: 'Make the Daily Leaderboard', target: 1, type: 'leaderboard' },
    { id: 'purchase_golden_mode', name: 'Purchase Golden Mode', target: 1, type: 'golden_mode' }
  ],

  // Streak milestones with rewards
  streakMilestones: [
    { day: 7, reward: { type: 'skin', skinId: 'dark_blue', skinName: 'Dark Blue Button' } },
    { day: 14, reward: { type: 'skin', skinId: 'dark_red', skinName: 'Dark Red Button' } },
    { day: 30, reward: { type: 'skin', skinId: 'dark_green', skinName: 'Dark Green Button' } },
    { day: 60, reward: { type: 'skin', skinId: 'dark_purple', skinName: 'Dark Purple Button' } },
    { day: 100, reward: { type: 'skin', skinId: 'dark_orange', skinName: 'Dark Orange Button' } }
  ],

  // Base streak reward
  streakBaseReward: 100,

  // Achievements
  achievements: [
    // Click achievements
    { id: 'clicks_100', name: 'Clicker', description: 'Reach 100 total clicks', type: 'clicks', tiers: [100], icon: '👆' },
    { id: 'clicks_1000', name: 'Dedicated Clicker', description: 'Reach 1,000 total clicks', type: 'clicks', tiers: [1000], icon: '🖱️' },
    { id: 'clicks_10000', name: 'Click Master', description: 'Reach 10,000 total clicks', type: 'clicks', tiers: [10000], icon: '⚡' },
    { id: 'clicks_100000', name: 'Click Legend', description: 'Reach 100,000 total clicks', type: 'clicks', tiers: [100000], icon: '🌟' },

    // Purchase achievements
    { id: 'first_purchase', name: 'First Purchase', description: 'Buy your first shop item', type: 'purchases', tiers: [1], icon: '🛒' },
    { id: 'purchases_10', name: 'Shopper', description: 'Purchase 10 items', type: 'purchases', tiers: [10], icon: '🛍️' },
    { id: 'purchases_50', name: 'Big Spender', description: 'Purchase 50 items', type: 'purchases', tiers: [50], icon: '💰' },
    { id: 'golden_mode', name: 'Golden Gamer', description: 'Purchase Golden Mode', type: 'golden_mode', tiers: [1], icon: '✨' },

    // Tiered rarity achievements
    { id: 'get_rare', name: 'Rare Hunter', description: 'Unlock Rare tier rarities', type: 'rarity', 
      tiers: ['Rare', 'Super Rare', 'Ultra Rare'], icon: '💎' },
    { id: 'get_epic', name: 'Epic Discovery', description: 'Unlock Epic tier rarities', type: 'rarity',
      tiers: ['Epic', 'Super Epic', 'Ultra Epic'], icon: '💜' },
    { id: 'get_legendary', name: 'Legendary Hunter', description: 'Unlock Legendary tier rarities', type: 'rarity',
      tiers: ['Legendary', 'Legendary +', 'Ultra Legendary'], icon: '⭐' },
    { id: 'get_mythical', name: 'Myth Seeker', description: 'Unlock Mythical rarities', type: 'rarity',
      tiers: ['Mythical', 'Ultra Mythical'], icon: '🔥' },
    { id: 'get_chroma', name: 'Rainbow Chaser', description: 'Unlock Chroma rarities', type: 'rarity',
      tiers: ['Chroma', 'Super Chroma', 'Ultra Chroma'], icon: '🌈' },
    { id: 'get_magical', name: 'Magic Finder', description: 'Unlock Magical rarities', type: 'rarity',
      tiers: ['Magical', 'Super Magical', 'Ultra Magical'], icon: '🪄' },
    { id: 'get_ethereal', name: 'Beyond Reality', description: 'Unlock Ethereal rarities', type: 'rarity',
      tiers: ['Ethereal', 'Ultra Ethereal'], icon: '👻' },
    { id: 'get_stellar', name: 'Star Gazer', description: 'Unlock Stellar rarities', type: 'rarity',
      tiers: ['Stellar', 'Ultra Stellar'], icon: '✨' },
    { id: 'get_extraordinary', name: 'Extraordinary Find', description: 'Unlock Extraordinary rarities', type: 'rarity',
      tiers: ['Extraordinary', 'Ultra Extraordinary'], icon: '🏅' },
    { id: 'get_unknown', name: 'The Unknown', description: 'Unlock the Unknown rarity', type: 'rarity',
      tiers: ['Unknown'], icon: '❓' },
    { id: 'get_glitched', name: 'System Error', description: 'Unlock the Glitched rarity', type: 'rarity',
      tiers: ['Glitched'], icon: '🐛' },

    // Completion achievements
    { id: 'complete_10', name: 'Just Beginning', description: 'Reach 10% completion', type: 'completion', tiers: [10], icon: '📊' },
    { id: 'complete_25', name: 'Quarter Way', description: 'Reach 25% completion', type: 'completion', tiers: [25], icon: '📈' },
    { id: 'complete_50', name: 'Halfway There', description: 'Reach 50% completion', type: 'completion', tiers: [50], icon: '🎯' },
    { id: 'complete_75', name: 'Almost Done', description: 'Reach 75% completion', type: 'completion', tiers: [75], icon: '🏆' },
    { id: 'complete_100', name: 'Completionist', description: 'Reach 100% completion', type: 'completion', tiers: [100], icon: '👑' },

    // Streak achievements
    { id: 'streak_3', name: 'Getting Started', description: '3 day streak', type: 'streak', tiers: [3], icon: '🔥' },
    { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', type: 'streak', tiers: [7], icon: '📅' },
    { id: 'streak_14', name: 'Fortnight Fighter', description: '14 day streak', type: 'streak', tiers: [14], icon: '💪' },
    { id: 'streak_30', name: 'Monthly Master', description: '30 day streak', type: 'streak', tiers: [30], icon: '🗓️' },
    { id: 'streak_100', name: 'Century Streak', description: '100 day streak', type: 'streak', tiers: [100], icon: '💯' },

    // Background achievements
    { id: 'first_bg', name: 'Interior Designer', description: 'Purchase your first background', type: 'backgrounds', tiers: [1], icon: '🎨' },
    { id: 'bg_10', name: 'Decorator', description: 'Own 10 backgrounds', type: 'backgrounds', tiers: [10], icon: '🖼️' },

    // Button skin achievements
    { id: 'first_skin', name: 'Stylist', description: 'Unlock your first button skin', type: 'skins', tiers: [1], icon: '🎭' },
    { id: 'skins_5', name: 'Fashionista', description: 'Own 5 button skins', type: 'skins', tiers: [5], icon: '👗' },

    // Daily challenge achievements
    { id: 'daily_complete_1', name: 'Daily Doer', description: 'Complete all daily challenges once', type: 'daily_completions', tiers: [1], icon: '📋' },
    { id: 'daily_complete_7', name: 'Weekly Warrior', description: 'Complete daily challenges 7 times', type: 'daily_completions', tiers: [7], icon: '🎖️' },
    { id: 'daily_complete_30', name: 'Monthly Champion', description: 'Complete daily challenges 30 times', type: 'daily_completions', tiers: [30], icon: '🏆' }
  ],

  // Completion weights for percent calculation
  completionWeights: {
    rarities: 50,        // 50% weight
    backgrounds: 25,     // 25% weight  
    seasonalBackgrounds: 10, // 10% weight
    shopItems: 5,        // 5% weight
    buttonSkins: 10      // 10% weight
  },

  // Totals for completion calculation
  completionTotals: {
    rarities: 36,
    permanentBackgrounds: 26,
    seasonalBackgrounds: 13,
    shopItems: 6,
    buttonSkinsLight: 8,
    buttonSkinsDark: 8
  },

  // Leaderboard config
  leaderboard: {
    topN: 50,
    dailyLeaderboardMinRarities: 10 // Min rarities to qualify for daily
  }
};
