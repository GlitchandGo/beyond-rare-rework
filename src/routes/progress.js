/**
 * Progress Routes
 * Handles point updates, clicks, purchases, and rarity finds
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const progressService = require('../services/progressService');
const challengeService = require('../services/challengeService');
const achievementService = require('../services/achievementService');
const leaderboardService = require('../services/leaderboardService');
const db = require('../db/database');

// Middleware to authenticate player
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }
  
  const player = playerService.getPlayerByToken(token);
  if (!player) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  
  if (player.is_banned) {
    return res.status(403).json({ success: false, error: 'Account banned' });
  }
  
  req.player = player;
  next();
}

router.use(authenticate);

// Record a click with rarity result
router.post('/click', (req, res) => {
  try {
    const { rarityId, pointsEarned } = req.body;
    const playerId = req.player.id;
    
    if (!rarityId || pointsEarned === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Record the click
    progressService.recordClick(playerId, rarityId, pointsEarned);
    
    // Add points
    progressService.addPoints(playerId, pointsEarned);
    
    // Record rarity find (handles first-time discovery)
    const rarityResult = progressService.recordRarityFind(playerId, rarityId);
    
    // Update challenges
    const completedChallenges = [];
    completedChallenges.push(...challengeService.updateChallengeProgress(playerId, 'click', 1));
    completedChallenges.push(...challengeService.updateChallengeProgress(playerId, 'points', pointsEarned));
    
    // Get rarity tier for challenge progress
    const gameConfig = require('../config/gameConfig');
    const rarity = gameConfig.rarities.find(r => r.id === rarityId);
    if (rarity) {
      completedChallenges.push(...challengeService.updateChallengeProgress(playerId, 'rarity', 1, {
        tier: rarity.tier,
        rarityId: rarity.id
      }));
    }
    
    // Get updated stats for achievement checking
    const stats = getPlayerStats(playerId);
    const unlockedAchievements = achievementService.checkAndUpdateAchievements(playerId, stats);
    
    // Snapshot for leaderboard (not every click, but periodically)
    if (stats.totalClicks % 100 === 0) {
      leaderboardService.snapshotPlayerStats(playerId);
    }
    
    res.json({
      success: true,
      isFirstFind: rarityResult.isFirstFind,
      totalPoints: stats.totalPoints,
      totalClicks: stats.totalClicks,
      completedChallenges,
      unlockedAchievements
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record a purchase
router.post('/purchase', (req, res) => {
  try {
    const { itemType, itemId, price } = req.body;
    const playerId = req.player.id;
    
    if (!itemType || !itemId || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Get current points
    const getProgress = db.prepare(`SELECT total_points FROM player_progress WHERE player_id = ?`);
    const progress = getProgress.get(playerId);
    
    if (progress.total_points < price) {
      return res.status(400).json({ success: false, error: 'Insufficient points' });
    }
    
    // Deduct points
    const deductPoints = db.prepare(`
      UPDATE player_progress SET total_points = total_points - ? WHERE player_id = ?
    `);
    deductPoints.run(price, playerId);
    
    // Record purchase
    progressService.recordPurchase(playerId, itemType, itemId, price);
    
    // Update challenges
    const completedChallenges = challengeService.updateChallengeProgress(playerId, 'purchase', 1, {
      itemType
    });
    
    // Check achievements
    const stats = getPlayerStats(playerId);
    const unlockedAchievements = achievementService.checkAndUpdateAchievements(playerId, stats);
    
    res.json({
      success: true,
      newBalance: progress.total_points - price,
      completedChallenges,
      unlockedAchievements
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current progress
router.get('/', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const getProgress = db.prepare(`
      SELECT total_points, total_clicks FROM player_progress WHERE player_id = ?
    `);
    const progress = getProgress.get(playerId);
    
    const getRarities = db.prepare(`
      SELECT rarity_id, find_count, first_found_at FROM rarity_finds WHERE player_id = ?
    `);
    const rarities = getRarities.all(playerId);
    
    const getPurchases = db.prepare(`
      SELECT item_type, item_id FROM shop_purchases WHERE player_id = ?
    `);
    const purchases = getPurchases.all(playerId);
    
    res.json({
      success: true,
      progress: {
        totalPoints: progress?.total_points || 0,
        totalClicks: progress?.total_clicks || 0,
        rarities: rarities,
        purchases: purchases
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync full game state
router.post('/sync', (req, res) => {
  try {
    const { totalPoints, totalClicks, rarities, purchases, backgrounds } = req.body;
    const playerId = req.player.id;
    
    // Update progress
    const updateProgress = db.prepare(`
      UPDATE player_progress 
      SET total_points = ?, total_clicks = ?
      WHERE player_id = ?
    `);
    updateProgress.run(totalPoints || 0, totalClicks || 0, playerId);
    
    // Sync rarities
    if (rarities && Array.isArray(rarities)) {
      for (const r of rarities) {
        progressService.recordRarityFind(playerId, r.id);
      }
    }
    
    // Sync purchases
    if (purchases && Array.isArray(purchases)) {
      for (const p of purchases) {
        const check = db.prepare(`
          SELECT id FROM shop_purchases WHERE player_id = ? AND item_type = ? AND item_id = ?
        `);
        if (!check.get(playerId, p.type || 'shop', p.id)) {
          progressService.recordPurchase(playerId, p.type || 'shop', p.id, p.price || 0);
        }
      }
    }
    
    // Sync backgrounds
    if (backgrounds && Array.isArray(backgrounds)) {
      for (const b of backgrounds) {
        const check = db.prepare(`
          SELECT id FROM shop_purchases WHERE player_id = ? AND item_type = 'background' AND item_id = ?
        `);
        if (!check.get(playerId, b)) {
          progressService.recordPurchase(playerId, 'background', b, 0);
        }
      }
    }
    
    // Snapshot for leaderboard
    leaderboardService.snapshotPlayerStats(playerId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to get stats for achievement checking
function getPlayerStats(playerId) {
  const getProgress = db.prepare(`
    SELECT total_points, total_clicks FROM player_progress WHERE player_id = ?
  `);
  const progress = getProgress.get(playerId);
  
  const getRarityCounts = db.prepare(`
    SELECT COUNT(DISTINCT rarity_id) as unique_count FROM rarity_finds WHERE player_id = ?
  `);
  const rarityCount = getRarityCounts.get(playerId);
  
  const getPurchaseCounts = db.prepare(`
    SELECT COUNT(*) as count FROM shop_purchases WHERE player_id = ?
  `);
  const purchaseCount = getPurchaseCounts.get(playerId);
  
  const getBackgroundCount = db.prepare(`
    SELECT COUNT(*) as count FROM shop_purchases WHERE player_id = ? AND item_type = 'background'
  `);
  const bgCount = getBackgroundCount.get(playerId);
  
  // Get tier-specific counts
  const gameConfig = require('../config/gameConfig');
  const legendaryIds = gameConfig.rarities.filter(r => r.tier === 'legendary').map(r => r.id);
  const mythicIds = gameConfig.rarities.filter(r => r.tier === 'mythic').map(r => r.id);
  const exoticIds = gameConfig.rarities.filter(r => r.tier === 'exotic').map(r => r.id);
  
  const getTierCount = (ids) => {
    if (ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const query = db.prepare(`
      SELECT COUNT(DISTINCT rarity_id) as count 
      FROM rarity_finds 
      WHERE player_id = ? AND rarity_id IN (${placeholders})
    `);
    return query.get(playerId, ...ids)?.count || 0;
  };
  
  const getStreak = db.prepare(`
    SELECT current_streak FROM daily_streaks WHERE player_id = ?
  `);
  const streak = getStreak.get(playerId);
  
  const getChallengesCompleted = db.prepare(`
    SELECT COUNT(*) as count FROM daily_challenge_progress WHERE player_id = ? AND is_completed = 1
  `);
  const challenges = getChallengesCompleted.get(playerId);
  
  return {
    totalPoints: progress?.total_points || 0,
    totalClicks: progress?.total_clicks || 0,
    uniqueRarities: rarityCount?.unique_count || 0,
    legendaryFinds: getTierCount(legendaryIds),
    mythicFinds: getTierCount(mythicIds),
    exoticFinds: getTierCount(exoticIds),
    shopPurchases: purchaseCount?.count || 0,
    backgrounds: bgCount?.count || 0,
    dailyStreak: streak?.current_streak || 0,
    challengesCompleted: challenges?.count || 0
  };
}

module.exports = router;
