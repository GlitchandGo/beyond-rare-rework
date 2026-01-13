/**
 * Beyond Rare - Simple JSON Server
 * Uses a JSON file for data persistence - no SQL needed!
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Data file path
const DATA_FILE = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load users from JSON file
function loadUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return {};
}

// Save users to JSON file
function saveUsers(users) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// Load initial data
let users = loadUsers();

// Auto-save every 30 seconds
setInterval(() => {
  saveUsers(users);
}, 30000);

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

// Check if userId exists
app.post('/api/user/check', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.json({ success: false, exists: false });
  }
  
  const exists = userId in users;
  res.json({ success: true, exists });
});

// Register new user
app.post('/api/user/register', (req, res) => {
  const { userId, username } = req.body;
  
  if (!userId || !username) {
    return res.status(400).json({ success: false, error: 'Missing userId or username' });
  }
  
  if (userId in users) {
    return res.json({ success: true, message: 'User already exists' });
  }
  
  users[userId] = {
    username,
    totalClicks: 0,
    points: 0,
    currentStage: 1,
    raritiesFound: 0,
    completionPercent: 0,
    lastUpdated: new Date().toISOString()
  };
  
  saveUsers(users);
  res.json({ success: true, message: 'User registered' });
});

// Update username
app.put('/api/user/username', (req, res) => {
  const { userId, username } = req.body;
  
  if (!userId || !username) {
    return res.status(400).json({ success: false, error: 'Missing userId or username' });
  }
  
  if (!(userId in users)) {
    users[userId] = {
      username,
      totalClicks: 0,
      points: 0,
      currentStage: 1,
      raritiesFound: 0,
      completionPercent: 0,
      lastUpdated: new Date().toISOString()
    };
  } else {
    users[userId].username = username;
    users[userId].lastUpdated = new Date().toISOString();
  }
  
  saveUsers(users);
  res.json({ success: true });
});

// Update user stats
app.post('/api/user/stats', (req, res) => {
  const { userId, username, totalClicks, points, currentStage, raritiesFound, completionPercent } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  
  if (!(userId in users)) {
    users[userId] = {
      username: username || 'Anonymous',
      totalClicks: totalClicks || 0,
      points: points || 0,
      currentStage: currentStage || 1,
      raritiesFound: raritiesFound || 0,
      completionPercent: completionPercent || 0,
      lastUpdated: new Date().toISOString()
    };
  } else {
    const user = users[userId];
    if (username) user.username = username;
    if (totalClicks !== undefined) user.totalClicks = totalClicks;
    if (points !== undefined) user.points = points;
    if (currentStage !== undefined) user.currentStage = currentStage;
    if (raritiesFound !== undefined) user.raritiesFound = raritiesFound;
    if (completionPercent !== undefined) user.completionPercent = completionPercent;
    user.lastUpdated = new Date().toISOString();
  }
  
  saveUsers(users);
  res.json({ success: true });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  
  // Convert to array and sort by stage, then completion percent
  const leaderboard = Object.entries(users)
    .map(([id, data]) => ({
      userId: id,
      username: data.username,
      currentStage: data.currentStage || 1,
      completionPercent: data.completionPercent || 0,
      totalClicks: data.totalClicks || 0
    }))
    .sort((a, b) => {
      if (b.currentStage !== a.currentStage) {
        return b.currentStage - a.currentStage;
      }
      return b.completionPercent - a.completionPercent;
    })
    .slice(0, limit)
    .map((user, index) => ({
      rank: index + 1,
      ...user
    }));
  
  res.json({ success: true, leaderboard });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

// Save on shutdown
process.on('SIGINT', () => {
  console.log('\nSaving data and shutting down...');
  saveUsers(users);
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveUsers(users);
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     Beyond Rare - Simple JSON Server             ║
╠══════════════════════════════════════════════════╣
║  🎮 Server running on http://localhost:${PORT}       ║
║  📁 Static files from /public                    ║
║  💾 Data saved to /data/users.json               ║
║  🏆 Leaderboard ready!                           ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
