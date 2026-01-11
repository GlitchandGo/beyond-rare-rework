/**
 * Achievement Service
 * Handles tiered achievements with progress tracking
 */

const db = require('../db/database');
const gameConfig = require('../config/gameConfig');

function getPlayerAchievements(playerId) {
  const query = db.prepare(`
    SELECT achievement_id, current_tier, current_progress, is_acknowledged
    FROM player_achievements
    WHERE player_id = ?
  `);
  const records = query.all(playerId);
  
  // Build full achievement status
  return gameConfig.achievements.map(achievement => {
    const record = records.find(r => r.achievement_id === achievement.id);
    
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      currentTier: record?.current_tier || 0,
      maxTier: achievement.tiers.length,
      currentProgress: record?.current_progress || 0,
      nextTarget: achievement.tiers[record?.current_tier || 0] || null,
      tiers: achievement.tiers,
      isMaxed: (record?.current_tier || 0) >= achievement.tiers.length,
      isAcknowledged: record?.is_acknowledged || 0
    };
  });
}

function updateAchievementProgress(playerId, type, newValue) {
  const unlockedAchievements = [];
  
  // Find achievements that match this type
  const matchingAchievements = gameConfig.achievements.filter(a => a.type === type);
  
  for (const achievement of matchingAchievements) {
    // Ensure record exists
    const ensureRecord = db.prepare(`
      INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, current_tier, current_progress, is_acknowledged)
      VALUES (?, ?, 0, 0, 1)
    `);
    ensureRecord.run(playerId, achievement.id);
    
    // Get current state
    const getState = db.prepare(`
      SELECT current_tier, current_progress FROM player_achievements
      WHERE player_id = ? AND achievement_id = ?
    `);
    const state = getState.get(playerId, achievement.id);
    
    // Check if we've reached a new tier
    let currentTier = state.current_tier;
    let tierChanged = false;
    
    while (currentTier < achievement.tiers.length && newValue >= achievement.tiers[currentTier]) {
      currentTier++;
      tierChanged = true;
    }
    
    // Update progress and tier
    const update = db.prepare(`
      UPDATE player_achievements
      SET current_progress = ?, current_tier = ?, is_acknowledged = ?
      WHERE player_id = ? AND achievement_id = ?
    `);
    update.run(newValue, currentTier, tierChanged ? 0 : state.is_acknowledged, playerId, achievement.id);
    
    if (tierChanged) {
      unlockedAchievements.push({
        id: achievement.id,
        name: achievement.name,
        icon: achievement.icon,
        newTier: currentTier,
        maxTier: achievement.tiers.length
      });
    }
  }
  
  return unlockedAchievements;
}

function acknowledgeAchievement(playerId, achievementId) {
  const update = db.prepare(`
    UPDATE player_achievements
    SET is_acknowledged = 1
    WHERE player_id = ? AND achievement_id = ?
  `);
  update.run(playerId, achievementId);
  return { success: true };
}

function acknowledgeAllAchievements(playerId) {
  const update = db.prepare(`
    UPDATE player_achievements
    SET is_acknowledged = 1
    WHERE player_id = ?
  `);
  update.run(playerId);
  return { success: true };
}

function getUnacknowledgedAchievements(playerId) {
  const query = db.prepare(`
    SELECT achievement_id, current_tier
    FROM player_achievements
    WHERE player_id = ? AND is_acknowledged = 0
  `);
  const records = query.all(playerId);
  
  return records.map(record => {
    const achievement = gameConfig.achievements.find(a => a.id === record.achievement_id);
    return {
      id: achievement.id,
      name: achievement.name,
      icon: achievement.icon,
      tier: record.current_tier,
      maxTier: achievement.tiers.length
    };
  });
}

function checkAndUpdateAchievements(playerId, stats) {
  const allUnlocked = [];
  
  // Check total clicks
  if (stats.totalClicks !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'total_clicks', stats.totalClicks);
    allUnlocked.push(...unlocked);
  }
  
  // Check total points
  if (stats.totalPoints !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'total_points', stats.totalPoints);
    allUnlocked.push(...unlocked);
  }
  
  // Check unique rarities
  if (stats.uniqueRarities !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'unique_rarities', stats.uniqueRarities);
    allUnlocked.push(...unlocked);
  }
  
  // Check legendary finds
  if (stats.legendaryFinds !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'legendary_finds', stats.legendaryFinds);
    allUnlocked.push(...unlocked);
  }
  
  // Check mythic finds
  if (stats.mythicFinds !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'mythic_finds', stats.mythicFinds);
    allUnlocked.push(...unlocked);
  }
  
  // Check exotic finds
  if (stats.exoticFinds !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'exotic_finds', stats.exoticFinds);
    allUnlocked.push(...unlocked);
  }
  
  // Check shop purchases
  if (stats.shopPurchases !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'shop_purchases', stats.shopPurchases);
    allUnlocked.push(...unlocked);
  }
  
  // Check backgrounds
  if (stats.backgrounds !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'backgrounds', stats.backgrounds);
    allUnlocked.push(...unlocked);
  }
  
  // Check daily streak
  if (stats.dailyStreak !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'daily_streak', stats.dailyStreak);
    allUnlocked.push(...unlocked);
  }
  
  // Check challenges completed
  if (stats.challengesCompleted !== undefined) {
    const unlocked = updateAchievementProgress(playerId, 'challenges_completed', stats.challengesCompleted);
    allUnlocked.push(...unlocked);
  }
  
  return allUnlocked;
}

function getAchievementStats(playerId) {
  const achievements = getPlayerAchievements(playerId);
  
  const totalTiers = achievements.reduce((sum, a) => sum + a.maxTier, 0);
  const earnedTiers = achievements.reduce((sum, a) => sum + a.currentTier, 0);
  const maxedCount = achievements.filter(a => a.isMaxed).length;
  
  return {
    totalAchievements: achievements.length,
    maxedAchievements: maxedCount,
    totalTiers,
    earnedTiers,
    completionPercent: Math.round((earnedTiers / totalTiers) * 100)
  };
}

module.exports = {
  getPlayerAchievements,
  updateAchievementProgress,
  acknowledgeAchievement,
  acknowledgeAllAchievements,
  getUnacknowledgedAchievements,
  checkAndUpdateAchievements,
  getAchievementStats
};
