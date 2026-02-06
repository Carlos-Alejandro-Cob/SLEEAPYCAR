
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.log('Uso: node scripts/run_migration.js <archivo_sql>');
        process.exit(1);
    }

    const filePath = path.join(__dirname, '..', args[0]);

    if (!fs.existsSync(filePath)) {
        console.error(`Error: El archivo ${filePath} no existe.`);
        process.exit(1);
    }

    let connection;
    try {
        console.log('Conectando a la base de datos...');
        connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Conexión exitosa.');

        console.log(`Ejecutando migración desde ${args[0]}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        const queries = sql.split(';').filter(query => query.trim() !== '');

        for (const query of queries) {
            await connection.query(query);
        }

        console.log('Migración completada con éxito.');

    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
