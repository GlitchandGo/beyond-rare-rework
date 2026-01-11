/**
 * Leaderboard Service
 * Handles daily, weekly, monthly, and all-time leaderboards
 */

const db = require('../db/database');
const gameConfig = require('../config/gameConfig');

function getUTCDateString() {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setUTCDate(diff));
  return monday.toISOString().split('T')[0];
}

function getMonthStart() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

// Snapshot current stats for leaderboard tracking
function snapshotPlayerStats(playerId) {
  const today = getUTCDateString();
  
  // Get current total stats
  const getStats = db.prepare(`
    SELECT total_points, total_clicks FROM player_progress WHERE player_id = ?
  `);
  const stats = getStats.get(playerId);
  
  if (!stats) return;
  
  // Get unique rarities count
  const getRarities = db.prepare(`
    SELECT COUNT(DISTINCT rarity_id) as count FROM rarity_finds WHERE player_id = ?
  `);
  const rarities = getRarities.get(playerId);
  
  // Calculate completion %
  const completionService = require('./completionService');
  const completion = completionService.calculateCompletion(playerId);
  
  // Insert or update snapshot
  const upsert = db.prepare(`
    INSERT INTO leaderboard_snapshots (player_id, snapshot_date, total_points, total_clicks, unique_rarities, completion_percent)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, snapshot_date) DO UPDATE SET
      total_points = excluded.total_points,
      total_clicks = excluded.total_clicks,
      unique_rarities = excluded.unique_rarities,
      completion_percent = excluded.completion_percent
  `);
  upsert.run(playerId, today, stats.total_points, stats.total_clicks, rarities.count, completion.totalPercent);
}

function getDailyLeaderboard(limit = 100) {
  const today = getUTCDateString();
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Get today's snapshots with yesterday's for comparison
  const query = db.prepare(`
    SELECT 
      p.id as player_id,
      p.username,
      COALESCE(t.unique_rarities, 0) as rarities_today,
      COALESCE(t.completion_percent, 0) as completion_today,
      COALESCE(y.completion_percent, 0) as completion_yesterday,
      (COALESCE(t.completion_percent, 0) - COALESCE(y.completion_percent, 0)) as percent_change
    FROM players p
    LEFT JOIN leaderboard_snapshots t ON p.id = t.player_id AND t.snapshot_date = ?
    LEFT JOIN leaderboard_snapshots y ON p.id = y.player_id AND y.snapshot_date = ?
    WHERE p.is_banned = 0
    ORDER BY percent_change DESC, completion_today DESC
    LIMIT ?
  `);
  
  const results = query.all(today, yesterdayStr, limit);
  
  return results.map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id,
    username: row.username || 'Anonymous',
    raritiesGained: row.rarities_today,
    completionPercent: row.completion_today,
    percentChange: row.percent_change
  }));
}

function getWeeklyLeaderboard(limit = 100) {
  const weekStart = getWeekStart();
  const today = getUTCDateString();
  
  // Compare current snapshot to week start
  const query = db.prepare(`
    SELECT 
      p.id as player_id,
      p.username,
      COALESCE(t.unique_rarities, 0) - COALESCE(w.unique_rarities, 0) as rarities_gained,
      COALESCE(t.completion_percent, 0) as completion_current,
      (COALESCE(t.completion_percent, 0) - COALESCE(w.completion_percent, 0)) as percent_change
    FROM players p
    LEFT JOIN leaderboard_snapshots t ON p.id = t.player_id AND t.snapshot_date = ?
    LEFT JOIN leaderboard_snapshots w ON p.id = w.player_id AND w.snapshot_date = ?
    WHERE p.is_banned = 0
    ORDER BY percent_change DESC, completion_current DESC
    LIMIT ?
  `);
  
  const results = query.all(today, weekStart, limit);
  
  return results.map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id,
    username: row.username || 'Anonymous',
    raritiesGained: Math.max(0, row.rarities_gained || 0),
    completionPercent: row.completion_current,
    percentChange: Math.max(0, row.percent_change || 0)
  }));
}

