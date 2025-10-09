// config/db.js
const mysql = require('mysql2/promise');

let dbConfig;

if (process.env.DATABASE_URL) {
    // Si la variable de entorno existe (ideal para producción)
    dbConfig = {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
} else {
    // Configuración de fallback para desarrollo local si no hay .env
    console.warn("ADVERTENCIA: No se encontró DATABASE_URL. Usando configuración local.");
    dbConfig = { host: 'localhost', user: 'root', password: '', database: 'apycar_db' };
}

// Crea un "pool" de conexiones.
// Un pool es más eficiente que crear una conexión por cada consulta.
const pool = mysql.createPool(dbConfig);

// Verificamos la conexión al crear el pool
pool.getConnection()
    .then(connection => {
        let dbName = 'desconocida';
        if (dbConfig.uri) {
            dbName = new URL(dbConfig.uri).pathname.slice(1);
        } else if (dbConfig.database) {
            dbName = dbConfig.database;
        }
        console.log(`✅ Conexión exitosa a la base de datos '${dbName}'.`);
        connection.release(); // Liberamos la conexión
    })
    .catch(err => {
        console.error('❌ Error al conectar con la base de datos:', err.message);
        process.exit(1); // Termina la aplicación si no se puede conectar
    });

// Exportamos el pool para que pueda ser usado en otros módulos.
module.exports = pool;