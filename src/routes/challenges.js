/**
 * Challenge Routes
 * Handles daily challenges
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const challengeService = require('../services/challengeService');
const achievementService = require('../services/achievementService');
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

// Get today's challenges
router.get('/', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const challenges = challengeService.getTodaysChallenges(playerId);
    
    // Check if all completed
    const allCompleted = challenges.every(c => c.isCompleted);
    
    // Check if reward claimed
    const today = new Date().toISOString().split('T')[0];
    const rewardCheck = db.prepare(`
      SELECT id FROM challenge_rewards WHERE player_id = ? AND challenge_date = ?
    `);
    const rewardClaimed = !!rewardCheck.get(playerId, today);
    
    res.json({
      success: true,
      date: today,
      challenges,
      allCompleted,
      rewardClaimed,
      canClaimReward: allCompleted && !rewardClaimed
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Claim reward for completing all challenges
router.post('/claim', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const result = challengeService.claimAllCompletedRewards(playerId);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    
    // Check for challenges achievement
    const getChallengesCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM challenge_rewards WHERE player_id = ?
    `);
    const completedDays = getChallengesCompleted.get(playerId);
    
    const unlockedAchievements = achievementService.checkAndUpdateAchievements(playerId, {
      challengesCompleted: completedDays.count
    });
    
    res.json({
      success: true,
      reward: result.reward,
      unlockedAchievements
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get challenge history
router.get('/history', (req, res) => {
  try {
    const playerId = req.player.id;
    const limit = parseInt(req.query.limit) || 7;
    
    const history = challengeService.getChallengeHistory(playerId, limit);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
