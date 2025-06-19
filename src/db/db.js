import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - use the same database as REST API
const dbPath = path.join(__dirname, '../../REST-api/forms.db');

let db;

// Initialize database connection
export const initDb = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
      } else {
        console.log('✅ Connected to SQLite database');
        resolve(db);
      }
    });
  });
};

// Close database connection
export const closeDb = () => {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Generic database helper
export const withDb = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// User database operations
export const userDb = {
  async createUser(email, password, name) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (email, password, name, createdAt, updatedAt)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    return new Promise((resolve, reject) => {
      db.run(query, [email, hashedPassword, name], function(err) {
        if (err) {
          reject(err);
        } else {
          // Get the created user
          db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  },

  async getAllUsers() {
    const query = 'SELECT id, email, name, createdAt, updatedAt FROM users ORDER BY createdAt DESC';
    return withDb(query);
  },

  async getUserById(id) {
    const query = 'SELECT id, email, name, createdAt, updatedAt FROM users WHERE id = ?';
    const rows = await withDb(query, [id]);
    if (rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return rows[0];
  },

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const rows = await withDb(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  async updateUser(id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    fields.push('updatedAt = datetime(\'now\')');
    values.push(id);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error(`User with id ${id} not found`));
        } else {
          // Return updated user
          userDb.getUserById(id).then(resolve).catch(reject);
        }
      });
    });
  },

  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error(`User with id ${id} not found`));
        } else {
          resolve({ success: true });
        }
      });
    });
  },

  async validatePassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      return { id: user.id, email: user.email, name: user.name };
    }
    return null;
  }
};

// Form database operations
export const formDb = {
  async createForm(userId, title, description = null) {
    const query = `
      INSERT INTO forms (userId, title, description, createdAt, updatedAt)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    return new Promise((resolve, reject) => {
      db.run(query, [userId, title, description], function(err) {
        if (err) {
          reject(err);
        } else {
          db.get('SELECT * FROM forms WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  },

  async getAllForms(userId = null, filter = {}) {
    let query = 'SELECT * FROM forms';
    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push('userId = ?');
      params.push(userId);
    }

    if (filter.title) {
      conditions.push('title LIKE ?');
      params.push(`%${filter.title}%`);
    }

    if (filter.createdAfter) {
      conditions.push('createdAt >= ?');
      params.push(filter.createdAfter);
    }

    if (filter.createdBefore) {
      conditions.push('createdAt <= ?');
      params.push(filter.createdBefore);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY createdAt DESC';
    
    return withDb(query, params);
  },

  async getFormById(id) {
    const query = 'SELECT * FROM forms WHERE id = ?';
    const rows = await withDb(query, [id]);
    if (rows.length === 0) {
      throw new Error(`Form with id ${id} not found`);
    }
    return rows[0];
  },

  async updateForm(id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    
    fields.push('updatedAt = datetime(\'now\')');
    values.push(id);
    
    const query = `UPDATE forms SET ${fields.join(', ')} WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error(`Form with id ${id} not found`));
        } else {
          formDb.getFormById(id).then(resolve).catch(reject);
        }
      });
    });
  },

  async deleteForm(id) {
    const query = 'DELETE FROM forms WHERE id = ?';
    return new Promise((resolve, reject) => {
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error(`Form with id ${id} not found`));
        } else {
          resolve({ success: true });
        }
      });
    });
  }
};

// Initialize database when module is loaded
if (!db) {
  initDb().catch(console.error);
}
