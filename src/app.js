const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'votre-clef-secrete',
  resave: false,
  saveUninitialized: true
}));

// Middleware pour rendre l'utilisateur disponible globalement
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const User = require('./models/user');
      const user = await User.findById(req.session.userId);
      res.locals.user = user;
      req.user = user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    }
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/files', fileRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    error: 'Une erreur est survenue',
    user: req.user
  });
});

// Initialisation de la base de données
const initDb = require('./database/init-db');

// Démarrage du serveur après l'initialisation de la base de données
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Serveur démarré sur http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
    process.exit(1);
  });