// models/CodigoConfirmacion.js
const pool = require('../config/db');
const { queryWithRetry } = require('../utils/dbQuery');

class CodigoConfirmacion {
    // Generar código aleatorio de 6 dígitos
    static generarCodigo() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Generar código de confirmación para un envío
    static async generar(idEnvio, tipo, generadoPor = null) {
        let codigo;
        let codigoExiste = true;
        
        // Asegurar que el código sea único
        while (codigoExiste) {
            codigo = this.generarCodigo();
            const [existing] = await queryWithRetry(
                'SELECT id_codigo FROM codigos_confirmacion WHERE codigo = ? AND usado = FALSE',
                [codigo]
            );
            codigoExiste = existing && existing.length > 0;
        }

        // Invalidar códigos anteriores del mismo tipo para este envío
        await queryWithRetry(
            'UPDATE codigos_confirmacion SET usado = TRUE WHERE id_envio_fk = ? AND tipo = ? AND usado = FALSE',
            [idEnvio, tipo]
        );

        // Crear nuevo código
        const [result] = await queryWithRetry(
            `INSERT INTO codigos_confirmacion (id_envio_fk, codigo, tipo, generado_por, fecha_generado)
             VALUES (?, ?, ?, ?, NOW())`,
            [idEnvio, codigo, tipo, generadoPor]
        );

        return {
            id: result.insertId,
            codigo,
            tipo
        };
    }

    // Validar y usar un código
    static async validarYUsar(codigo, idEnvio, usadoPor) {
        const [rows] = await queryWithRetry(
            `SELECT id_codigo, id_envio_fk, tipo, usado 
             FROM codigos_confirmacion 
             WHERE codigo = ? AND usado = FALSE`,
            [codigo]
        );

        if (!rows || rows.length === 0) {
            return { valido: false, mensaje: 'Código no válido o ya utilizado' };
        }

        const codigoConf = rows[0];

        // Verificar que el código corresponda al envío
        if (codigoConf.id_envio_fk !== parseInt(idEnvio)) {
            return { valido: false, mensaje: 'El código no corresponde a este envío' };
        }

        // Marcar como usado
        await queryWithRetry(
            `UPDATE codigos_confirmacion 
             SET usado = TRUE, usado_por = ?, fecha_usado = NOW() 
             WHERE id_codigo = ?`,
            [usadoPor, codigoConf.id_codigo]
        );

        return {
            valido: true,
            tipo: codigoConf.tipo,
            mensaje: 'Código validado correctamente'
        };
    }

    // Obtener código activo para un envío
    static async obtenerCodigoActivo(idEnvio, tipo) {
        const [rows] = await queryWithRetry(
            `SELECT codigo, fecha_generado 
             FROM codigos_confirmacion 
             WHERE id_envio_fk = ? AND tipo = ? AND usado = FALSE 
             ORDER BY fecha_generado DESC 
             LIMIT 1`,
            [idEnvio, tipo]
        );

        return rows && rows.length > 0 ? rows[0] : null;
    }

    // Verificar si hay código activo
    static async tieneCodigoActivo(idEnvio, tipo) {
        const codigo = await this.obtenerCodigoActivo(idEnvio, tipo);
        return codigo !== null;
    }
}

module.exports = CodigoConfirmacion;
