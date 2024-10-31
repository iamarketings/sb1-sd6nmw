function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Gestion des erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).render('error', {
      error: 'Données invalides',
      user: req.user
    });
  }

  // Gestion des erreurs de fichier
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('error', {
      error: 'Le fichier est trop volumineux',
      user: req.user
    });
  }

  // Gestion des erreurs d'authentification
  if (err.name === 'UnauthorizedError') {
    return res.status(401).render('error', {
      error: 'Non autorisé',
      user: req.user
    });
  }

  // Erreur par défaut
  res.status(500).render('error', {
    error: 'Une erreur est survenue',
    user: req.user
  });
}

module.exports = errorHandler;