// utils/logger.js
const pool = require('../config/db');

/**
 * Registra una acción en la tabla de auditoría.
 * @param {number} id_usuario - ID del usuario que realiza la acción.
 * @param {string} accion - Descripción corta de la acción (ej. 'UPDATE_ENVIO').
 * @param {string} detalles - Detalles adicionales en texto o JSON string.
 */
exports.logAction = async (id_usuario, accion, detalles) => {
    try {
        const query = 'INSERT INTO audit_logs (id_usuario, accion, detalles) VALUES (?, ?, ?)';
        // Asegurar que detalles sea string si es objeto
        const detallesStr = typeof detalles === 'object' ? JSON.stringify(detalles) : detalles;

        await pool.query(query, [id_usuario, accion, detallesStr]);
    } catch (error) {
        console.error('Error al registrar log de auditoría:', error);
        // No lanzamos error para no interrumpir el flujo principal
    }
};
