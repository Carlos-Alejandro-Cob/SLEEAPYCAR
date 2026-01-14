// scripts/verificarUsuarioRepartidor.js
require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const ROLES = require('../config/roles');

async function verificarUsuarioRepartidor() {
    const username = 'erick';
    const password = 'erick';
    
    let connection;
    
    try {
        connection = await pool.getConnection();
        
        console.log('🔍 Verificando usuario "erick"...\n');
        
        // 1. Verificar si el usuario existe
        const [users] = await connection.query(
            'SELECT id_usuario, nombre_completo, nombre_usuario, email, id_rol_fk, activo FROM usuarios WHERE nombre_usuario = ?',
            [username]
        );
        
        if (users.length === 0) {
            console.log('❌ El usuario "erick" no existe en la base de datos.');
            console.log('📝 Creando usuario "erick" como repartidor...\n');
            
            // Crear el usuario
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            
            const [result] = await connection.query(
                'INSERT INTO usuarios (nombre_completo, nombre_usuario, email, password_hash, id_rol_fk, activo) VALUES (?, ?, ?, ?, ?, ?)',
                ['Erick', username, `${username}@apycar.com`, password_hash, ROLES.REPARTIDOR, true]
            );
            
            console.log('✅ Usuario "erick" creado exitosamente!');
            console.log(`   - ID: ${result.insertId}`);
            console.log(`   - Usuario: ${username}`);
            console.log(`   - Contraseña: ${password}`);
            console.log(`   - Rol: Repartidor (${ROLES.REPARTIDOR})\n`);
            
        } else {
            const user = users[0];
            console.log('✅ Usuario "erick" encontrado:');
            console.log(`   - ID: ${user.id_usuario}`);
            console.log(`   - Nombre: ${user.nombre_completo}`);
            console.log(`   - Email: ${user.email || 'N/A'}`);
            console.log(`   - Rol actual: ${user.id_rol_fk}`);
            console.log(`   - Activo: ${user.activo ? 'Sí' : 'No'}\n`);
            
            // 2. Verificar si tiene el rol de repartidor
            if (user.id_rol_fk !== ROLES.REPARTIDOR) {
                console.log(`⚠️  El usuario no tiene el rol de Repartidor (tiene rol ${user.id_rol_fk})`);
                console.log('📝 Actualizando rol a Repartidor...\n');
                
                await connection.query(
                    'UPDATE usuarios SET id_rol_fk = ? WHERE id_usuario = ?',
                    [ROLES.REPARTIDOR, user.id_usuario]
                );
                
                console.log('✅ Rol actualizado a Repartidor!\n');
            } else {
                console.log('✅ El usuario ya tiene el rol de Repartidor.\n');
            }
            
            // 3. Verificar si está activo
            if (!user.activo) {
                console.log('⚠️  El usuario está inactivo.');
                console.log('📝 Activando usuario...\n');
                
                await connection.query(
                    'UPDATE usuarios SET activo = TRUE WHERE id_usuario = ?',
                    [user.id_usuario]
                );
                
                console.log('✅ Usuario activado!\n');
            }
            
            // 4. Verificar/actualizar contraseña
            console.log('🔐 Verificando contraseña...');
            
            // Obtener el hash actual
            const [userWithPassword] = await connection.query(
                'SELECT password_hash FROM usuarios WHERE id_usuario = ?',
                [user.id_usuario]
            );
            
            if (userWithPassword.length > 0) {
                const currentHash = userWithPassword[0].password_hash;
                const passwordMatch = await bcrypt.compare(password, currentHash);
                
                if (!passwordMatch) {
                    console.log('⚠️  La contraseña no coincide.');
                    console.log('📝 Actualizando contraseña a "erick"...\n');
                    
                    const salt = await bcrypt.genSalt(10);
                    const newPasswordHash = await bcrypt.hash(password, salt);
                    
                    await connection.query(
                        'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
                        [newPasswordHash, user.id_usuario]
                    );
                    
                    console.log('✅ Contraseña actualizada!\n');
                } else {
                    console.log('✅ La contraseña es correcta.\n');
                }
            }
            
            console.log('📋 Resumen final:');
            console.log(`   - Usuario: ${username}`);
            console.log(`   - Contraseña: ${password}`);
            console.log(`   - Rol: Repartidor (${ROLES.REPARTIDOR})`);
            console.log(`   - Estado: Activo\n`);
        }
        
        // 5. Verificar que el usuario pueda hacer login
        console.log('🧪 Verificando que el usuario pueda hacer login...');
        const [testUser] = await connection.query(
            'SELECT id_usuario, nombre_completo, nombre_usuario, password_hash, id_rol_fk FROM usuarios WHERE nombre_usuario = ? AND activo = TRUE',
            [username]
        );
        
        if (testUser.length > 0) {
            const testPasswordMatch = await bcrypt.compare(password, testUser[0].password_hash);
            if (testPasswordMatch && testUser[0].id_rol_fk === ROLES.REPARTIDOR) {
                console.log('✅ El usuario está listo para usar en la aplicación móvil!\n');
            } else {
                console.log('❌ Hay un problema con las credenciales o el rol.\n');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

verificarUsuarioRepartidor();
