function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  const User = require('../models/user');
  User.findById(req.session.userId)
    .then(user => {
      if (!user || !user.is_active) {
        req.session.destroy();
        return res.redirect('/login');
      }
      req.user = user;
      // Rendre l'utilisateur disponible pour toutes les vues
      res.locals.user = user;
      next();
    })
    .catch(() => res.redirect('/login'));
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).render('error', { 
      error: 'Accès non autorisé',
      user: req.user 
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };