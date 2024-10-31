const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

async function initDb() {
  // Création des répertoires nécessaires
  const dirs = ['data', 'uploads'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Suppression de l'ancienne base de données si elle existe
  const dbPath = path.join(__dirname, '../../data/users.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        reject(err);
        return;
      }

      console.log('Connexion à la base de données établie');

      // Création de la table users
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          directory TEXT UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          firstName TEXT,
          lastName TEXT,
          email TEXT,
          phone TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table:', err);
          reject(err);
          return;
        }

        // Création du compte admin
        const adminPassword = 'admin123';
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(adminPassword, salt, 1000, 64, 'sha512').toString('hex');
        const hashedPassword = `${salt}:${hash}`;
        const adminDir = path.join(__dirname, '../../uploads/admin');

        if (!fs.existsSync(adminDir)) {
          fs.mkdirSync(adminDir, { recursive: true });
        }

        db.run(`
          INSERT OR IGNORE INTO users (username, password, directory, is_active, is_admin)
          VALUES (?, ?, ?, 1, 1)
        `, ['admin', hashedPassword, adminDir], (err) => {
          if (err) {
            console.error('Erreur lors de la création du compte admin:', err);
            reject(err);
            return;
          }

          console.log('Compte admin créé avec succès (username: admin, password: admin123)');

          // Création d'un utilisateur test
          const userPassword = 'user123';
          const userSalt = crypto.randomBytes(16).toString('hex');
          const userHash = crypto.pbkdf2Sync(userPassword, userSalt, 1000, 64, 'sha512').toString('hex');
          const userHashedPassword = `${userSalt}:${userHash}`;
          const userDir = path.join(__dirname, '../../uploads/user');

          if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
          }

          db.run(`
            INSERT OR IGNORE INTO users (username, password, directory, is_active, is_admin)
            VALUES (?, ?, ?, 1, 0)
          `, ['user', userHashedPassword, userDir], (err) => {
            if (err) {
              console.error('Erreur lors de la création du compte utilisateur:', err);
              reject(err);
            } else {
              console.log('Compte utilisateur créé avec succès (username: user, password: user123)');
              resolve();
            }
            db.close();
          });
        });
      });
    });
  });
}

module.exports = initDb;