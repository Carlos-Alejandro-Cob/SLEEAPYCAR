// models/CodigoConfirmacion.js
const pool = require('../config/db');
const { queryWithRetry } = require('../utils/dbQuery');

/** Código de seguridad: 6 dígitos numéricos, aleatorio, no reutilizable, asociado al pedido. */

const FORMATO_CODIGO = /^[0-9]{6}$/;
const MENSAJE_FORMATO_INVALIDO = 'El código debe tener exactamente 6 dígitos numéricos.';

class CodigoConfirmacion {
    /**
     * Valida que el código cumpla formato: exactamente 6 dígitos numéricos.
     * @param {string} codigo
     * @returns {boolean}
     */
    static validarFormato(codigo) {
        if (typeof codigo !== 'string') return false;
        return FORMATO_CODIGO.test(codigo.trim());
    }

    // Generar código aleatorio de 6 dígitos (numérico)
    static generarCodigo() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Generar código de confirmación para un envío
    static async generar(idEnvio, tipo, generadoPor = null) {
        let codigo;
        let codigoExiste = true;

        // Asegurar que el código sea único (con límite de intentos para evitar bucles infinitos)
        let intentos = 0;
        const MAX_INTENTOS = 100;

        while (codigoExiste && intentos < MAX_INTENTOS) {
            codigo = this.generarCodigo();
            console.log(`[DEBUG_FREEZE] Intento ${intentos + 1}: Generado código ${codigo}`);
            const [existing] = await queryWithRetry(
                'SELECT id_codigo FROM codigos_confirmacion WHERE codigo = ? AND usado = FALSE',
                [codigo]
            );
            codigoExiste = existing && existing.length > 0;
            if (codigoExiste) console.log(`[DEBUG_FREEZE] Código ${codigo} ya existe. Reintentando...`);
            intentos++;
        }

        if (intentos >= MAX_INTENTOS) {
            console.error('[DEBUG_FREEZE] FATAL: Límite de intentos alcanzado');
            throw new Error('No se pudo generar un código único después de varios intentos. Por favor, intente de nuevo.');
        }

        // Invalidar códigos anteriores del mismo tipo para este envío
        console.log('[DEBUG_FREEZE] Invalidando códigos anteriores...');
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

    /**
     * Valida un código sin marcarlo como usado. Útil para verificación previa.
     * @param {string} codigo - Código de 6 dígitos
     * @param {number|string} idEnvio - ID del envío
     * @returns {{ valido: boolean, mensaje: string }}
     */
    static async validarSinUsar(codigo, idEnvio) {
        const c = (typeof codigo === 'string' ? codigo : '').trim();
        if (!this.validarFormato(c)) {
            return { valido: false, mensaje: MENSAJE_FORMATO_INVALIDO };
        }
        const [rows] = await queryWithRetry(
            `SELECT id_codigo, id_envio_fk, tipo, usado 
             FROM codigos_confirmacion 
             WHERE codigo = ? AND usado = FALSE`,
            [c]
        );
        if (!rows || rows.length === 0) {
            return { valido: false, mensaje: 'Código no válido o ya utilizado.' };
        }
        const codigoConf = rows[0];
        if (codigoConf.id_envio_fk !== parseInt(idEnvio, 10)) {
            return { valido: false, mensaje: 'El código no corresponde a este pedido.' };
        }
        return { valido: true, tipo: codigoConf.tipo, mensaje: 'Código válido.' };
    }

    /**
     * Validar y usar un código. Verifica formato, existencia, envío y que no esté usado.
     * Si es válido, lo marca como usado. Si no, el estado del pedido NO debe cambiar.
     */
    static async validarYUsar(codigo, idEnvio, usadoPor) {
        const c = (typeof codigo === 'string' ? codigo : '').trim();
        if (!this.validarFormato(c)) {
            return { valido: false, mensaje: MENSAJE_FORMATO_INVALIDO };
        }

        const [rows] = await queryWithRetry(
            `SELECT id_codigo, id_envio_fk, tipo, usado 
             FROM codigos_confirmacion 
             WHERE codigo = ? AND usado = FALSE`,
            [c]
        );

        if (!rows || rows.length === 0) {
            return { valido: false, mensaje: 'Código no válido o ya utilizado.' };
        }

        const codigoConf = rows[0];

        if (codigoConf.id_envio_fk !== parseInt(idEnvio, 10)) {
            return { valido: false, mensaje: 'El código no corresponde a este pedido.' };
        }

        await queryWithRetry(
            `UPDATE codigos_confirmacion 
             SET usado = TRUE, usado_por = ?, fecha_usado = NOW() 
             WHERE id_codigo = ?`,
            [usadoPor, codigoConf.id_codigo]
        );

        return {
            valido: true,
            tipo: codigoConf.tipo,
            mensaje: 'Código validado correctamente.'
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

    // Cancelar código activo por ID de envío y tipo
    static async cancelarCodigoActivo(idEnvio, tipo, canceladoPor) {
        const [rows] = await queryWithRetry(
            `SELECT id_codigo, codigo 
             FROM codigos_confirmacion 
             WHERE id_envio_fk = ? AND tipo = ? AND usado = FALSE 
             ORDER BY fecha_generado DESC 
             LIMIT 1`,
            [idEnvio, tipo]
        );

        if (!rows || rows.length === 0) {
            return { cancelado: false, mensaje: 'No hay código activo para cancelar' };
        }

        const codigoConf = rows[0];

        // Marcar como usado (cancelado)
        await queryWithRetry(
            `UPDATE codigos_confirmacion 
             SET usado = TRUE, usado_por = ?, fecha_usado = NOW() 
             WHERE id_codigo = ?`,
            [canceladoPor, codigoConf.id_codigo]
        );

        return {
            cancelado: true,
            codigo: codigoConf.codigo,
            mensaje: 'Código cancelado correctamente'
        };
    }
}

module.exports = CodigoConfirmacion;
