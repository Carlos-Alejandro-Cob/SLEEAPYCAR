// utils/dbQuery.js
const pool = require('../config/db');

/**
 * Executes a database query with a single retry attempt for connection errors.
 * This helps recover from issues like 'ECONNRESET' where the DB server closes an idle connection.
 * @param {string} query - The SQL query string.
 * @param {Array} params - The parameters to pass to the query.
 * @returns {Promise<Array>} A promise that resolves with the query results.
 */
async function queryWithRetry(query, params) {
    const startTime = Date.now();
    const queryPreview = query.substring(0, 100).replace(/\s+/g, ' ').trim();
    console.log(`[DB] Ejecutando query: ${queryPreview}...`);
    
    try {
        // First attempt
        const [rows] = await pool.query(query, params);
        const duration = Date.now() - startTime;
        console.log(`[DB] Query completada en ${duration}ms, filas: ${Array.isArray(rows) ? rows.length : 'N/A'}`);
        return [rows];
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Error en queryWithRetry (primer intento, tiempo: ${duration}ms):`, error.message);
        console.error(`❌ Código de error:`, error.code);
        console.error(`❌ Query: ${queryPreview}`);

        // Check if it's a connection error that might be resolved by retrying
        if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ETIMEDOUT') {
            console.warn(`⚠️  DB connection error ('${error.code}'). Retrying query once...`);
            try {
                const retryStartTime = Date.now();
                // Second attempt, which will use a fresh connection from the pool
                const [rows] = await pool.query(query, params);
                const retryDuration = Date.now() - retryStartTime;
                console.log(`[DB] Query retry exitosa en ${retryDuration}ms`);
                return [rows];
            } catch (retryError) {
                const retryDuration = Date.now() - startTime;
                console.error(`❌  Second DB query attempt failed (tiempo total: ${retryDuration}ms):`, retryError.message);
                throw retryError; // Re-throw the error from the second attempt
            }
        }
        // If it's another type of error, re-throw it
        throw error;
    }
}

module.exports = { queryWithRetry };