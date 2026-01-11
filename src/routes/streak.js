/**
 * Streak Routes
 * Handles daily streak claiming and rewards
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const streakService = require('../services/streakService');
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

// Get current streak status
router.get('/', (req, res) => {
  try {
    const playerId = req.player.id;
    
    // Check and potentially reset streak if missed a day
    const streak = streakService.checkAndResetStreak(playerId);
    
    if (!streak) {
      return res.json({
        success: true,
        streak: {
          current: 0,
          longest: 0,
          canClaim: true,
          totalClaims: 0,
          upcomingMilestones: streakService.getUpcomingMilestones(0)
        }
      });
    }
    
    const canClaim = streakService.canClaimToday(playerId);
    
    res.json({
      success: true,
      streak: {
        current: streak.current_streak,
        longest: streak.longest_streak,
        lastClaim: streak.last_claim_date,
        canClaim: canClaim,
        totalClaims: streak.total_claims,
        upcomingMilestones: streakService.getUpcomingMilestones(streak.current_streak)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Claim daily streak reward
router.post('/claim', (req, res) => {
  try {
    const playerId = req.player.id;
    
    // Check if can claim
    if (!streakService.canClaimToday(playerId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already claimed today\'s reward' 
      });
    }
    
    // Claim the streak
    const result = streakService.claimDailyStreak(playerId);
    
    // Check for streak achievement
    const unlockedAchievements = achievementService.checkAndUpdateAchievements(playerId, {
      dailyStreak: result.newStreak
    });
    
    res.json({
      success: true,
      streak: {
        current: result.newStreak,
        longest: result.longestStreak,
        totalClaims: result.totalClaims
      },
      rewards: result.rewards,
      upcomingMilestones: streakService.getUpcomingMilestones(result.newStreak),
      unlockedAchievements
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get streak reward history
router.get('/history', (req, res) => {
  try {
    const playerId = req.player.id;
    
    const history = streakService.getRewardHistory(playerId);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
