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
                    // Clientes van al catálogo
                    return res.redirect('/catalogo');
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

// Muestra el perfil del usuario
exports.showProfile = (req, res) => {
    res.render('auth/profile', {
        title: 'Mi Perfil',
        user: req.user
    });
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.id_usuario;

    try {
        if (new_password !== confirm_password) {
            req.flash('error_msg', 'Las contraseñas nuevas no coinciden.');
            return res.redirect('/auth/profile');
        }

        // Obtener el usuario con el hash de la contraseña para verificar
        const userFull = await require('../models/User').findByUsername(req.user.nombre_usuario);

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(current_password, userFull.password_hash);
        if (!isMatch) {
            req.flash('error_msg', 'La contraseña actual es incorrecta.');
            return res.redirect('/auth/profile');
        }

        // Hash nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        // Actualizar contraseña (usando User.update)
        // Nota: User.update espera un objeto con los campos a actualizar.
        // Mantenemos los otros campos iguales.
        await require('../models/User').update(userId, {
            nombre_completo: req.user.nombre_completo,
            email: req.user.email,
            nombre_usuario: req.user.nombre_usuario,
            id_rol_fk: req.user.id_rol_fk,
            password_hash: password_hash
        });

        req.flash('success_msg', 'Contraseña actualizada correctamente.');
        res.redirect('/auth/profile');

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        req.flash('error_msg', 'Error al cambiar la contraseña.');
        res.redirect('/auth/profile');
    }
};

// Eliminar cuenta propia
exports.deleteAccount = async (req, res) => {
    const userId = req.user.id_usuario;
    try {
        await require('../models/User').delete(userId);

        req.logout(function (err) {
            if (err) { return next(err); }
            req.flash('success_msg', 'Tu cuenta ha sido eliminada correctamente.');
            res.redirect('/auth/login');
        });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        if (error.code === 'ER_FK_CONSTRAINT') {
            // Mensaje amigable si no se puede borrar por datos asociados
            req.flash('error_msg', 'No se puede eliminar tu cuenta porque tienes registros activos (envíos, historial, etc.). Contacta a soporte.');
        } else {
            req.flash('error_msg', 'Error al eliminar la cuenta.');
        }
        res.redirect('/auth/profile');
    }
};
