const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Surveys table
        db.run(`
          CREATE TABLE IF NOT EXISTS surveys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'draft',
            config TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Survey tokens table
        db.run(`
          CREATE TABLE IF NOT EXISTS survey_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id TEXT UNIQUE NOT NULL,
            survey_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            allowed_domains TEXT,
            valid_from DATETIME,
            valid_until DATETIME,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (survey_id) REFERENCES surveys(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Survey responses table
        db.run(`
          CREATE TABLE IF NOT EXISTS survey_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_id INTEGER NOT NULL,
            token_id TEXT,
            response_data TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (survey_id) REFERENCES surveys(id)
          )
        `);

        // Individual response answers table
        db.run(`
          CREATE TABLE IF NOT EXISTS response_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            response_id INTEGER NOT NULL,
            step_id TEXT NOT NULL,
            question_text TEXT NOT NULL,
            question_type TEXT NOT NULL,
            answer_value TEXT,
            answer_index INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (response_id) REFERENCES survey_responses(id)
          )
        `);

        // Audit logs table
        db.run(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT,
            ip_address TEXT,
            user_agent TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Email confirmations table
        db.run(`
          CREATE TABLE IF NOT EXISTS email_confirmations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            confirmation_code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME NULL,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Survey steps table (for admin-controlled steps)
        db.run(`
          CREATE TABLE IF NOT EXISTS survey_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            step_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            config TEXT NOT NULL,
            is_admin_only BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Global sections table (stores intro and outro sections shared across all surveys)
        db.run(`
          CREATE TABLE IF NOT EXISTS global_sections (
            id INTEGER PRIMARY KEY,
            intro_section TEXT,
            outro_section TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create default admin user if it doesn't exist
        const adminPassword = await bcrypt.hash('admin123', 10);
        db.run(`
          INSERT OR IGNORE INTO users (username, email, password_hash, role)
          VALUES (?, ?, ?, ?)
        `, ['admin', 'simkova54321@gmail.com', adminPassword, 'admin']);

        // Create default survey steps (based on project plan)
        db.run(`
          INSERT OR IGNORE INTO survey_steps (step_number, name, description, config, is_admin_only)
          VALUES 
            (-1, 'Floating Icon', 'Floating action button with close option', '{"type": "floating", "closeable": true}', 1),
            (0, 'Initial Choice', 'Choice between feedback or problem reporting', '{"type": "choice", "options": ["Zpětná vazba na web", "Máte problém?"]}', 1),
            (1, 'Survey Form', 'Main survey form', '{"type": "survey"}', 1),
            (2, 'User Content', 'User-customizable content', '{"type": "user_content"}', 0),
            (3, 'Thank You', 'Thank you message', '{"type": "thankyou"}', 1)
        `);

        console.log('Database tables created successfully');
        resolve();
      } catch (error) {
        console.error('Error initializing database:', error);
        reject(error);
      }
    });
  });
};

const getDatabase = () => db;

module.exports = {
  initializeDatabase,
  getDatabase
}; 