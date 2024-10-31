const User = require('../models/user');

exports.home = (req, res) => {
  res.render('home', { user: req.user });
};

exports.contact = (req, res) => {
  res.render('contact', { user: req.user });
};

exports.showLogin = (req, res) => {
  if (req.session.userId) {
    res.redirect('/files');
  } else {
    res.render('auth/login', { error: null, user: null });
  }
};

exports.showRegister = (req, res) => {
  if (req.session.userId) {
    res.redirect('/files');
  } else {
    res.render('auth/register', { error: null, user: null });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.authenticate(username, password);
    if (user) {
      req.session.userId = user.id;
      res.redirect('/files');
    } else {
      res.render('auth/login', { error: 'Identifiants incorrects', user: null });
    }
  } catch (error) {
    console.error('Erreur login:', error);
    res.render('auth/login', { error: 'Une erreur est survenue', user: null });
  }
};

exports.register = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.render('auth/register', { error: 'Tous les champs sont requis', user: null });
  }

  try {
    await User.create(username, password);
    res.redirect('/login');
  } catch (error) {
    console.error('Erreur register:', error);
    res.render('auth/register', { error: error.message, user: null });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};