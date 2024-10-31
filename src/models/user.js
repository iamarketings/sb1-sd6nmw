const db = require('../config/database');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class User {
  static async create(username, password) {
    return new Promise((resolve, reject) => {
      // Vérification si l'utilisateur existe déjà
      db.get('SELECT id FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
          console.error('Erreur base de données:', err);
          return reject(new Error('Erreur de base de données'));
        }
        
        if (user) {
          return reject(new Error('Nom d\'utilisateur déjà pris'));
        }

        try {
          // Création du hash du mot de passe
          const salt = crypto.randomBytes(16).toString('hex');
          const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
          const hashedPassword = `${salt}:${hash}`;

          // Création du répertoire utilisateur
          const userDir = path.join(__dirname, '../../uploads', username);
          if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
          }

          // Insertion de l'utilisateur dans la base de données
          db.run(
            'INSERT INTO users (username, password, directory, is_active, is_admin) VALUES (?, ?, ?, 1, 0)',
            [username, hashedPassword, userDir],
            function(err) {
              if (err) {
                console.error('Erreur insertion utilisateur:', err);
                // Si une erreur survient, on supprime le répertoire créé
                if (fs.existsSync(userDir)) {
                  fs.rmdirSync(userDir, { recursive: true });
                }
                return reject(new Error('Erreur lors de la création de l\'utilisateur'));
              }
              resolve(this.lastID);
            }
          );
        } catch (error) {
          console.error('Erreur création utilisateur:', error);
          reject(new Error('Erreur lors de la création de l\'utilisateur'));
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });
  }

  static async authenticate(username, password) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, user) => {
        if (err) {
          console.error('Erreur authentification:', err);
          return reject(err);
        }
        
        if (user && this.verifyPassword(password, user.password)) {
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  }

  static hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  static verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  static async update(id, data) {
    const { firstName, lastName, email, phone } = data;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
        [firstName, lastName, email, phone, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  static async updatePassword(id, currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      db.get('SELECT password FROM users WHERE id = ?', [id], (err, user) => {
        if (err) return reject(err);
        if (!user) return reject(new Error('Utilisateur non trouvé'));

        if (!this.verifyPassword(currentPassword, user.password)) {
          return reject(new Error('Mot de passe actuel incorrect'));
        }

        const hashedPassword = this.hashPassword(newPassword);
        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, id],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    });
  }
}

module.exports = User;