/**
 * Streak Service
 * Handles daily streaks and streak rewards
 */

const db = require('../db/database');
const gameConfig = require('../config/gameConfig');

function getUTCDateString() {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

function getStreak(playerId) {
  const query = db.prepare(`
    SELECT * FROM daily_streaks WHERE player_id = ?
  `);
  return query.get(playerId);
}

function checkAndResetStreak(playerId) {
  const streak = getStreak(playerId);
  if (!streak) return null;

  const today = getUTCDateString();
  const yesterday = getYesterdayUTC();

  // If last claim was before yesterday, reset streak
  if (streak.last_claim_date && streak.last_claim_date < yesterday) {
    const reset = db.prepare(`
      UPDATE daily_streaks SET current_streak = 0 WHERE player_id = ?
    `);
    reset.run(playerId);
    return { ...streak, current_streak: 0 };
  }

  return streak;
}

function canClaimToday(playerId) {
  const streak = getStreak(playerId);
  if (!streak) return false;

  const today = getUTCDateString();
  return streak.last_claim_date !== today;
}

function claimDailyStreak(playerId) {
  const streak = getStreak(playerId);
  if (!streak) {
    throw new Error('Streak record not found');
  }

  const today = getUTCDateString();
  const yesterday = getYesterdayUTC();

  // Check if already claimed today
  if (streak.last_claim_date === today) {
    throw new Error('Already claimed today');
  }

  // Calculate new streak
  let newStreak;
  if (streak.last_claim_date === yesterday) {
    // Continuing streak
    newStreak = streak.current_streak + 1;
  } else if (!streak.last_claim_date) {
    // First claim ever
    newStreak = 1;
  } else {
    // Streak broken, starting fresh
    newStreak = 1;
  }

  const newLongest = Math.max(streak.longest_streak, newStreak);

  // Update streak
  const update = db.prepare(`
    UPDATE daily_streaks 
    SET current_streak = ?, longest_streak = ?, last_claim_date = ?, total_claims = total_claims + 1
    WHERE player_id = ?
  `);
  update.run(newStreak, newLongest, today, playerId);

  // Calculate rewards
  const rewards = [];
  
  // Base points reward
  const pointsReward = gameConfig.streakBaseReward;
  rewards.push({ type: 'points', value: pointsReward });

  // Log base reward
  const logReward = db.prepare(`
    INSERT INTO streak_rewards (player_id, streak_day, reward_type, reward_value)
    VALUES (?, ?, 'points', ?)
  `);
  logReward.run(playerId, newStreak, pointsReward.toString());

  // Check for milestone rewards
  const milestone = gameConfig.streakMilestones.find(m => m.day === newStreak);
  if (milestone) {
    rewards.push({
      type: 'milestone',
      day: milestone.day,
      reward: milestone.reward
    });

    // Award the skin
    if (milestone.reward.type === 'skin') {
      const insertSkin = db.prepare(`
        INSERT OR IGNORE INTO button_skins (player_id, skin_id, unlock_method)
        VALUES (?, ?, 'streak')
      `);
      insertSkin.run(playerId, milestone.reward.skinId);

      // Log milestone reward
      const logMilestone = db.prepare(`
        INSERT INTO streak_rewards (player_id, streak_day, reward_type, reward_value)
        VALUES (?, ?, 'skin', ?)
      `);
      logMilestone.run(playerId, newStreak, milestone.reward.skinId);
    }
  }

  // Add points to player
  const addPoints = db.prepare(`
    UPDATE player_progress SET total_points = total_points + ? WHERE player_id = ?
  `);
  addPoints.run(pointsReward, playerId);

  return {
    newStreak,
    longestStreak: newLongest,
    rewards,
    totalClaims: streak.total_claims + 1
  };
}

function getRewardHistory(playerId) {
  const query = db.prepare(`
    SELECT streak_day, reward_type, reward_value, claimed_at
    FROM streak_rewards
    WHERE player_id = ?
    ORDER BY claimed_at DESC
    LIMIT 50
  `);
  return query.all(playerId);
}

function getUpcomingMilestones(currentStreak) {
  return gameConfig.streakMilestones
    .filter(m => m.day > currentStreak)
    .slice(0, 3);
}

module.exports = {
  getStreak,
  checkAndResetStreak,
  canClaimToday,
  claimDailyStreak,
  getRewardHistory,
  getUpcomingMilestones
};
