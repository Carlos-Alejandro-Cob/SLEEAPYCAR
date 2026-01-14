// models/User.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { queryWithRetry } = require('../utils/dbQuery');

class User {
    // Encontrar un usuario por su nombre de usuario (case-insensitive)
    static async findByUsername(username) {
        // Buscar sin importar mayúsculas/minúsculas usando LOWER()
        const query = 'SELECT id_usuario, nombre_completo, nombre_usuario, password_hash, id_rol_fk FROM usuarios WHERE LOWER(nombre_usuario) = LOWER(?) AND activo = TRUE';
        const [rows] = await queryWithRetry(query, [username]);
        return rows[0];
    }

    // Encontrar un usuario por su ID
    static async findById(id) {
        const query = 'SELECT id_usuario, nombre_completo, nombre_usuario, email, id_rol_fk FROM usuarios WHERE id_usuario = ?';
        const [rows] = await queryWithRetry(query, [id]);
        return rows[0];
    }

    // Comparar la contraseña proporcionada con el hash almacenado
    static async comparePassword(candidatePassword, hash) {
        try {
            return await bcrypt.compare(candidatePassword, hash);
        } catch (error) {
            throw error;
        }
    }

    // Crear nuevo usuario
    static async create(userData) {
        const { nombre_completo, email, nombre_usuario, password_hash, id_rol_fk } = userData;
        const query = 'INSERT INTO usuarios (nombre_completo, email, nombre_usuario, password_hash, id_rol_fk) VALUES (?, ?, ?, ?, ?)';
        const [result] = await queryWithRetry(query, [nombre_completo, email, nombre_usuario, password_hash, id_rol_fk]);
        return result.insertId;
    }

    // Actualizar usuario
    static async update(id, userData) {
        let query = 'UPDATE usuarios SET nombre_completo = ?, email = ?, nombre_usuario = ?, id_rol_fk = ?';
        const params = [userData.nombre_completo, userData.email, userData.nombre_usuario, userData.id_rol_fk];

        if (userData.password_hash) {
            query += ', password_hash = ?';
            params.push(userData.password_hash);
        }

        query += ' WHERE id_usuario = ?';
        params.push(id);

        await queryWithRetry(query, params);
    }

    // Eliminar usuario con manejo de errores de FK
    static async delete(id) {
        try {
            const query = 'DELETE FROM usuarios WHERE id_usuario = ?';
            await queryWithRetry(query, [id]);
            return true;
        } catch (error) {
            // Verificar si es un error de integridad referencial (clave foránea)
            if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
                const newError = new Error('No se puede eliminar el usuario porque tiene registros asociados (envíos, auditoría, etc.).');
                newError.code = 'ER_FK_CONSTRAINT';
                throw newError;
            }
            throw error;
        }
    }
}

module.exports = User;