/**
 * Beyond Rare - Game Server
 * Express server with SQLite database
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Initialize database (must be done before routes)
const db = require('./db/database');

// Import routes
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const streakRoutes = require('./routes/streak');
const challengeRoutes = require('./routes/challenges');
const achievementRoutes = require('./routes/achievements');
const leaderboardRoutes = require('./routes/leaderboard');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public directory
app.use(express.static(path.join(__dirname, '../public')));

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// Click rate limiter (more restrictive)
const clickLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 20, // 20 clicks per second max
  message: { success: false, error: 'Clicking too fast!' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/progress/click', clickLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Game config endpoint (public)
app.get('/api/config', (req, res) => {
  const gameConfig = require('./config/gameConfig');
  res.json({
    success: true,
    config: {
      rarities: gameConfig.rarities.map(r => ({
        id: r.id,
        name: r.name,
        tier: r.tier,
        chance: r.chance,
        color: r.color,
        points: r.points
      })),
      achievements: gameConfig.achievements.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        tiers: a.tiers
      })),
      streakMilestones: gameConfig.streakMilestones,
      buttonSkins: gameConfig.buttonSkins
    }
  });
});

// Catch-all for SPA - serve index.html for non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Beyond Rare - Game Server                ║
╠══════════════════════════════════════════════════╣
║  🎮 Server running on http://localhost:${PORT}       ║
║  📁 Serving static files from /public            ║
║  🗄️  SQLite database initialized                 ║
║  🚀 Ready to play!                               ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
