/**
 * Completion Service
 * Calculates and tracks percent completion
 */

const db = require('../db/database');
const gameConfig = require('../config/gameConfig');

function calculateCompletion(playerId) {
  const weights = gameConfig.completionWeights;
  const totals = gameConfig.completionTotals;

  // Get counts
  const raritiesOwned = db.prepare(`
    SELECT COUNT(DISTINCT rarity_id) as count FROM rarity_finds WHERE player_id = ?
  `).get(playerId)?.count || 0;

  const backgroundsOwned = db.prepare(`
    SELECT COUNT(*) as count FROM backgrounds_owned WHERE player_id = ?
  `).get(playerId)?.count || 0;

  const skinsOwned = db.prepare(`
    SELECT COUNT(*) as count FROM button_skins WHERE player_id = ?
  `).get(playerId)?.count || 0;

  const progress = db.prepare(`
    SELECT total_purchases, golden_mode_owned FROM player_progress WHERE player_id = ?
  `).get(playerId);

  // Count unique shop item types purchased
  const uniqueShopItems = db.prepare(`
    SELECT COUNT(DISTINCT item_id) as count FROM shop_purchases WHERE player_id = ? AND item_type = 'shop'
  `).get(playerId)?.count || 0;

  // Calculate percentages for each category
  const raritiesPercent = (raritiesOwned / totals.rarities) * weights.rarities;
  const backgroundsPercent = (backgroundsOwned / (totals.permanentBackgrounds + totals.seasonalBackgrounds)) * (weights.backgrounds + weights.seasonalBackgrounds);
  const shopPercent = (uniqueShopItems / totals.shopItems) * weights.shopItems;
  const skinsPercent = (skinsOwned / (totals.buttonSkinsLight + totals.buttonSkinsDark)) * weights.buttonSkins;

  const totalPercent = raritiesPercent + backgroundsPercent + shopPercent + skinsPercent;

  return {
    totalPercent: Math.min(100, Math.round(totalPercent * 100) / 100),
    breakdown: {
      rarities: { current: raritiesOwned, total: totals.rarities, percent: Math.round((raritiesOwned / totals.rarities) * 100) },
      backgrounds: { current: backgroundsOwned, total: totals.permanentBackgrounds + totals.seasonalBackgrounds, percent: Math.round((backgroundsOwned / (totals.permanentBackgrounds + totals.seasonalBackgrounds)) * 100) },
      shopItems: { current: uniqueShopItems, total: totals.shopItems, percent: Math.round((uniqueShopItems / totals.shopItems) * 100) },
      buttonSkins: { current: skinsOwned, total: totals.buttonSkinsLight + totals.buttonSkinsDark, percent: Math.round((skinsOwned / (totals.buttonSkinsLight + totals.buttonSkinsDark)) * 100) }
    }
  };
}

function updateCompletion(playerId) {
  const completion = calculateCompletion(playerId);
  
  // Update player progress
  const update = db.prepare(`
    UPDATE player_progress SET percent_completion = ?, updated_at = datetime('now') WHERE player_id = ?
  `);
  update.run(completion.total, playerId);

  // Log to history
  const log = db.prepare(`
    INSERT INTO percent_history (player_id, percent_value) VALUES (?, ?)
  `);
  log.run(playerId, completion.total);

  return completion;
}

function getCompletionHistory(playerId, days = 30) {
  const query = db.prepare(`
    SELECT percent_value, recorded_at
    FROM percent_history
    WHERE player_id = ? AND recorded_at >= datetime('now', '-' || ? || ' days')
    ORDER BY recorded_at DESC
  `);
  return query.all(playerId, days);
}

function getPercentChange(playerId, startDate, endDate) {
  const startQuery = db.prepare(`
    SELECT percent_value FROM percent_history
    WHERE player_id = ? AND recorded_at >= ?
    ORDER BY recorded_at ASC LIMIT 1
  `);
  const endQuery = db.prepare(`
    SELECT percent_value FROM percent_history
    WHERE player_id = ? AND recorded_at <= ?
    ORDER BY recorded_at DESC LIMIT 1
  `);

  const startPercent = startQuery.get(playerId, startDate)?.percent_value || 0;
  const endPercent = endQuery.get(playerId, endDate)?.percent_value || 0;

  return endPercent - startPercent;
}

module.exports = {
  calculateCompletion,
  updateCompletion,
  getCompletionHistory,
  getPercentChange
};
