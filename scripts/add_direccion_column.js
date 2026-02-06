// scripts/add_direccion_column.js
require('dotenv').config();
const pool = require('../config/db');

async function addDireccionColumn() {
    let connection;
    
    try {
        console.log('🔍 Verificando si la columna "direccion" existe...');
        connection = await pool.getConnection();
        
        // Verificar si la columna ya existe
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'usuarios' 
            AND COLUMN_NAME = 'direccion'
        `);
        
        if (columns.length > 0) {
            console.log('✅ La columna "direccion" ya existe en la tabla usuarios.');
            return;
        }
        
        console.log('➕ Agregando columna "direccion" a la tabla usuarios...');
        
        // Agregar la columna
        await connection.query(`
            ALTER TABLE usuarios 
            ADD COLUMN direccion VARCHAR(255) DEFAULT NULL 
            AFTER email
        `);
        
        console.log('✅ Columna "direccion" agregada exitosamente a la tabla usuarios.');
        
    } catch (error) {
        console.error('❌ Error al agregar la columna:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  La columna ya existe (error de duplicado).');
        } else {
            throw error;
        }
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

addDireccionColumn()
    .then(() => {
        console.log('✅ Script completado exitosamente.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
