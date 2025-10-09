// controllers/authController.js
const passport = require('passport');

// Muestra el formulario de login
exports.showLoginForm = (req, res) => {
    res.render('auth/login', { title: 'Iniciar Sesión' });
};

// Procesa el formulario de login
exports.login = passport.authenticate('local', {
    successRedirect: '/admin/envios',
    failureRedirect: '/auth/login',
    failureFlash: true // Habilita los mensajes flash de error de Passport
});

// Cierra la sesión del usuario
exports.logout = (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'Has cerrado sesión correctamente.');
        res.redirect('/auth/login');
    });
};