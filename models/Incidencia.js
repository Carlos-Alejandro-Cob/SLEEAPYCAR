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
        const query = `
            SELECT i.*, e.codigo_envio, u.nombre_completo
            FROM incidencias i
            LEFT JOIN detalle_envio de ON i.id_detalle_envio_fk = de.id_detalle
            LEFT JOIN envios e ON de.id_envio_fk = e.id_envio
            LEFT JOIN usuarios u ON i.id_usuario_reporta_fk = u.id_usuario
            ORDER BY i.fecha_reporte DESC
        `;
        const [rows] = await queryWithRetry(query);
        return rows;
    }

    static async findById(id) {
        const query = `
            SELECT i.*, e.codigo_envio 
            FROM incidencias i
            LEFT JOIN detalle_envio de ON i.id_detalle_envio_fk = de.id_detalle
            LEFT JOIN envios e ON de.id_envio_fk = e.id_envio
            WHERE i.id_incidencia = ?
        `;
        const [rows] = await queryWithRetry(query, [id]);
        return rows[0];
    }

    static async update(id, incidenciaData) {
        const { id_detalle_envio_fk, id_usuario_reporta_fk, tipo_incidencia, observaciones, url_foto_evidencia } = incidenciaData;
        let query = `
            UPDATE incidencias SET
                id_detalle_envio_fk = ?,
                id_usuario_reporta_fk = ?,
                tipo_incidencia = ?,
                observaciones = ?
        `;
        const params = [id_detalle_envio_fk, id_usuario_reporta_fk, tipo_incidencia, observaciones];

        if (url_foto_evidencia) {
            query += `, url_foto_evidencia = ?`;
            params.push(url_foto_evidencia);
        }

        query += ` WHERE id_incidencia = ?`;
        params.push(id);

        const [result] = await queryWithRetry(query, params);
        return result;
    }

    static async delete(id) {
        const query = `DELETE FROM incidencias WHERE id_incidencia = ?`;
        const [result] = await queryWithRetry(query, [id]);
        return result.affectedRows;
    }
}

module.exports = Incidencia;
