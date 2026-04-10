const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists so SQLite has somewhere to store the DB file
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'community.db')); // SQLite database file

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    discord_id TEXT PRIMARY KEY, -- Discord user ID (unique identifier)
    username TEXT NOT NULL,
    avatar TEXT,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP -- Tracks last login time
  )
`);

// Create reviews table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE, -- Ensures one review per person
    content TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    is_anonymous BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(discord_id)
  )
`);

module.exports = db;