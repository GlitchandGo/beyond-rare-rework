/**
 * Progress Service
 * Handles player progress tracking: points, clicks, purchases, rarities
 */

const db = require('../db/database');
const gameConfig = require('../config/gameConfig');
const completionService = require('./completionService');

function addPoints(playerId, points) {
  // Update total points
  const update = db.prepare(`
    UPDATE player_progress 
    SET total_points = total_points + ?, updated_at = datetime('now')
    WHERE player_id = ?
  `);
  update.run(points, playerId);

  // Log points event for timed challenges
  const logEvent = db.prepare(`
    INSERT INTO points_events (player_id, points)
    VALUES (?, ?)
  `);
  logEvent.run(playerId, points);

  // Update session points
  const updateSession = db.prepare(`
    INSERT INTO active_sessions (player_id, points_in_session)
    VALUES (?, ?)
    ON CONFLICT(player_id) DO UPDATE SET points_in_session = points_in_session + ?
  `);
  updateSession.run(playerId, points, points);

  return { pointsAdded: points };
}

function recordClick(playerId, isManual = true) {
  if (isManual) {
    const update = db.prepare(`
      UPDATE player_progress 
      SET manual_clicks = manual_clicks + 1, updated_at = datetime('now')
      WHERE player_id = ?
    `);
    update.run(playerId);
  }
  return { recorded: true };
}

function recordPurchase(playerId, itemType, itemId, cost) {
  // Log the purchase
  const insertPurchase = db.prepare(`
    INSERT INTO shop_purchases (player_id, item_type, item_id, price)
    VALUES (?, ?, ?, ?)
  `);
  insertPurchase.run(playerId, itemType, itemId, cost);

  // Update purchase count
  const updateCount = db.prepare(`
    UPDATE player_progress 
    SET total_purchases = total_purchases + 1, updated_at = datetime('now')
    WHERE player_id = ?
  `);
  updateCount.run(playerId);

  // Check if golden mode
  if (itemId === 'goldenMode') {
    const updateGolden = db.prepare(`
      UPDATE player_progress SET golden_mode_owned = 1 WHERE player_id = ?
    `);
    updateGolden.run(playerId);
  }

  // Update completion
  completionService.updateCompletion(playerId);

  return { recorded: true, itemId };
}

function recordRarityFind(playerId, rarityId, pointsEarned = 0) {
  // Check if first find of this rarity
  const existing = db.prepare(`
    SELECT id FROM rarity_finds WHERE player_id = ? AND rarity_id = ?
  `).get(playerId, rarityId);

  if (existing) {
    // Increment count
    const update = db.prepare(`
      UPDATE rarity_finds SET find_count = find_count + 1 WHERE player_id = ? AND rarity_id = ?
    `);
    update.run(playerId, rarityId);
  } else {
    // First find
    const insert = db.prepare(`
      INSERT INTO rarity_finds (player_id, rarity_id) VALUES (?, ?)
    `);
    insert.run(playerId, rarityId);
  }

  // Log rarity event for leaderboards
  const logEvent = db.prepare(`
    INSERT INTO rarity_events (player_id, rarity_name, points_earned)
    VALUES (?, ?, ?)
  `);
  logEvent.run(playerId, rarityId, pointsEarned);

  // Add points
  if (pointsEarned > 0) {
    addPoints(playerId, pointsEarned);
  }

  // Update completion
  completionService.updateCompletion(playerId);

  return { recorded: true, isFirstFind: !existing };
}

