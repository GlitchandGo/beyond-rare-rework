/**
 * Stats Routes
 * Handles comprehensive player statistics
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const completionService = require('../services/completionService');
const achievementService = require('../services/achievementService');
const leaderboardService = require('../services/leaderboardService');
const db = require('../db/database');
const gameConfig = require('../config/gameConfig');

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

// Get comprehensive stats
router.get('/', (req, res) => {
  try {
    const playerId = req.player.id;
    
    // Get basic progress
    const getProgress = db.prepare(`
      SELECT total_points, total_clicks FROM player_progress WHERE player_id = ?
    `);
    const progress = getProgress.get(playerId);
    
    // Get completion breakdown
    const completion = completionService.calculateCompletion(playerId);
    
    // Get achievement stats
    const achievementStats = achievementService.getAchievementStats(playerId);
    
    // Get streak info
    const getStreak = db.prepare(`
      SELECT current_streak, longest_streak, total_claims FROM daily_streaks WHERE player_id = ?
    `);
    const streak = getStreak.get(playerId);
    
    // Get rarity breakdown by tier
    const rarityBreakdown = getRarityBreakdown(playerId);
    
    // Get recent activity
    const recentActivity = getRecentActivity(playerId);
    
    // Get leaderboard ranks
    const ranks = {
      daily: leaderboardService.getPlayerRank(playerId, 'daily'),
      weekly: leaderboardService.getPlayerRank(playerId, 'weekly'),
      monthly: leaderboardService.getPlayerRank(playerId, 'monthly'),
      allTime: leaderboardService.getPlayerRank(playerId, 'all-time')
    };
    
    // Get button skins
    const getSkins = db.prepare(`
      SELECT skin_id, unlock_method, unlocked_at FROM button_skins WHERE player_id = ?
    `);
    const skins = getSkins.all(playerId);
    
    res.json({
      success: true,
      stats: {
        username: req.player.username,
        memberSince: req.player.created_at,
        progress: {
          totalPoints: progress?.total_points || 0,
          totalClicks: progress?.total_clicks || 0
        },
        completion,
        achievements: achievementStats,
        streak: streak ? {
          current: streak.current_streak,
          longest: streak.longest_streak,
          totalClaims: streak.total_claims
        } : { current: 0, longest: 0, totalClaims: 0 },
        rarityBreakdown,
        recentActivity,
        ranks,
        skins: skins.map(s => ({
          id: s.skin_id,
          method: s.unlock_method,
          unlockedAt: s.unlocked_at
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get button skins
router.get('/skins', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const getSkins = db.prepare(`
      SELECT skin_id, unlock_method, unlocked_at FROM button_skins WHERE player_id = ?
    `);
    const ownedSkins = getSkins.all(playerId);
    
    const ownedIds = ownedSkins.map(s => s.skin_id);
    
    // Combine all skins with ownership info
    const allSkins = [
      ...gameConfig.buttonSkins.light.map(s => ({ ...s, variant: 'light' })),
      ...gameConfig.buttonSkins.dark.map(s => ({ ...s, variant: 'dark' }))
    ];
    
    const skinsWithOwnership = allSkins.map(skin => {
      const owned = ownedSkins.find(o => o.skin_id === skin.id);
      return {
        ...skin,
        owned: !!owned,
        unlockMethod: owned?.unlock_method || null,
        unlockedAt: owned?.unlocked_at || null
      };
    });
    
    res.json({
      success: true,
      skins: skinsWithOwnership,
      ownedCount: ownedIds.length,
      totalCount: allSkins.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Equip a button skin
router.post('/skins/equip', (req, res) => {
  try {
    const playerId = req.player.id;
    const { skinId } = req.body;
    
    // Check ownership
    const checkOwnership = db.prepare(`
      SELECT id FROM button_skins WHERE player_id = ? AND skin_id = ?
    `);
    const owned = checkOwnership.get(playerId, skinId);
    
    if (!owned) {
      return res.status(400).json({ success: false, error: 'Skin not owned' });
    }
    
    // Update equipped skin (store in player settings)
    // For now, we'll just return success - frontend handles display
    
    res.json({ success: true, equippedSkin: skinId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Get rarity breakdown by tier
function getRarityBreakdown(playerId) {
  const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'exotic', 'secret', 'special'];
  const breakdown = {};
  
  for (const tier of tiers) {
    const tierRarities = gameConfig.rarities.filter(r => r.tier === tier);
    const tierIds = tierRarities.map(r => r.id);
    
    if (tierIds.length === 0) {
      breakdown[tier] = { found: 0, total: 0, percent: 100 };
      continue;
    }
    
    const placeholders = tierIds.map(() => '?').join(',');
    const query = db.prepare(`
      SELECT COUNT(DISTINCT rarity_id) as count 
      FROM rarity_finds 
      WHERE player_id = ? AND rarity_id IN (${placeholders})
    `);
    const result = query.get(playerId, ...tierIds);
    
    breakdown[tier] = {
      found: result?.count || 0,
      total: tierIds.length,
      percent: Math.round(((result?.count || 0) / tierIds.length) * 100)
    };
  }
  
  return breakdown;
}

// Helper: Get recent activity
function getRecentActivity(playerId) {
  // Recent rarity finds
  const recentFinds = db.prepare(`
    SELECT rarity_id, first_found_at 
    FROM rarity_finds 
    WHERE player_id = ? 
    ORDER BY first_found_at DESC 
    LIMIT 10
  `).all(playerId);
  
  // Recent purchases
  const recentPurchases = db.prepare(`
    SELECT item_type, item_id, purchased_at 
    FROM shop_purchases 
    WHERE player_id = ? 
    ORDER BY purchased_at DESC 
    LIMIT 5
  `).all(playerId);
  
  return {
    recentFinds: recentFinds.map(f => ({
      rarityId: f.rarity_id,
      foundAt: f.first_found_at
    })),
    recentPurchases: recentPurchases.map(p => ({
      type: p.item_type,
      itemId: p.item_id,
      purchasedAt: p.purchased_at
    }))
  };
}

module.exports = router;
