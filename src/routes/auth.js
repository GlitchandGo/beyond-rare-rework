/**
 * Auth Routes
 * Handles player creation and authentication
 */

const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const db = require('../db/database');

// Create new player (or get existing by token)
router.post('/register', (req, res) => {
  try {
    const { username } = req.body;
    
    const player = playerService.createPlayer(username);
    
    res.json({
      success: true,
      player: {
        id: player.id,
        token: player.token,
        username: player.username
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Login with existing token
router.post('/login', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }
    
    const player = playerService.getPlayerByToken(token);
    
    if (!player) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    if (player.is_banned) {
      return res.status(403).json({ success: false, error: 'Account banned' });
    }
    
    // Update last login
    const updateLogin = db.prepare(`
      UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `);
    updateLogin.run(player.id);
    
    res.json({
      success: true,
      player: {
        id: player.id,
        username: player.username,
        createdAt: player.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update username
router.put('/username', (req, res) => {
  try {
    const { token, username } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }
    
    const player = playerService.getPlayerByToken(token);
    if (!player) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const result = playerService.updateUsername(player.id, username);
    
    res.json({
      success: true,
      username: result.username
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get current player info
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }
    
    const player = playerService.getPlayerByToken(token);
    if (!player) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    res.json({
      success: true,
      player: {
        id: player.id,
        username: player.username,
        createdAt: player.created_at,
        lastLogin: player.last_login
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
