/**
 * Challenge Service
 * Handles daily challenges - 3 per day from a pool
 */

const db = require('../db/database');
const gameConfig = require('../config/gameConfig');

function getUTCDateString() {
  return new Date().toISOString().split('T')[0];
}

// Seeded random number generator for consistent daily challenges
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyChallengeIds(date) {
  // Convert date to a number seed
  const seed = parseInt(date.replace(/-/g, ''), 10);
  const challenges = gameConfig.dailyChallenges;
  
  // Select 3 unique challenges using seeded random
  const selected = [];
  const available = [...Array(challenges.length).keys()];
  
  for (let i = 0; i < 3 && available.length > 0; i++) {
    const randomIndex = Math.floor(seededRandom(seed + i * 1000) * available.length);
    selected.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }
  
  return selected;
}

function getTodaysChallenges(playerId) {
  const today = getUTCDateString();
  const challengeIds = getDailyChallengeIds(today);
  
  // Ensure player has challenge records for today
  ensureChallengeRecords(playerId, today, challengeIds);
  
  // Get current progress
  const query = db.prepare(`
    SELECT challenge_id, current_progress, is_completed, completed_at
    FROM daily_challenge_progress
    WHERE player_id = ? AND challenge_date = ?
  `);
  const progress = query.all(playerId);
  
  // Map progress to challenge info
  return challengeIds.map((id, index) => {
    const challenge = gameConfig.dailyChallenges[id];
    const progressRecord = progress.find(p => p.challenge_id === id);
    
    return {
      id,
      index: index + 1,
      name: challenge.name,
      description: challenge.description,
      type: challenge.type,
      target: challenge.target,
      currentProgress: progressRecord?.current_progress || 0,
      isCompleted: progressRecord?.is_completed || 0,
      completedAt: progressRecord?.completed_at
    };
  });
}

function ensureChallengeRecords(playerId, date, challengeIds) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO daily_challenge_progress (player_id, challenge_date, challenge_id, current_progress, is_completed)
    VALUES (?, ?, ?, 0, 0)
  `);
  
  for (const id of challengeIds) {
    insert.run(playerId, date, id);
  }
}

function updateChallengeProgress(playerId, type, amount = 1, metadata = {}) {
  const today = getUTCDateString();
  const challengeIds = getDailyChallengeIds(today);
  
  ensureChallengeRecords(playerId, today, challengeIds);
  
  const completedChallenges = [];
  
  for (const id of challengeIds) {
    const challenge = gameConfig.dailyChallenges[id];
    
    // Check if this challenge matches the type
    if (!challengeMatchesType(challenge, type, metadata)) continue;
    
    // Get current progress
    const getProgress = db.prepare(`
      SELECT current_progress, is_completed 
      FROM daily_challenge_progress 
      WHERE player_id = ? AND challenge_date = ? AND challenge_id = ?
    `);
    const record = getProgress.get(playerId, today, id);
    
    if (record.is_completed) continue; // Already completed
    
    const newProgress = record.current_progress + amount;
    const isNowComplete = newProgress >= challenge.target;
    
    if (isNowComplete) {
      // Mark as complete
      const complete = db.prepare(`
        UPDATE daily_challenge_progress 
        SET current_progress = ?, is_completed = 1, completed_at = CURRENT_TIMESTAMP
        WHERE player_id = ? AND challenge_date = ? AND challenge_id = ?
      `);
      complete.run(newProgress, playerId, today, id);
      
      completedChallenges.push({
        id,
        name: challenge.name,
        target: challenge.target
      });
    } else {
      // Update progress
      const update = db.prepare(`
        UPDATE daily_challenge_progress 
        SET current_progress = ?
        WHERE player_id = ? AND challenge_date = ? AND challenge_id = ?
      `);
      update.run(newProgress, playerId, today, id);
    }
  }
  
  return completedChallenges;
}

function challengeMatchesType(challenge, type, metadata) {
  switch (challenge.type) {
    case 'clicks':
      return type === 'click';
    case 'points':
      return type === 'points';
    case 'rarity_tier':
      return type === 'rarity' && metadata.tier === challenge.tier;
    case 'any_rarity':
      return type === 'rarity';
    case 'specific_rarity':
      return type === 'rarity' && metadata.rarityId === challenge.rarityId;
    case 'background_purchase':
      return type === 'purchase' && metadata.itemType === 'background';
    case 'shop_purchase':
      return type === 'purchase';
    default:
      return false;
  }
}

function claimAllCompletedRewards(playerId) {
  const today = getUTCDateString();
  
  // Check if all 3 challenges are completed and not yet rewarded
  const check = db.prepare(`
    SELECT COUNT(*) as completed
    FROM daily_challenge_progress
    WHERE player_id = ? AND challenge_date = ? AND is_completed = 1
  `);
  const result = check.get(playerId, today);
  
  if (result.completed < 3) {
    return { success: false, message: 'Not all challenges completed' };
  }
  
  // Check if already rewarded today
  const rewardCheck = db.prepare(`
    SELECT id FROM challenge_rewards 
    WHERE player_id = ? AND challenge_date = ?
  `);
  const existing = rewardCheck.get(playerId, today);
  
  if (existing) {
    return { success: false, message: 'Already claimed today\'s reward' };
  }
  
  // Award a random light skin
  const lightSkins = gameConfig.buttonSkins.light;
  const randomSkin = lightSkins[Math.floor(Math.random() * lightSkins.length)];
  
  // Record skin unlock
  const insertSkin = db.prepare(`
    INSERT OR IGNORE INTO button_skins (player_id, skin_id, unlock_method)
    VALUES (?, ?, 'challenge')
  `);
  insertSkin.run(playerId, randomSkin.id);
  
  // Record reward
  const insertReward = db.prepare(`
    INSERT INTO challenge_rewards (player_id, challenge_date, reward_type, reward_value)
    VALUES (?, ?, 'skin', ?)
  `);
  insertReward.run(playerId, today, randomSkin.id);
  
  return {
    success: true,
    reward: {
      type: 'skin',
      skin: randomSkin
    }
  };
}

function getChallengeHistory(playerId, limit = 7) {
  const query = db.prepare(`
    SELECT 
      challenge_date,
      COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_count,
      GROUP_CONCAT(challenge_id) as challenge_ids
    FROM daily_challenge_progress
    WHERE player_id = ?
    GROUP BY challenge_date
    ORDER BY challenge_date DESC
    LIMIT ?
  `);
  return query.all(playerId, limit);
}

module.exports = {
  getTodaysChallenges,
  updateChallengeProgress,
  claimAllCompletedRewards,
  getChallengeHistory,
  getDailyChallengeIds
};
