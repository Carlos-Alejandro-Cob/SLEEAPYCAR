// models/Envio.js
const pool = require('../config/db');
const { queryWithRetry } = require('../utils/dbQuery');

class Envio {

    // 1. Listar y Filtrar (CRUD Read)
    static async findAll({ q, estado, id_repartidor }) {
        let query = 'SELECT id_envio as _id, codigo_envio as ID_Envio, nombre_destinatario as Nombre_Destinatario, direccion_completa as Direccion_Completa, estado_envio as Estado_Envio, metodo_pago, fecha_entrega, precio, estado_pago, id_repartidor, NULL as URL_Foto_Entrega FROM envios WHERE 1=1';
        const params = [];

        if (q) {
            query += ' AND (nombre_destinatario LIKE ? OR codigo_envio LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }
        if (estado) {
            if (estado === 'NO_ENTREGADO') {
                query += ' AND estado_envio != ?';
                params.push('Entregado');
            } else {
                query += ' AND estado_envio = ?';
                params.push(estado);
            }
        }
        if (id_repartidor) {
            query += ' AND id_repartidor = ?';
            params.push(id_repartidor);
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
                NULL as URL_Foto_Entrega 
            FROM envios e
            WHERE e.id_envio = ?
        `;
        const [rows] = await queryWithRetry(query, [id]);
        if (!rows[0]) {
            return undefined;
        }
        const envio = rows[0];
        const [products] = await queryWithRetry('SELECT id_producto_fk, cantidad FROM envio_productos WHERE id_envio_fk = ?', [id]);
        envio.products = products;
        return envio; // Devuelve el primer resultado o undefined
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
            products
        } = data;

        // Validación para asegurar que el producto no sea nulo
        if (!products || !Array.isArray(products) || products.length === 0) {
            throw new Error('Debe agregar al menos un producto.');
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const queryEnvio = `
                INSERT INTO envios (codigo_envio, nombre_destinatario, direccion_completa, estado_envio, metodo_pago, precio, estado_pago, fecha_salida)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const [result] = await connection.query(queryEnvio, [codigo_envio, nombre_destinatario, direccion_completa, estado_envio, metodo_pago, precio || 0, estado_pago || 'Pendiente']);

            const idEnvio = result.insertId;

            const productQueries = products.map(p => {
                return connection.query('INSERT INTO envio_productos (id_envio_fk, id_producto_fk, cantidad) VALUES (?, ?, ?)', [idEnvio, p.id_producto, p.cantidad]);
            });

            await Promise.all(productQueries);

            await connection.commit();
            return { id: idEnvio, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // 4. Actualizar un envío (CRUD Update)
    static async update(id, data) {
        // Obtenemos los campos posibles, incluyendo id_repartidor si se pasa
        const {
            codigo_envio,
            nombre_destinatario,
            direccion_completa,
            estado_envio,
            metodo_pago,
            precio,
            estado_pago,
            id_repartidor, // Nuevo campo
            products
        } = data;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Construimos la query dinámicamente o incluimos todos los campos si están disponibles
            // Para simplificar, asumimos que si no viene en data, no se actualiza, o manejamos undefined.
            // Pero como es un UPDATE completo en muchos casos, vamos a usar una query fija extendida 
            // O mejor, una query dinámica simple para evitar nulls no deseados.

            // Query base
            let query = 'UPDATE envios SET ';
            const params = [];
            const updates = [];

            if (codigo_envio !== undefined) { updates.push('codigo_envio = ?'); params.push(codigo_envio); }
            if (nombre_destinatario !== undefined) { updates.push('nombre_destinatario = ?'); params.push(nombre_destinatario); }
            if (direccion_completa !== undefined) { updates.push('direccion_completa = ?'); params.push(direccion_completa); }
            if (estado_envio !== undefined) { updates.push('estado_envio = ?'); params.push(estado_envio); }
            if (metodo_pago !== undefined) { updates.push('metodo_pago = ?'); params.push(metodo_pago); }
            if (precio !== undefined) { updates.push('precio = ?'); params.push(precio); }
            if (estado_pago !== undefined) { updates.push('estado_pago = ?'); params.push(estado_pago); }
            if (id_repartidor !== undefined) { updates.push('id_repartidor = ?'); params.push(id_repartidor); }

            if (updates.length === 0) {
                await connection.rollback();
                return { id, ...data }; // Nada que actualizar
            }

            query += updates.join(', ');
            query += ' WHERE id_envio = ?';
            params.push(id);

            await connection.query(query, params);

            // Eliminar y reinsertar productos solo si se provee el array de products
            if (products !== undefined) {
                await connection.query('DELETE FROM envio_productos WHERE id_envio_fk = ?', [id]);
                if (Array.isArray(products) && products.length > 0) {
                    const productQueries = products.map(p => {
                        return connection.query('INSERT INTO envio_productos (id_envio_fk, id_producto_fk, cantidad) VALUES (?, ?, ?)', [id, p.id_producto, p.cantidad]);
                    });
                    await Promise.all(productQueries);
                }
            }

            await connection.commit();
            return { id, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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

            // 5. Eliminar los productos del envío.
            await connection.query('DELETE FROM envio_productos WHERE id_envio_fk = ?', [id]);

            // 6. Finalmente, eliminar el envío principal.
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