function getMonthlyLeaderboard(limit = 100) {
  const monthStart = getMonthStart();
  const today = getUTCDateString();
  
  const query = db.prepare(`
    SELECT 
      p.id as player_id,
      p.username,
      COALESCE(t.unique_rarities, 0) - COALESCE(m.unique_rarities, 0) as rarities_gained,
      COALESCE(t.completion_percent, 0) as completion_current,
      (COALESCE(t.completion_percent, 0) - COALESCE(m.completion_percent, 0)) as percent_change
    FROM players p
    LEFT JOIN leaderboard_snapshots t ON p.id = t.player_id AND t.snapshot_date = ?
    LEFT JOIN leaderboard_snapshots m ON p.id = m.player_id AND m.snapshot_date = ?
    WHERE p.is_banned = 0
    ORDER BY percent_change DESC, completion_current DESC
    LIMIT ?
  `);
  
  const results = query.all(today, monthStart, limit);
  
  return results.map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id,
    username: row.username || 'Anonymous',
    raritiesGained: Math.max(0, row.rarities_gained || 0),
    completionPercent: row.completion_current,
    percentChange: Math.max(0, row.percent_change || 0)
  }));
}

function getAllTimeLeaderboard(limit = 100) {
  // All-time is ranked purely by completion percent
  const query = db.prepare(`
    SELECT 
      p.id as player_id,
      p.username,
      (SELECT COUNT(DISTINCT rarity_id) FROM rarity_finds WHERE player_id = p.id) as unique_rarities,
      pp.total_points,
      pp.total_clicks
    FROM players p
    JOIN player_progress pp ON p.id = pp.player_id
    WHERE p.is_banned = 0
    ORDER BY unique_rarities DESC, total_points DESC
    LIMIT ?
  `);
  
  const results = query.all(limit);
  
  // Calculate completion for each
  const completionService = require('./completionService');
  
  return results.map((row, index) => {
    const completion = completionService.calculateCompletion(row.player_id);
    return {
      rank: index + 1,
      playerId: row.player_id,
      username: row.username || 'Anonymous',
      uniqueRarities: row.unique_rarities,
      completionPercent: completion.totalPercent,
      totalPoints: row.total_points
    };
  });
}

function getPlayerRank(playerId, period = 'all-time') {
  let leaderboard;
  switch (period) {
    case 'daily':
      leaderboard = getDailyLeaderboard(1000);
      break;
    case 'weekly':
      leaderboard = getWeeklyLeaderboard(1000);
      break;
    case 'monthly':
      leaderboard = getMonthlyLeaderboard(1000);
      break;
    default:
      leaderboard = getAllTimeLeaderboard(1000);
  }
  
  const entry = leaderboard.find(e => e.playerId === playerId);
  return entry ? entry.rank : null;
}

function getLeaderboardAroundPlayer(playerId, period = 'all-time', range = 5) {
  let leaderboard;
  switch (period) {
    case 'daily':
      leaderboard = getDailyLeaderboard(1000);
      break;
    case 'weekly':
      leaderboard = getWeeklyLeaderboard(1000);
      break;
    case 'monthly':
      leaderboard = getMonthlyLeaderboard(1000);
      break;
    default:
      leaderboard = getAllTimeLeaderboard(1000);
  }
  
  const playerIndex = leaderboard.findIndex(e => e.playerId === playerId);
  if (playerIndex === -1) return { entries: [], playerRank: null };
  
  const start = Math.max(0, playerIndex - range);
  const end = Math.min(leaderboard.length, playerIndex + range + 1);
  
  return {
    entries: leaderboard.slice(start, end),
    playerRank: playerIndex + 1
  };
}

module.exports = {
  snapshotPlayerStats,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getAllTimeLeaderboard,
  getPlayerRank,
  getLeaderboardAroundPlayer
};
