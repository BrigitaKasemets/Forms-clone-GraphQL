import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, '..', 'forms.db');

console.log('Initializing database...');
console.log(`Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// SQL statements for creating tables with camelCase column names
const createTables = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    passwordUpdated BOOLEAN DEFAULT FALSE
  )`,

  // Forms table
  `CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  )`,

  // Questions table
  `CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formId INTEGER NOT NULL,
    questionText TEXT NOT NULL,
    questionType TEXT NOT NULL CHECK (questionType IN ('shorttext', 'paragraph', 'multiplechoice', 'checkbox', 'dropdown')),
    required BOOLEAN DEFAULT FALSE,
    options TEXT, -- JSON string for multiple choice options
    questionOrder INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formId) REFERENCES forms (id) ON DELETE CASCADE
  )`,

  // Responses table
  `CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formId INTEGER NOT NULL,
    respondentName TEXT,
    respondentEmail TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formId) REFERENCES forms (id) ON DELETE CASCADE
  )`,

  // Answer values table
  `CREATE TABLE IF NOT EXISTS answer_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    responseId INTEGER NOT NULL,
    questionId INTEGER NOT NULL,
    formId INTEGER NOT NULL,
    answerText TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (responseId) REFERENCES responses (id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES questions (id) ON DELETE CASCADE,
    FOREIGN KEY (formId) REFERENCES forms (id) ON DELETE CASCADE
  )`
];

// Indexes for better performance
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)',
  'CREATE INDEX IF NOT EXISTS idx_forms_userId ON forms (userId)',
  'CREATE INDEX IF NOT EXISTS idx_questions_formId ON questions (formId)',
  'CREATE INDEX IF NOT EXISTS idx_questions_order ON questions (formId, questionOrder)',
  'CREATE INDEX IF NOT EXISTS idx_responses_formId ON responses (formId)',
  'CREATE INDEX IF NOT EXISTS idx_answer_values_responseId ON answer_values (responseId)',
  'CREATE INDEX IF NOT EXISTS idx_answer_values_questionId ON answer_values (questionId)'
];

// Triggers for updating timestamps
const createTriggers = [
  `CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
   AFTER UPDATE ON users 
   BEGIN 
     UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,

  `CREATE TRIGGER IF NOT EXISTS update_forms_timestamp 
   AFTER UPDATE ON forms 
   BEGIN 
     UPDATE forms SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,

  `CREATE TRIGGER IF NOT EXISTS update_questions_timestamp 
   AFTER UPDATE ON questions 
   BEGIN 
     UPDATE questions SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,

  `CREATE TRIGGER IF NOT EXISTS update_responses_timestamp 
   AFTER UPDATE ON responses 
   BEGIN 
     UPDATE responses SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`
];

async function initializeDatabase() {
  try {
    // Create tables
    console.log('Creating tables...');
    for (const sql of createTables) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('✅ Tables created successfully');

    // Create indexes
    console.log('Creating indexes...');
    for (const sql of createIndexes) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('✅ Indexes created successfully');

    // Create triggers
    console.log('⚡ Creating triggers...');
    for (const sql of createTriggers) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('✅ Triggers created successfully');

    console.log('Database initialization completed!');
    console.log('');
    console.log('Database schema summary:');
    console.log('   • users - User accounts and authentication');
    console.log('   • forms - Form definitions');
    console.log('   • questions - Form questions with types and options');
    console.log('   • responses - User responses to forms');
    console.log('   • answer_values - Individual answers to questions');
    console.log('');
    console.log('You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

initializeDatabase();
