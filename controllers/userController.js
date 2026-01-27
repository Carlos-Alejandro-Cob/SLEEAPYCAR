// controllers/userController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');


// Listar todos los usuarios
exports.listUsers = async (req, res) => {
    try {
        const { rol_filtro } = req.query;
        
        // Obtener solo los roles permitidos (1=Admin, 2=Bodeguero, 3=Repartidor, 4=Sucursal)
        const rolesPermitidos = [1, 2, 3, 4];
        // Consultar directamente solo los roles permitidos desde la base de datos
        const [roles] = await pool.query(
            'SELECT id_rol, nombre_rol FROM roles WHERE id_rol IN (?, ?, ?, ?) ORDER BY nombre_rol',
            rolesPermitidos
        );
        
        // Construir la consulta con filtro opcional
        let query = 'SELECT U.id_usuario, U.nombre_completo, U.nombre_usuario, U.email, U.id_rol_fk, R.nombre_rol FROM usuarios U JOIN roles R ON U.id_rol_fk = R.id_rol';
        const params = [];
        
        // Solo mostrar usuarios con roles permitidos
        query += ' WHERE U.id_rol_fk IN (1, 2, 3, 4)';
        
        if (rol_filtro && rol_filtro !== 'todos') {
            const rolFiltroInt = parseInt(rol_filtro);
            if (rolesPermitidos.includes(rolFiltroInt)) {
                query += ' AND U.id_rol_fk = ?';
                params.push(rolFiltroInt);
            }
        }
        
        query += ' ORDER BY U.id_usuario ASC';
        
        const [rows] = await pool.query(query, params);
        
        res.render('admin/userList', { 
            users: rows, 
            roles: roles,
            rolFiltro: rol_filtro || 'todos',
            title: 'Gestión de Usuarios' 
        });
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
    const { nombre_completo, email, nombre_usuario, password, id_rol_fk, direccion } = req.body;
    
    // Validar campos según el rol
    const ROLES = require('../config/roles');
    const idRol = parseInt(id_rol_fk);
    
    // Validar que el rol esté permitido (solo 1=Admin, 2=Bodeguero, 3=Repartidor, 4=Sucursal)
    const rolesPermitidos = [1, 2, 3, 4];
    if (!rolesPermitidos.includes(idRol)) {
        req.flash('error_msg', 'El rol seleccionado no está permitido.');
        return res.redirect('/admin/users/nuevo');
    }
    
    // Rol 4 = Sucursal: requiere email y dirección
    // Rol 2 = Bodeguero, Rol 3 = Repartidor: solo nombre y contraseña (email opcional)
    
    if (idRol === 4) { // Sucursal
        if (!email || !email.trim()) {
            req.flash('error_msg', 'El correo es obligatorio para sucursales.');
            return res.redirect('/admin/users/nuevo');
        }
        if (!direccion || !direccion.trim()) {
            req.flash('error_msg', 'La dirección es obligatoria para sucursales.');
            return res.redirect('/admin/users/nuevo');
        }
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        await User.create({ 
            nombre_completo, 
            email: email && email.trim() ? email.trim() : null, 
            nombre_usuario, 
            password_hash, 
            id_rol_fk,
            direccion: direccion && direccion.trim() ? direccion.trim() : null
        });
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
    const { nombre_completo, email, nombre_usuario, password, id_rol_fk, direccion } = req.body;
    const { id } = req.params;
    
    // Validar campos según el rol
    const idRol = parseInt(id_rol_fk);
    
    // Validar que el rol esté permitido (solo 1=Admin, 2=Bodeguero, 3=Repartidor, 4=Sucursal)
    const rolesPermitidos = [1, 2, 3, 4];
    if (!rolesPermitidos.includes(idRol)) {
        req.flash('error_msg', 'El rol seleccionado no está permitido.');
        return res.redirect(`/admin/users/${id}/editar`);
    }
    
    if (idRol === 4) { // Sucursal
        if (!email || !email.trim()) {
            req.flash('error_msg', 'El correo es obligatorio para sucursales.');
            return res.redirect(`/admin/users/${id}/editar`);
        }
        if (!direccion || !direccion.trim()) {
            req.flash('error_msg', 'La dirección es obligatoria para sucursales.');
            return res.redirect(`/admin/users/${id}/editar`);
        }
    }
    
    try {
        let password_hash = null;
        if (password && password.trim()) {
            const salt = await bcrypt.genSalt(10);
            password_hash = await bcrypt.hash(password, salt);
        }

        await User.update(id, {
            nombre_completo,
            email: email && email.trim() ? email.trim() : null,
            nombre_usuario,
            id_rol_fk,
            password_hash, // Si es null, el modelo lo ignora
            direccion: direccion && direccion.trim() ? direccion.trim() : null
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
