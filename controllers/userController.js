// controllers/userController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');


// Listar todos los usuarios
exports.listUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT U.id_usuario, U.nombre_completo, U.nombre_usuario, U.email, R.nombre_rol FROM usuarios U JOIN roles R ON U.id_rol_fk = R.id_rol');
        res.render('admin/userList', { users: rows, title: 'Gestión de Usuarios' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los usuarios');
    }
};

// Mostrar formulario para crear un nuevo usuario
exports.showCreateUserForm = (req, res) => {
    res.render('admin/userForm', {
        isEdit: false,
        user: null,
        title: 'Nuevo Usuario'
    });
};

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
    const { nombre_completo, email, nombre_usuario, password, id_rol_fk } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        await pool.query('INSERT INTO usuarios (nombre_completo, email, nombre_usuario, password_hash, id_rol_fk) VALUES (?, ?, ?, ?, ?)', [nombre_completo, email, nombre_usuario, password_hash, id_rol_fk]);
        req.flash('success_msg', 'Usuario creado con éxito');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al crear el usuario');
        res.redirect('/admin/users');
    }
};

// Mostrar formulario para editar un usuario
exports.showEditUserForm = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.render('admin/userForm', {
            isEdit: true,
            user: user,
            title: 'Editar Usuario'
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al obtener el usuario');
        res.redirect('/admin/users');
    }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
    const { nombre_completo, email, nombre_usuario, password, id_rol_fk } = req.body;
    const { id } = req.params;
    try {
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            await pool.query('UPDATE usuarios SET nombre_completo = ?, email = ?, nombre_usuario = ?, password_hash = ?, id_rol_fk = ? WHERE id_usuario = ?', [nombre_completo, email, nombre_usuario, password_hash, id_rol_fk, id]);
        } else {
            await pool.query('UPDATE usuarios SET nombre_completo = ?, email = ?, nombre_usuario = ?, id_rol_fk = ? WHERE id_usuario = ?', [nombre_completo, email, nombre_usuario, id_rol_fk, id]);
        }
        req.flash('success_msg', 'Usuario actualizado con éxito');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al actualizar el usuario');
        res.redirect('/admin/users');
    }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
    try {
        const idUsuarioEliminar = req.params.id;
        // Obtener datos del usuario antes de borrar para el log
        const usuario = await User.findById(idUsuarioEliminar);

        await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [idUsuarioEliminar]);

        // Log
        await logger.logAction(req.user.id_usuario, 'DELETE_USER', `Usuario eliminado: ${usuario ? usuario.nombre_usuario : idUsuarioEliminar}`);

        req.flash('success_msg', 'Usuario eliminado con éxito');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al eliminar el usuario');
        res.redirect('/admin/users');
    }
};
