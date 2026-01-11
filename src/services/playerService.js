/**
 * Player Service
 * Handles player creation, authentication, and management
 */

const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const gameConfig = require('../config/gameConfig');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateDefaultUsername() {
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `player_${randomStr}`;
}

function validateUsername(username) {
  const { usernameRules, reservedUsernames } = gameConfig;
  
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < usernameRules.minLength) {
    return { valid: false, error: `Username must be at least ${usernameRules.minLength} characters` };
  }

  if (trimmed.length > usernameRules.maxLength) {
    return { valid: false, error: `Username must be at most ${usernameRules.maxLength} characters` };
  }

  if (!usernameRules.pattern.test(trimmed)) {
    return { valid: false, error: usernameRules.patternDescription };
  }

  if (reservedUsernames.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true, username: trimmed };
}

function isUsernameTaken(username, excludePlayerId = null) {
  const query = excludePlayerId
    ? db.prepare('SELECT id FROM players WHERE username_lower = ? AND id != ?')
    : db.prepare('SELECT id FROM players WHERE username_lower = ?');
  
  const result = excludePlayerId
    ? query.get(username.toLowerCase(), excludePlayerId)
    : query.get(username.toLowerCase());
  
  return !!result;
}

function createPlayer(username = null) {
  const id = uuidv4();
  const token = generateToken();
  
  let finalUsername = username;
  if (!finalUsername) {
    finalUsername = generateDefaultUsername();
    while (isUsernameTaken(finalUsername)) {
      finalUsername = generateDefaultUsername();
    }
  } else {
    const validation = validateUsername(finalUsername);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    finalUsername = validation.username;
    
    if (isUsernameTaken(finalUsername)) {
      throw new Error('Username is already taken');
    }
  }

  const insertPlayer = db.prepare(`
    INSERT INTO players (id, username, username_lower, auth_token)
    VALUES (?, ?, ?, ?)
  `);

  const insertProgress = db.prepare(`
    INSERT INTO player_progress (player_id)
    VALUES (?)
  `);

  const insertStreak = db.prepare(`
    INSERT INTO daily_streaks (player_id)
    VALUES (?)
  `);

  const transaction = db.transaction(() => {
    insertPlayer.run(id, finalUsername, finalUsername.toLowerCase(), token);
    insertProgress.run(id);
    insertStreak.run(id);
  });

  transaction();

  return {
    id,
    username: finalUsername,
    token,
    createdAt: new Date().toISOString()
  };
}

function getPlayerByToken(token) {
  const query = db.prepare(`
    SELECT p.*, pp.total_points, pp.manual_clicks, pp.total_purchases, 
           pp.golden_mode_owned, pp.percent_completion,
           ds.current_streak, ds.longest_streak, ds.last_claim_date, ds.total_claims
    FROM players p
    LEFT JOIN player_progress pp ON p.id = pp.player_id
    LEFT JOIN daily_streaks ds ON p.id = ds.player_id
    WHERE p.auth_token = ?
  `);
  return query.get(token);
}

function getPlayerById(playerId) {
  const query = db.prepare(`
    SELECT p.*, pp.total_points, pp.manual_clicks, pp.total_purchases, 
           pp.golden_mode_owned, pp.percent_completion,
           ds.current_streak, ds.longest_streak, ds.last_claim_date, ds.total_claims
    FROM players p
    LEFT JOIN player_progress pp ON p.id = pp.player_id
    LEFT JOIN daily_streaks ds ON p.id = ds.player_id
    WHERE p.id = ?
  `);
  return query.get(playerId);
}

function updateUsername(playerId, newUsername) {
  const validation = validateUsername(newUsername);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (isUsernameTaken(validation.username, playerId)) {
    throw new Error('Username is already taken');
  }

  const update = db.prepare(`
    UPDATE players SET username = ?, username_lower = ? WHERE id = ?
  `);
  update.run(validation.username, validation.username.toLowerCase(), playerId);

  return { username: validation.username };
}

function updateLastLogin(playerId) {
  const update = db.prepare(`
    UPDATE players SET last_login = datetime('now') WHERE id = ?
  `);
  update.run(playerId);
}

function regenerateToken(playerId) {
  const newToken = generateToken();
  const update = db.prepare(`
    UPDATE players SET auth_token = ? WHERE id = ?
  `);
  update.run(newToken, playerId);
  return newToken;
}

module.exports = {
  createPlayer,
  getPlayerByToken,
  getPlayerById,
  updateUsername,
  updateLastLogin,
  regenerateToken,
  validateUsername,
  isUsernameTaken
};
