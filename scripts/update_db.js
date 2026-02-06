const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
    let connection;
    try {
        console.log('Conectando a la base de datos...');
        connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Conexión exitosa.');

        // Verificar columnas en la tabla envios
        const [columns] = await connection.query(`SHOW COLUMNS FROM envios`);
        const columnNames = columns.map(c => c.Field);

        console.log('Columnas actuales en envios:', columnNames.join(', '));

        if (!columnNames.includes('precio')) {
            console.log('Agregando columna precio...');
            await connection.query(`ALTER TABLE envios ADD COLUMN precio DECIMAL(10, 2) DEFAULT 0.00`);
            console.log('Columna precio agregada.');
        } else {
            console.log('La columna precio ya existe.');
        }

        if (!columnNames.includes('estado_pago')) {
            console.log('Agregando columna estado_pago...');
            await connection.query(`ALTER TABLE envios ADD COLUMN estado_pago ENUM('Pendiente', 'Pagado') DEFAULT 'Pendiente'`);
            console.log('Columna estado_pago agregada.');
        } else {
            console.log('La columna estado_pago ya existe.');
        }

        console.log('Actualización de base de datos completada.');

    } catch (error) {
        console.error('Error durante la actualización:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateDatabase();
