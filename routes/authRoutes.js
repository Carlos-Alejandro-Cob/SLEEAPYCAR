// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para mostrar el formulario de login
router.get('/login', authController.showLoginForm);

// Ruta para procesar el formulario de login
router.post('/login', authController.login);

// Ruta para mostrar el formulario de registro
router.get('/register', authController.showRegistrationForm);

// Ruta para procesar el formulario de registro
router.post('/register', authController.register);

// Ruta para cerrar sesión
router.get('/logout', authController.logout);

// Rutas de Perfil
router.get('/profile', isAuthenticated, authController.showProfile);
router.post('/profile/change-password', isAuthenticated, authController.changePassword);
router.post('/profile/delete', isAuthenticated, authController.deleteAccount);

module.exports = router;

// Middleware simple para asegurar que está logueado (si no existe uno global, lo definimos aquí o lo importamos)
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Por favor inicia sesión para ver tu perfil.');
    res.redirect('/auth/login');
}
