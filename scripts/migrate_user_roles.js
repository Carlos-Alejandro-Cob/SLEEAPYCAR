// scripts/migrate_user_roles.js
require('dotenv').config();
const pool = require('../config/db');

async function migrateUserRoles() {
    let connection;
    
    try {
        console.log('🔄 Iniciando migración de roles de usuarios...');
        connection = await pool.getConnection();
        
        await connection.beginTransaction();
        
        // 1. Migrar usuarios de Cliente (7) a Sucursal (4)
        console.log('📦 Migrando usuarios de Cliente (7) a Sucursal (4)...');
        const [clientesResult] = await connection.query(`
            UPDATE usuarios 
            SET id_rol_fk = 4 
            WHERE id_rol_fk = 7
        `);
        console.log(`✅ ${clientesResult.affectedRows} usuarios migrados de Cliente a Sucursal`);
        
        // 2. Migrar usuarios de Superusuario (6) a Administrador (1)
        console.log('👑 Migrando usuarios de Superusuario (6) a Administrador (1)...');
        const [superAdminResult] = await connection.query(`
            UPDATE usuarios 
            SET id_rol_fk = 1 
            WHERE id_rol_fk = 6
        `);
        console.log(`✅ ${superAdminResult.affectedRows} usuarios migrados de Superusuario a Administrador`);
        
        // 3. Migrar usuarios de Contabilidad (5) a Administrador (1)
        console.log('💰 Migrando usuarios de Contabilidad (5) a Administrador (1)...');
        const [contabilidadResult] = await connection.query(`
            UPDATE usuarios 
            SET id_rol_fk = 1 
            WHERE id_rol_fk = 5
        `);
        console.log(`✅ ${contabilidadResult.affectedRows} usuarios migrados de Contabilidad a Administrador`);
        
        await connection.commit();
        console.log('✅ Migración completada exitosamente.');
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error durante la migración:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

migrateUserRoles()
    .then(() => {
        console.log('✅ Script de migración completado.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
