require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '..', 'migration_audit_repartidor.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove comments line by line first
        const sqlClean = sql
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        const statements = sqlClean
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} statements to execute.`);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await pool.query(statement);
            } catch (err) {
                // Ignore "Duplicate column name" or "Table already exists" to make it idempotent
                if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('Skipping existing column/table.');
                } else {
                    throw err;
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
