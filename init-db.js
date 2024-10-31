const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Création des répertoires nécessaires
const dirs = ['data', 'uploads'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
});

// Création de la base de données
const db = new sqlite3.Database(path.join(__dirname, 'data/users.db'), (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
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
      process.exit(1);
    }

    // Création du compte admin
    const adminPassword = 'admin123';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(adminPassword, salt, 1000, 64, 'sha512').toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    const adminDir = path.join(__dirname, 'uploads/admin');

    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true });
    }

    db.run(`
      INSERT INTO users (username, password, directory, is_active, is_admin)
      VALUES (?, ?, ?, 1, 1)
    `, ['admin', hashedPassword, adminDir], (err) => {
      if (err) {
        console.error('Erreur lors de la création du compte admin:', err);
        process.exit(1);
      }

      console.log('Compte admin créé avec succès (username: admin, password: admin123)');

      // Création d'un utilisateur test
      const userPassword = 'user123';
      const userSalt = crypto.randomBytes(16).toString('hex');
      const userHash = crypto.pbkdf2Sync(userPassword, userSalt, 1000, 64, 'sha512').toString('hex');
      const userHashedPassword = `${userSalt}:${userHash}`;
      const userDir = path.join(__dirname, 'uploads/user');

      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      db.run(`
        INSERT INTO users (username, password, directory, is_active, is_admin)
        VALUES (?, ?, ?, 1, 0)
      `, ['user', userHashedPassword, userDir], (err) => {
        if (err) {
          console.error('Erreur lors de la création du compte utilisateur:', err);
          process.exit(1);
        }

        console.log('Compte utilisateur créé avec succès (username: user, password: user123)');
        console.log('Base de données initialisée avec succès!');
        db.close();
      });
    });
  });
});