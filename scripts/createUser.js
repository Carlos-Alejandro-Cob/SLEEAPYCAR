// scripts/createUser.js
require('dotenv').config(); // Para cargar las variables de entorno PRIMERO
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function createUser() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log('\nUso: node scripts/createUser.js <nombre_usuario> <password> <id_rol>\n');
        console.log('Ejemplo para crear un repartidor:');
        console.log('  node scripts/createUser.js repartidor01 pass123 3\n');
        console.log('Roles disponibles:');
        console.log('  1: Administrador');
        console.log('  2: Almacen');
        console.log('  3: Repartidor');
        console.log('  4: Sucursal');
        console.log('  5: Contabilidad');
        console.log('  6: SuperUsuario\n');
        process.exit(1);
    }

    const newUser = {
        nombre_usuario: args[0],
        password_plano: args[1],
        id_rol_fk: parseInt(args[2], 10),
        // Datos genéricos para los campos restantes
        nombre_completo: `Usuario ${args[0].charAt(0).toUpperCase() + args[0].slice(1)}`,
        email: `${args[0]}@example.com`
    };

    if (isNaN(newUser.id_rol_fk)) {
        console.error('❌ Error: El id_rol debe ser un número.');
        process.exit(1);
    }

    console.log('Iniciando creación de usuario...');
    let connection;

    try {
        connection = await pool.getConnection();

        // 0. Verificar si el usuario ya existe
        const [existingUsers] = await connection.query('SELECT id_usuario FROM usuarios WHERE nombre_usuario = ?', [newUser.nombre_usuario]);
        if (existingUsers.length > 0) {
            console.log(`⚠️  El usuario '${newUser.nombre_usuario}' ya existe. No se realizarán cambios.`);
            return; // Termina el script si el usuario ya existe
        }

        // 1. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newUser.password_plano, salt);
        console.log('Contraseña hasheada correctamente.');

        // 2. Insertar el usuario en la base de datos
        const query = 'INSERT INTO usuarios (nombre_completo, nombre_usuario, email, password_hash, id_rol_fk) VALUES (?, ?, ?, ?, ?)';
        const [result] = await connection.query(query, [
            newUser.nombre_completo,
            newUser.nombre_usuario,
            newUser.email,
            password_hash,
            newUser.id_rol_fk
        ]);

        console.log('✅ ¡Usuario creado con éxito!');
        console.log(`   - ID de Usuario: ${result.insertId}`);
        console.log(`   - Nombre de usuario: ${newUser.nombre_usuario}`);
        console.log(`   - Contraseña: ${newUser.password_plano}`);

    } catch (error) {
        console.error('❌ Error al crear el usuario:', error.message);
    } finally {
        if (connection) connection.release();
        await pool.end(); // Cierra todas las conexiones del pool
    }
}

createUser();