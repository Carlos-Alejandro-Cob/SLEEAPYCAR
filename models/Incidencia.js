const { queryWithRetry } = require('../utils/dbQuery');

class Incidencia {
    static async create(incidenciaData) {
        const { id_detalle_envio_fk, id_usuario_reporta_fk, tipo_incidencia, observaciones, url_foto_evidencia } = incidenciaData;
        const query = `
            INSERT INTO incidencias (
                id_detalle_envio_fk,
                id_usuario_reporta_fk,
                tipo_incidencia,
                observaciones,
                url_foto_evidencia
            ) VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
            id_detalle_envio_fk,
            id_usuario_reporta_fk,
            tipo_incidencia,
            observaciones,
            url_foto_evidencia
        ];
        try {
            const [result] = await queryWithRetry(query, params);
            return result;
        } catch (error) {
            console.error('❌ Error en Incidencia.create:', error); // Log the error here
            throw error; // Re-throw the error for the controller to handle
        }
    }

    static async findAll() {
        const query = `SELECT * FROM incidencias`;
        const [rows] = await queryWithRetry(query);
        return rows;
    }

    // Puedes añadir más métodos aquí (findById, update, etc.) si son necesarios
}

module.exports = Incidencia;
