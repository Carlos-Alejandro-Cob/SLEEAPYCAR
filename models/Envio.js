// models/Envio.js
const pool = require('../config/db');
const { queryWithRetry } = require('../utils/dbQuery');

class Envio {

    // 1. Listar y Filtrar (CRUD Read)
    static async findAll({ q, estado }) {
        let query = 'SELECT id_envio as _id, codigo_envio as ID_Envio, nombre_destinatario as Nombre_Destinatario, direccion_completa as Direccion_Completa, estado_envio as Estado_Envio, metodo_pago, fecha_entrega, precio, estado_pago, NULL as URL_Foto_Entrega FROM envios WHERE 1=1';
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

        const [rows] = await queryWithRetry(query, params);
        return rows;
    }

    // 2. Encontrar por ID
    static async findById(id) {
        const query = `
            SELECT 
                e.id_envio as _id, 
                e.codigo_envio as ID_Envio, 
                e.nombre_destinatario as Nombre_Destinatario, 
                e.direccion_completa as Direccion_Completa, 
                e.estado_envio as Estado_Envio, 
                e.metodo_pago, 
                e.precio, 
                e.estado_pago, 
                de.id_producto_fk,
                NULL as URL_Foto_Entrega 
            FROM envios e
            LEFT JOIN detalle_envio de ON e.id_envio = de.id_envio_fk
            WHERE e.id_envio = ?
        `;
        const [rows] = await queryWithRetry(query, [id]);
        return rows[0]; // Devuelve el primer resultado o undefined
    }

    // 3. Crear un nuevo envío (CRUD Create)
    static async create(data) {
        const {
            codigo_envio,
            nombre_destinatario,
            direccion_completa,
            estado_envio,
            metodo_pago,
            precio,
            estado_pago,
            id_producto_fk // Se recibe el ID del producto
        } = data;

        // Validación para asegurar que el producto no sea nulo
        if (!id_producto_fk) {
            throw new Error('El ID del producto (id_producto_fk) es obligatorio para crear el detalle del envío.');
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const queryEnvio = `
                INSERT INTO envios (codigo_envio, nombre_destinatario, direccion_completa, estado_envio, metodo_pago, precio, estado_pago, fecha_salida)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const [result] = await connection.query(queryEnvio, [codigo_envio, nombre_destinatario, direccion_completa, estado_envio, metodo_pago, precio || 0, estado_pago || 'Pendiente']);

            // Se usa el id_producto_fk en la inserción
            await connection.query('INSERT INTO detalle_envio (id_envio_fk, id_producto_fk) VALUES (?, ?)', [result.insertId, id_producto_fk]);

            await connection.commit();
            return { id: result.insertId, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 4. Actualizar un envío (CRUD Update)
    static async update(id, data) {
        const {
            codigo_envio,
            nombre_destinatario,
            direccion_completa,
            estado_envio,
            metodo_pago,
            precio,
            estado_pago
        } = data;

        const query = `
            UPDATE envios 
            SET codigo_envio = ?, nombre_destinatario = ?, direccion_completa = ?, estado_envio = ?, metodo_pago = ?, precio = ?, estado_pago = ?
            WHERE id_envio = ?
        `;

        const [result] = await queryWithRetry(query, [codigo_envio, nombre_destinatario, direccion_completa, estado_envio, metodo_pago, precio, estado_pago, id]);
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
                // Usamos IN (??) para que mysql2 expanda correctamente el array de IDs.
                // Para una lista de valores, se debe usar un solo '?' y pasar los valores como un array dentro de otro array.
                // El uso de '??' es para identificadores (nombres de tabla/columna) y causa el error 'Unknown column'.
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
    // 6. Obtener ID de detalle por Código de Envío
    static async findDetailIdByCodigo(codigo) {
        const query = `
            SELECT de.id_detalle 
            FROM envios e 
            JOIN detalle_envio de ON e.id_envio = de.id_envio_fk 
            WHERE e.codigo_envio = ? 
            LIMIT 1
        `;
        const [rows] = await queryWithRetry(query, [codigo]);
        return rows[0] ? rows[0].id_detalle : null;
    }
}

module.exports = Envio;