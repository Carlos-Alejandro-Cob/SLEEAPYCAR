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

module.exports = router;