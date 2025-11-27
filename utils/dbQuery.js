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
    try {
        // First attempt
        const [rows] = await pool.query(query, params);
        return [rows];
    } catch (error) {
        console.error('❌ Error en queryWithRetry (primer intento):', error); // Log any error immediately

        // Check if it's a connection error that might be resolved by retrying
        if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
            console.warn(`⚠️  DB connection error ('${error.code}'). Retrying query once...`);
            try {
                // Second attempt, which will use a fresh connection from the pool
                const [rows] = await pool.query(query, params);
                return [rows];
            } catch (retryError) {
                console.error(`❌  Second DB query attempt failed:`, retryError);
                throw retryError; // Re-throw the error from the second attempt
            }
        }
        // If it's another type of error, re-throw it
        throw error;
    }
}

module.exports = { queryWithRetry };