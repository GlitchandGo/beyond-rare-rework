/**
 * Database - sql.js implementation (pure JavaScript SQLite)
 * Compatible with Node.js v24+
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Database state
let db = null;
let dbReady = null;

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'beyond_rare.db');

// Schema
const schema = `
-- Players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  username_lower TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT DEFAULT (datetime('now')),
  last_claim_date TEXT,
  auth_token TEXT UNIQUE,
  is_banned INTEGER DEFAULT 0
);

-- Player progress
CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  manual_clicks INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  golden_mode_owned INTEGER DEFAULT 0,
  percent_completion REAL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Rarity finds
CREATE TABLE IF NOT EXISTS rarity_finds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  rarity_id TEXT NOT NULL,
  first_found_at TEXT DEFAULT (datetime('now')),
  find_count INTEGER DEFAULT 1,
  UNIQUE(player_id, rarity_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Rarity events log
CREATE TABLE IF NOT EXISTS rarity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  rarity_name TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  found_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Points events log
CREATE TABLE IF NOT EXISTS points_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  event_time TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Button skins owned
CREATE TABLE IF NOT EXISTS button_skins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  skin_id TEXT NOT NULL,
  unlocked_at TEXT DEFAULT (datetime('now')),
  unlock_method TEXT,
  UNIQUE(player_id, skin_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Backgrounds owned
CREATE TABLE IF NOT EXISTS backgrounds_owned (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  background_name TEXT NOT NULL,
  background_type TEXT,
  unlocked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(player_id, background_name),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Shop purchases
CREATE TABLE IF NOT EXISTS shop_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  purchased_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Daily challenge progress
CREATE TABLE IF NOT EXISTS daily_challenge_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  challenge_date TEXT NOT NULL,
  challenge_id INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  completed_at TEXT,
  UNIQUE(player_id, challenge_date, challenge_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Challenge rewards
CREATE TABLE IF NOT EXISTS challenge_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  challenge_date TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT,
  claimed_at TEXT DEFAULT (datetime('now')),
  UNIQUE(player_id, challenge_date),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Player achievements
CREATE TABLE IF NOT EXISTS player_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  current_tier INTEGER DEFAULT 0,
  current_progress INTEGER DEFAULT 0,
  is_acknowledged INTEGER DEFAULT 1,
  unlocked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(player_id, achievement_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Daily streaks
CREATE TABLE IF NOT EXISTS daily_streaks (
  player_id TEXT PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_claim_date TEXT,
  total_claims INTEGER DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Streak reward history
CREATE TABLE IF NOT EXISTS streak_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  streak_day INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT,
  claimed_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Leaderboard snapshots
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  unique_rarities INTEGER DEFAULT 0,
  completion_percent REAL DEFAULT 0,
  UNIQUE(player_id, snapshot_date),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Percent completion history
CREATE TABLE IF NOT EXISTS percent_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  percent_value REAL NOT NULL,
  recorded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Session tracking for timed challenges
CREATE TABLE IF NOT EXISTS active_sessions (
  player_id TEXT PRIMARY KEY,
  session_start TEXT DEFAULT (datetime('now')),
  points_in_session INTEGER DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
`;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Database loaded from:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }
  
  // Run schema
  db.run(schema);
  
  // Create indexes
  const indexes = `
    CREATE INDEX IF NOT EXISTS idx_rarity_events_player_date ON rarity_events(player_id, found_at);
    CREATE INDEX IF NOT EXISTS idx_rarity_events_date ON rarity_events(found_at);
    CREATE INDEX IF NOT EXISTS idx_points_events_player_time ON points_events(player_id, event_time);
    CREATE INDEX IF NOT EXISTS idx_shop_purchases_player ON shop_purchases(player_id);
    CREATE INDEX IF NOT EXISTS idx_daily_challenge_progress_player_date ON daily_challenge_progress(player_id, challenge_date);
    CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date);
    CREATE INDEX IF NOT EXISTS idx_percent_history_player_date ON percent_history(player_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_rarity_finds_player ON rarity_finds(player_id);
  `;
  db.run(indexes);
  
  // Save to disk
  saveDatabase();
  
  console.log('Database initialized successfully');
  return db;
}

// Save database to disk
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Auto-save every 30 seconds
setInterval(() => {
  saveDatabase();
}, 30000);

// Database ready promise
dbReady = initDatabase();

// Wrapper class to provide better-sqlite3-like interface
class DatabaseWrapper {
  constructor() {
    this.statements = new Map();
    this._inTransaction = false;
  }

  async waitReady() {
    await dbReady;
  }

  prepare(sql) {
    const self = this;
    return {
      run: (...params) => {
        db.run(sql, params);
        if (!self._inTransaction) {
          saveDatabase();
        }
        return { changes: db.getRowsModified(), lastInsertRowid: self.getLastInsertRowId() };
      },
      get: (...params) => {
        const result = db.exec(sql, params);
        if (result.length === 0 || result[0].values.length === 0) return undefined;
        const columns = result[0].columns;
        const values = result[0].values[0];
        const row = {};
        columns.forEach((col, i) => row[col] = values[i]);
        return row;
      },
      all: (...params) => {
        const result = db.exec(sql, params);
        if (result.length === 0) return [];
        const columns = result[0].columns;
        return result[0].values.map(values => {
          const row = {};
          columns.forEach((col, i) => row[col] = values[i]);
          return row;
        });
      }
    };
  }

  exec(sql) {
    db.run(sql);
    if (!this._inTransaction) {
      saveDatabase();
    }
  }

  getLastInsertRowId() {
    const result = db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] || 0;
  }

  // Simplified transaction - just runs function and saves at end
  // sql.js doesn't support nested transactions well, so we just batch operations
  transaction(fn) {
    const self = this;
    return (...args) => {
      const wasInTransaction = self._inTransaction;
      self._inTransaction = true;
      try {
        const result = fn(...args);
        if (!wasInTransaction) {
          saveDatabase();
        }
        return result;
      } finally {
        self._inTransaction = wasInTransaction;
      }
    };
  }

  close() {
    if (db) {
      saveDatabase();
      db.close();
    }
  }
}

module.exports = new DatabaseWrapper();
module.exports.dbReady = dbReady;
module.exports.saveDatabase = saveDatabase;
