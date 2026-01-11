/**
 * Achievement Routes
 * Handles achievement progress and acknowledgment
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const achievementService = require('../services/achievementService');

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

// Get all achievements with progress
router.get('/', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const achievements = achievementService.getPlayerAchievements(playerId);
    const stats = achievementService.getAchievementStats(playerId);
    
    res.json({
      success: true,
      achievements,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unacknowledged achievements (for popup display)
router.get('/unacknowledged', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const unacknowledged = achievementService.getUnacknowledgedAchievements(playerId);
    
    res.json({
      success: true,
      achievements: unacknowledged
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Acknowledge a specific achievement
router.post('/acknowledge/:achievementId', (req, res) => {
  try {
    const playerId = req.player.id;
    const { achievementId } = req.params;
    
    achievementService.acknowledgeAchievement(playerId, achievementId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Acknowledge all achievements
router.post('/acknowledge-all', (req, res) => {
  try {
    const playerId = req.player.id;
    
    achievementService.acknowledgeAllAchievements(playerId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get achievement stats
router.get('/stats', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const stats = achievementService.getAchievementStats(playerId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
