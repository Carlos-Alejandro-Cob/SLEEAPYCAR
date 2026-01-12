// controllers/authController.js
const passport = require('passport');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { queryWithRetry } = require('../utils/dbQuery');
const ROLES = require('../config/roles');

// Muestra el formulario de login
exports.showLoginForm = (req, res) => {
    res.render('auth/login', { title: 'Iniciar Sesión' });
};

// Muestra el formulario de registro
exports.showRegistrationForm = (req, res) => {
    res.render('auth/register', { title: 'Registro' });
};

// Procesa el formulario de registro
exports.register = async (req, res) => {
    const { nombre_completo, email, nombre_usuario, password } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();

        // Verificar si el usuario ya existe
        const [existingUsers] = await connection.query('SELECT id_usuario FROM usuarios WHERE nombre_usuario = ?', [nombre_usuario]);
        if (existingUsers.length > 0) {
            req.flash('error_msg', 'El nombre de usuario ya está en uso.');
            return res.redirect('/auth/register');
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insertar el usuario en la base de datos
        const query = 'INSERT INTO usuarios (nombre_completo, email, nombre_usuario, password_hash, id_rol_fk) VALUES (?, ?, ?, ?, ?)';
        await connection.query(query, [
            nombre_completo,
            email,
            nombre_usuario,
            password_hash,
            password_hash,
            ROLES.CLIENTE // id_rol_fk para Cliente
        ]);

        req.flash('success_msg', '¡Te has registrado correctamente! Ahora puedes iniciar sesión.');
        res.redirect('/auth/login');

    } catch (error) {
        console.error('Error en el registro:', error);
        req.flash('error_msg', 'Algo salió mal. Por favor, inténtalo de nuevo.');
        res.redirect('/auth/register');
    } finally {
        if (connection) connection.release();
    }
};


// Procesa el formulario de login
exports.login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error_msg', info.message);
            return res.redirect('/auth/login');
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            const role = user.id_rol_fk;

            switch (role) {
                case ROLES.REPARTIDOR:
                    return res.redirect('/admin/repartidor');
                case ROLES.ADMIN:
                case ROLES.BODEGUERO:
                case ROLES.SUPER_ADMIN:
                    return res.redirect('/admin/envios');
                default:
                    return res.redirect('/');
            }
        });
    })(req, res, next);
};

// Cierra la sesión del usuario
exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'Has cerrado sesión correctamente.');
        res.redirect('/auth/login');
    });
};