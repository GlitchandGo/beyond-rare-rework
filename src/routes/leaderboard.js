/**
 * Leaderboard Routes
 * Handles daily, weekly, monthly, and all-time leaderboards
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const leaderboardService = require('../services/leaderboardService');

// Optional authentication for personal rank
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const player = playerService.getPlayerByToken(token);
    if (player && !player.is_banned) {
      req.player = player;
    }
  }
  next();
}

// Get daily leaderboard
router.get('/daily', optionalAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    
    const leaderboard = leaderboardService.getDailyLeaderboard(limit);
    
    let playerRank = null;
    if (req.player) {
      playerRank = leaderboardService.getPlayerRank(req.player.id, 'daily');
    }
    
    res.json({
      success: true,
      period: 'daily',
      leaderboard,
      playerRank
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get weekly leaderboard
router.get('/weekly', optionalAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    
    const leaderboard = leaderboardService.getWeeklyLeaderboard(limit);
    
    let playerRank = null;
    if (req.player) {
      playerRank = leaderboardService.getPlayerRank(req.player.id, 'weekly');
    }
    
    res.json({
      success: true,
      period: 'weekly',
      leaderboard,
      playerRank
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get monthly leaderboard
router.get('/monthly', optionalAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    
    const leaderboard = leaderboardService.getMonthlyLeaderboard(limit);
    
    let playerRank = null;
    if (req.player) {
      playerRank = leaderboardService.getPlayerRank(req.player.id, 'monthly');
    }
    
    res.json({
      success: true,
      period: 'monthly',
      leaderboard,
      playerRank
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all-time leaderboard
router.get('/all-time', optionalAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    
    const leaderboard = leaderboardService.getAllTimeLeaderboard(limit);
    
    let playerRank = null;
    if (req.player) {
      playerRank = leaderboardService.getPlayerRank(req.player.id, 'all-time');
    }
    
    res.json({
      success: true,
      period: 'all-time',
      leaderboard,
      playerRank
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leaderboard around player (for context)
router.get('/around-me/:period', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }
    
    const player = playerService.getPlayerByToken(token);
    if (!player) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const { period } = req.params;
    const validPeriods = ['daily', 'weekly', 'monthly', 'all-time'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ success: false, error: 'Invalid period' });
    }
    
    const range = Math.min(parseInt(req.query.range) || 5, 20);
    
    const result = leaderboardService.getLeaderboardAroundPlayer(player.id, period, range);
    
    res.json({
      success: true,
      period,
      entries: result.entries,
      playerRank: result.playerRank
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manually trigger snapshot (for syncing)
router.post('/snapshot', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }
    
    const player = playerService.getPlayerByToken(token);
    if (!player) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    leaderboardService.snapshotPlayerStats(player.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
