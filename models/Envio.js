// models/Envio.js
const pool = require('../config/db');

class Envio {

    // 1. Listar y Filtrar (CRUD Read)
    static async findAll({ q, estado }) {
        let query = 'SELECT id_envio as _id, codigo_envio as ID_Envio, nombre_destinatario as Nombre_Destinatario, direccion_completa as Direccion_Completa, estado_envio as Estado_Envio, fecha_entrega, url_foto_evidencia as URL_Foto_Entrega FROM envios_view WHERE 1=1';
        const params = [];

        if (q) {
            query += ' AND (nombre_destinatario LIKE ? OR codigo_envio LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }
        if (estado) {
            query += ' AND estado_envio = ?';
            params.push(estado);
        }
        
        query += ' ORDER BY fecha_salida DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // 2. Encontrar por ID
    static async findById(id) {
        const query = 'SELECT id_envio as _id, codigo_envio as ID_Envio, nombre_destinatario as Nombre_Destinatario, direccion_completa as Direccion_Completa, estado_envio as Estado_Envio, url_foto_evidencia as URL_Foto_Entrega FROM envios_view WHERE id_envio = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0]; // Devuelve el primer resultado o undefined
    }

    // 3. Crear un nuevo envío (CRUD Create)
    static async create(data) {
        const {
            codigo_envio,
            nombre_destinatario,
            direccion_completa,
            estado_envio
        } = data;

        const query = `
            INSERT INTO envios (codigo_envio, nombre_destinatario, direccion_completa, estado_envio, fecha_salida)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [codigo_envio, nombre_destinatario, direccion_completa, estado_envio]);
        
        // Devolvemos el objeto creado con su nuevo ID
        return { id: result.insertId, ...data };
    }

    // 4. Actualizar un envío (CRUD Update)
    static async update(id, data) {
        const {
            codigo_envio,
            nombre_destinatario,
            direccion_completa,
            estado_envio
        } = data;

        const query = `
            UPDATE envios 
            SET codigo_envio = ?, nombre_destinatario = ?, direccion_completa = ?, estado_envio = ?
            WHERE id_envio = ?
        `;

        const [result] = await pool.query(query, [codigo_envio, nombre_destinatario, direccion_completa, estado_envio, id]);
        return result.affectedRows; // Devuelve 1 si fue exitoso, 0 si no
    }

    // 5. Eliminar un envío (CRUD Delete)
    static async remove(id) {
        // Usamos una transacción para asegurar la integridad de los datos durante el borrado en cascada.
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Obtener los IDs de los detalles de envío asociados al envío principal.
            const [detalles] = await connection.query('SELECT id_detalle FROM detalle_envio WHERE id_envio_fk = ?', [id]);
            const detalleIds = detalles.map(d => d.id_detalle);

            if (detalleIds.length > 0) {
                // 2. Eliminar las incidencias que dependen de los detalles del envío.
                await connection.query('DELETE FROM incidencias WHERE id_detalle_envio_fk IN (?)', [detalleIds]);
            }

            // 3. Desvincular movimientos asociados al envío (si los hay).
            await connection.query("UPDATE movimientos SET id_referencia_externa = NULL WHERE tipo = 'CARGA_ENVIO' AND id_referencia_externa = ?", [id]);

            // 4. Eliminar los detalles del envío.
            await connection.query('DELETE FROM detalle_envio WHERE id_envio_fk = ?', [id]);
            
            // 5. Finalmente, eliminar el envío principal.
            const [result] = await connection.query('DELETE FROM envios WHERE id_envio = ?', [id]);

            await connection.commit(); // Si todo fue bien, confirma los cambios.
            return result.affectedRows;
        } catch (error) {
            await connection.rollback(); // Si algo falla, revierte todos los cambios.
            throw error; // Propaga el error para que el controlador lo capture.
        } finally {
            connection.release(); // Libera la conexión de vuelta al pool.
        }
    }
}

// VISTA SQL RECOMENDADA:
// Para simplificar las consultas y unir la foto del envío, puedes crear esta vista en tu BD.
/*
CREATE OR REPLACE VIEW envios_view AS
SELECT 
    e.*,
    (SELECT i.url_foto_evidencia FROM detalle_envio de JOIN incidencias i ON de.id_detalle = i.id_detalle_envio_fk WHERE de.id_envio_fk = e.id_envio AND i.tipo_incidencia = 'ENTREGA_OK' ORDER BY i.fecha_reporte DESC LIMIT 1) as url_foto_evidencia
FROM envios e;
*/

module.exports = Envio;