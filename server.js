const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const app = express();
const port = 3000;
const db = new Database('users.db');

// Fonction pour hasher le mot de passe
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Fonction pour vérifier le mot de passe
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'votre-clef-secrete',
  resave: false,
  saveUninitialized: true
}));

// Middleware d'authentification
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Servir les fichiers statiques
app.use('/uploads', requireAuth, (req, res, next) => {
  const user = db.prepare('SELECT directory FROM users WHERE id = ?').get(req.session.userId);
  const requestedPath = req.path;
  const userDir = path.basename(user.directory);
  
  if (requestedPath.startsWith('/' + userDir)) {
    next();
  } else {
    res.status(403).send('Accès non autorisé');
  }
}, express.static('uploads'));

// Page de connexion
app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connexion</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
      <div class="min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 class="text-2xl font-bold mb-6 text-center">Connexion</h1>
          <form method="POST" action="/login">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                Identifiant
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                     type="text" name="username" required>
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                Mot de passe
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                     type="password" name="password" required>
            </div>
            <div class="flex items-center justify-between">
              <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit">
                Se connecter
              </button>
              <a href="/register" class="text-blue-500 hover:text-blue-700">
                Créer un compte
              </a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Page d'inscription
app.get('/register', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inscription</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
      <div class="min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 class="text-2xl font-bold mb-6 text-center">Créer un compte</h1>
          <form method="POST" action="/register">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                Identifiant
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                     type="text" name="username" required>
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                Mot de passe
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                     type="password" name="password" required>
            </div>
            <div class="flex items-center justify-between">
              <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit">
                S'inscrire
              </button>
              <a href="/login" class="text-blue-500 hover:text-blue-700">
                Déjà inscrit ?
              </a>
            </div>
          </form>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Gestion de l'inscription
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  try {
    const hashedPassword = hashPassword(password);
    const userDir = `uploads/${username}`;
    
    // Créer le répertoire utilisateur
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Insérer l'utilisateur dans la base de données
    db.prepare('INSERT INTO users (username, password, directory) VALUES (?, ?, ?)').run(username, hashedPassword, userDir);
    
    res.redirect('/login');
  } catch (error) {
    res.status(400).send('Erreur lors de l\'inscription');
  }
});

// Gestion de la connexion
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (user && verifyPassword(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

// Page principale
app.get('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  const userDir = user.directory;
  
  let files = [];
  try {
    files = fs.readdirSync(userDir).map(file => ({
      name: file,
      path: `/uploads/${user.username}/${file}`
    }));
  } catch (err) {
    console.error('Erreur lors de la lecture du répertoire:', err);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mes Fichiers</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
      <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold">Mes Fichiers</h1>
          <a href="/logout" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Déconnexion
          </a>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="grid gap-4">
            ${files.map(file => `
              <div class="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                <span class="text-lg">${file.name}</span>
                <a href="${file.path}" 
                   class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                   download>
                  Télécharger
                </a>
              </div>
            `).join('')}
            ${files.length === 0 ? '<p class="text-gray-500 text-center">Aucun fichier disponible</p>' : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});