// utils/validations.js

/**
 * Valida que el código de envío tenga el formato E-yyyy/mm/dd-NN
 * Formato: E- seguido de fecha yyyy/mm/dd, guion, y número secuencial de 2 dígitos
 * Ejemplo: E-2025/10/26-01
 * 
 * @param {string} codigo - El código de envío a validar
 * @returns {Object} - { valid: boolean, error: string|null }
 */
function validateCodigoEnvio(codigo) {
    if (!codigo || typeof codigo !== 'string') {
        return {
            valid: false,
            error: 'El código de envío es requerido y debe ser texto.'
        };
    }

    // Expresión regular para el formato E-yyyy/mm/dd-NN
    // E- seguido de fecha yyyy/mm/dd, guion, y 2 dígitos (secuencial)
    const formatoRegex = /^E-\d{4}\/\d{2}\/\d{2}-\d{2}$/;

    if (!formatoRegex.test(codigo)) {
        return {
            valid: false,
            error: 'El código de envío debe tener el formato E-yyyy/mm/dd-NN (ejemplo: E-2025/10/26-01)'
        };
    }

    // Extraer la fecha (formato: E-yyyy/mm/dd-NN)
    const partes = codigo.match(/^E-(\d{4})\/(\d{2})\/(\d{2})-(\d{2})$/);
    if (!partes) {
        return {
            valid: false,
            error: 'El formato del código de envío no es válido.'
        };
    }

    const año = parseInt(partes[1]);
    const mes = parseInt(partes[2]);
    const dia = parseInt(partes[3]);

    // Validar que la fecha sea válida (permite cualquier fecha válida)
    const fecha = new Date(año, mes - 1, dia);
    if (fecha.getFullYear() !== año || 
        fecha.getMonth() !== mes - 1 || 
        fecha.getDate() !== dia) {
        return {
            valid: false,
            error: 'La fecha en el código de envío no es válida.'
        };
    }

    // Validar que el número secuencial sea entre 01 y 99
    const secuencial = parseInt(partes[4]);
    if (secuencial < 1 || secuencial > 99) {
        return {
            valid: false,
            error: 'El número secuencial debe estar entre 01 y 99.'
        };
    }

    return {
        valid: true,
        error: null
    };
}

/**
 * Genera un código de envío sugerido basado en la fecha actual
 * @param {number} secuencial - Número secuencial (1-99)
 * @returns {string} - Código en formato E-yyyy/mm/dd-NN
 */
function generarCodigoEnvio(secuencial = 1) {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const numSecuencial = String(secuencial).padStart(2, '0');
    
    return `E-${año}/${mes}/${dia}-${numSecuencial}`;
}

/**
 * Obtiene el siguiente número secuencial para códigos de envío del día actual
 * @returns {Promise<number>} - El siguiente número secuencial (1-99)
 */
async function obtenerSiguienteSecuencial() {
    const pool = require('../config/db');
    const { queryWithRetry } = require('../utils/dbQuery');
    
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const prefijoFecha = `E-${año}/${mes}/${dia}-`;
    
    // Buscar todos los códigos que empiecen con el prefijo de hoy
    const query = `
        SELECT codigo_envio 
        FROM envios 
        WHERE codigo_envio LIKE ? 
        ORDER BY codigo_envio DESC 
        LIMIT 1
    `;
    
    try {
        const [rows] = await queryWithRetry(query, [`${prefijoFecha}%`]);
        
        if (rows.length === 0) {
            return 1; // Es el primer envío del día
        }
        
        // Extraer el número secuencial del último código
        const ultimoCodigo = rows[0].codigo_envio;
        const match = ultimoCodigo.match(/E-\d{4}\/\d{2}\/\d{2}-(\d{2})$/);
        
        if (match && match[1]) {
            const ultimoSecuencial = parseInt(match[1], 10);
            const siguienteSecuencial = ultimoSecuencial + 1;
            
            if (siguienteSecuencial > 99) {
                throw new Error('Se ha alcanzado el límite de 99 envíos por día.');
            }
            
            return siguienteSecuencial;
        }
        
        return 1; // Si no se puede extraer, empezar desde 1
    } catch (error) {
        console.error('Error al obtener siguiente secuencial:', error);
        return 1; // En caso de error, empezar desde 1
    }
}

module.exports = {
    validateCodigoEnvio,
    generarCodigoEnvio,
    obtenerSiguienteSecuencial
};

