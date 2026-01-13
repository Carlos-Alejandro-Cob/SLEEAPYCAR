// models/User.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { queryWithRetry } = require('../utils/dbQuery');

class User {
    // Encontrar un usuario por su nombre de usuario
    static async findByUsername(username) {
        const query = 'SELECT id_usuario, nombre_completo, nombre_usuario, password_hash, id_rol_fk FROM usuarios WHERE nombre_usuario = ? AND activo = TRUE';
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
}

module.exports = User;