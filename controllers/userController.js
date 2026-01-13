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
        await User.create({ nombre_completo, email, nombre_usuario, password_hash, id_rol_fk });
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
        let password_hash = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            password_hash = await bcrypt.hash(password, salt);
        }

        await User.update(id, {
            nombre_completo,
            email,
            nombre_usuario,
            id_rol_fk,
            password_hash // Si es null, el modelo lo ignora
        });
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

        await User.delete(idUsuarioEliminar);

        // Log (solo si se eliminó correctamente)
        // Nota: Si el usuario ya no existe, 'usuario' será null o undefined, así que aseguramos el log
        const nombreUsuarioLog = usuario ? usuario.nombre_usuario : idUsuarioEliminar;

        // Es posible que queramos loguear ANTES de borrar si queremos asegurar que tenemos los datos, 
        // pero el requerimiento es borrar y luego loguear la acción.
        // Como ya tenemos el objeto 'usuario' cargado en memoria, podemos usarlo.

        try {
            // Intentamos loguear, aunque el usuario ID ya no exista en la tabla usuarios, 
            // la tabla audit_logs podría requerir el ID. Pero si se borró el usuario, la FK en audit_logs podría fallar si se inserta con ese ID.
            // Normalmente el log debe hacerse con el ID del usuario QUE EJECUTA la acción (req.user.id_usuario), no del eliminado.
            // El código original usaba req.user.id_usuario, lo cual es correcto.
            await logger.logAction(req.user.id_usuario, 'DELETE_USER', `Usuario eliminado: ${nombreUsuarioLog}`);
        } catch (logError) {
            console.error('Error al guardar log de eliminación:', logError);
        }

        req.flash('success_msg', 'Usuario eliminado con éxito');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_FK_CONSTRAINT') {
            req.flash('error_msg', error.message);
        } else {
            req.flash('error_msg', 'Error al eliminar el usuario');
        }
        res.redirect('/admin/users');
    }
};