function recordBackgroundPurchase(playerId, backgroundName, backgroundType) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO backgrounds_owned (player_id, background_name, background_type)
    VALUES (?, ?, ?)
  `);
  insert.run(playerId, backgroundName, backgroundType);

  completionService.updateCompletion(playerId);
  return { recorded: true };
}

function getPlayerProgress(playerId) {
  const progress = db.prepare(`
    SELECT * FROM player_progress WHERE player_id = ?
  `).get(playerId);

  const rarities = db.prepare(`
    SELECT rarity_id, find_count, first_found_at 
    FROM rarity_finds WHERE player_id = ?
  `).all(playerId);

  const backgrounds = db.prepare(`
    SELECT background_name, background_type, unlocked_at 
    FROM backgrounds_owned WHERE player_id = ?
  `).all(playerId);

  const skins = db.prepare(`
    SELECT skin_id, unlock_method, unlocked_at 
    FROM button_skins WHERE player_id = ?
  `).all(playerId);

  return {
    ...progress,
    rarities,
    backgrounds,
    skins
  };
}

function getPointsInWindow(playerId, seconds) {
  const query = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total
    FROM points_events
    WHERE player_id = ? AND event_time >= datetime('now', '-' || ? || ' seconds')
  `);
  const result = query.get(playerId, seconds);
  return result?.total || 0;
}

function getRaritiesInWindow(playerId, startDate, endDate) {
  const query = db.prepare(`
    SELECT COUNT(*) as count
    FROM rarity_events
    WHERE player_id = ? AND found_at >= ? AND found_at < ?
  `);
  const result = query.get(playerId, startDate, endDate);
  return result?.count || 0;
}

function getRarityTierCountInWindow(playerId, tierName, startDate = null) {
  const tierIndex = gameConfig.rarityTiers[tierName];
  if (tierIndex === undefined) return 0;

  const eligibleRarities = gameConfig.rarities
    .filter((r, i) => i >= tierIndex)
    .map(r => r.name);

  if (eligibleRarities.length === 0) return 0;

  const placeholders = eligibleRarities.map(() => '?').join(',');
  
  let query, result;
  if (startDate) {
    query = db.prepare(`
      SELECT COUNT(*) as count
      FROM rarity_events
      WHERE player_id = ? AND rarity_name IN (${placeholders}) AND found_at >= ?
    `);
    result = query.get(playerId, ...eligibleRarities, startDate);
  } else {
    query = db.prepare(`
      SELECT COUNT(*) as count
      FROM rarity_events
      WHERE player_id = ? AND rarity_name IN (${placeholders})
    `);
    result = query.get(playerId, ...eligibleRarities);
  }
  
  return result?.count || 0;
}

function getManualClicksToday(playerId, startOfDay) {
  // We track total clicks, need to compute today's by storing snapshots
  // For now, return session-based clicks
  const progress = db.prepare(`
    SELECT manual_clicks FROM player_progress WHERE player_id = ?
  `).get(playerId);
  return progress?.manual_clicks || 0;
}

function getPurchasesToday(playerId, startOfDay) {
  const query = db.prepare(`
    SELECT COUNT(*) as count FROM shop_purchases
    WHERE player_id = ? AND purchased_at >= ?
  `);
  const result = query.get(playerId, startOfDay);
  return result?.count || 0;
}

function hasGoldenMode(playerId) {
  const query = db.prepare(`
    SELECT golden_mode_owned FROM player_progress WHERE player_id = ?
  `);
  const result = query.get(playerId);
  return result?.golden_mode_owned === 1;
}

function resetSession(playerId) {
  const update = db.prepare(`
    UPDATE active_sessions 
    SET session_start = datetime('now'), points_in_session = 0
    WHERE player_id = ?
  `);
  update.run(playerId);
}

function getSessionPoints(playerId) {
  const query = db.prepare(`
    SELECT points_in_session FROM active_sessions WHERE player_id = ?
  `);
  const result = query.get(playerId);
  return result?.points_in_session || 0;
}

module.exports = {
  addPoints,
  recordClick,
  recordPurchase,
  recordRarityFind,
  recordBackgroundPurchase,
  getPlayerProgress,
  getPointsInWindow,
  getRaritiesInWindow,
  getRarityTierCountInWindow,
  getManualClicksToday,
  getPurchasesToday,
  hasGoldenMode,
  resetSession,
  getSessionPoints
};
