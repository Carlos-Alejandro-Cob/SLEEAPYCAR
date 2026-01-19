// controllers/mobileController.js
const Envio = require('../models/Envio');
const { queryWithRetry } = require('../utils/dbQuery');
const ROLES = require('../config/roles');
const passport = require('passport');
const User = require('../models/User');

// API: Login para Flutter
exports.loginMobile = (req, res, next) => {
    // Timeout para la petición completa (25 segundos)
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            console.error('[TIMEOUT] El login móvil excedió 25 segundos sin respuesta');
            return res.status(504).json({
                success: false,
                message: 'El servidor tardó demasiado en responder. Por favor, intenta nuevamente.'
            });
        }
    }, 25000);

    // Logs para debug
    const startTime = Date.now();
    console.log('=== LOGIN MÓVIL ===');
    console.log('Body recibido:', req.body);
    console.log('nombre_usuario:', req.body.nombre_usuario);
    console.log('password:', req.body.password ? '***' : 'NO ENVIADO');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('IP del cliente:', req.ip || req.connection.remoteAddress);
    
    // Wrapper para limpiar el timeout cuando termine
    const cleanup = () => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        console.log(`[LOGIN] Proceso completado en ${duration}ms`);
    };
    
    passport.authenticate('local', (err, user, info) => {
        cleanup(); // Limpiar timeout
        if (err) {
            console.error('Error en autenticación:', err);
            console.error('Stack:', err.stack);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
        if (!user) {
            console.log('Usuario no encontrado o credenciales incorrectas');
            console.log('Info:', info);
            return res.status(401).json({
                success: false,
                message: info.message || 'Credenciales incorrectas'
            });
        }
        console.log('Usuario encontrado:', user.nombre_usuario, 'Rol:', user.id_rol_fk);
        req.logIn(user, (err) => {
            if (err) {
                console.error('Error al hacer login:', err);
                console.error('Stack:', err.stack);
                return res.status(500).json({
                    success: false,
                    message: 'Error al iniciar sesión'
                });
            }
            // Verificar que sea repartidor
            if (user.id_rol_fk !== ROLES.REPARTIDOR && user.id_rol_fk !== ROLES.SUPER_ADMIN) {
                console.log('Usuario no es repartidor. Rol:', user.id_rol_fk);
                req.logout();
                return res.status(403).json({
                    success: false,
                    message: 'Solo los repartidores pueden acceder a esta aplicación'
                });
            }
            // La cookie ya se envía automáticamente por express-session
            // No es necesario configurarla manualmente aquí
            console.log('Login exitoso para:', user.nombre_usuario);
            
            return res.json({
                success: true,
                user: {
                    id: user.id_usuario,
                    nombre: user.nombre_completo,
                    username: user.nombre_usuario,
                    rol: user.id_rol_fk
                }
            });
        });
    })(req, res, next);
};

// API: Logout para Flutter
exports.logoutMobile = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    });
};

// API: Obtener lista de envíos para repartidor (para Flutter)
exports.getEnviosRepartidor = async (req, res) => {
    try {
        // Obtener envíos asignados al repartidor que no estén entregados
        const envios = await Envio.findAll({ 
            id_repartidor: req.user.id_usuario, 
            estado: 'NO_ENTREGADO' 
        });
        
        res.json({
            success: true,
            envios: envios || [],
            user: {
                id: req.user.id_usuario,
                nombre: req.user.nombre_completo,
                username: req.user.nombre_usuario
            }
        });
    } catch (error) {
        console.error('Error al obtener envíos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los envíos'
        });
    }
};

// Obtener detalles de un envío con sus productos
exports.getEnvioDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const envio = await Envio.findById(id);
        
        if (!envio) {
            return res.status(404).json({ 
                success: false, 
                message: 'Envío no encontrado' 
            });
        }
        
        // Verificar que el envío pertenezca al repartidor
        if (envio.id_repartidor !== req.user.id_usuario) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para ver este envío' 
            });
        }
        
        // Obtener productos del envío con información adicional
        const [productos] = await queryWithRetry(`
            SELECT 
                ep.id_producto_fk,
                ep.cantidad,
                p.descripcion,
                p.id_producto
            FROM envio_productos ep 
            LEFT JOIN productos p ON ep.id_producto_fk = p.id_producto 
            WHERE ep.id_envio_fk = ?
        `, [id]);
        
        // Obtener productos entregados (si existe tabla de seguimiento)
        // Por ahora, inicializamos todos como no entregados
        const productosConEstado = productos.map(p => ({
            ...p,
            entregado: 0,
            pendiente: p.cantidad
        }));
        
        res.json({
            success: true,
            envio: {
                id: envio._id,
                codigo: envio.ID_Envio,
                destinatario: envio.Nombre_Destinatario,
                direccion: envio.Direccion_Completa,
                estado: envio.Estado_Envio
            },
            productos: productosConEstado,
            totalProductos: productos.reduce((sum, p) => sum + parseInt(p.cantidad), 0)
        });
    } catch (error) {
        console.error('Error al obtener detalle de envío:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener el detalle del envío' 
        });
    }
};

// Buscar producto por código
exports.buscarProductoPorCodigo = async (req, res) => {
    try {
        const { codigo, id_envio } = req.body;
        
        if (!codigo || !id_envio) {
            return res.status(400).json({ 
                success: false, 
                message: 'Código de producto e ID de envío son requeridos' 
            });
        }
        
        // Verificar que el envío pertenezca al repartidor
        const envio = await Envio.findById(id_envio);
        if (!envio || envio.id_repartidor !== req.user.id_usuario) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para este envío' 
            });
        }
        
        // Buscar producto por código en el JSON o por ID en la BD
        // Primero intentar buscar por id_producto (si el código es numérico)
        let producto = null;
        
        if (!isNaN(codigo)) {
            const [productosBD] = await queryWithRetry(
                'SELECT id_producto, descripcion FROM productos WHERE id_producto = ?',
                [codigo]
            );
            if (productosBD && productosBD.length > 0) {
                producto = productosBD[0];
            }
        }
        
        // Si no se encontró, buscar por descripción parcial
        if (!producto) {
            const [productosBD] = await queryWithRetry(
                'SELECT id_producto, descripcion FROM productos WHERE descripcion LIKE ? LIMIT 1',
                [`%${codigo}%`]
            );
            if (productosBD && productosBD.length > 0) {
                producto = productosBD[0];
            }
        }
        
        if (!producto) {
            return res.status(404).json({ 
                success: false, 
                message: 'Producto no encontrado' 
            });
        }
        
        // Verificar que el producto esté en el envío
        const [envioProductos] = await queryWithRetry(
            `SELECT ep.id_producto_fk, ep.cantidad, p.descripcion 
             FROM envio_productos ep 
             LEFT JOIN productos p ON ep.id_producto_fk = p.id_producto 
             WHERE ep.id_envio_fk = ? AND ep.id_producto_fk = ?`,
            [id_envio, producto.id_producto]
        );
        
        if (!envioProductos || envioProductos.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Este producto no está en el envío' 
            });
        }
        
        res.json({
            success: true,
            producto: {
                id_producto: envioProductos[0].id_producto_fk,
                descripcion: envioProductos[0].descripcion,
                cantidad: envioProductos[0].cantidad
            }
        });
    } catch (error) {
        console.error('Error al buscar producto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al buscar el producto' 
        });
    }
};

// Marcar producto como entregado
exports.marcarProductoEntregado = async (req, res) => {
    try {
        const { id_envio, id_producto } = req.body;
        
        if (!id_envio || !id_producto) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de envío e ID de producto son requeridos' 
            });
        }
        
        // Verificar que el envío pertenezca al repartidor
        const envio = await Envio.findById(id_envio);
        if (!envio || envio.id_repartidor !== req.user.id_usuario) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para este envío' 
            });
        }
        
        // Verificar que el producto esté en el envío
        const [envioProductos] = await queryWithRetry(
            'SELECT cantidad FROM envio_productos WHERE id_envio_fk = ? AND id_producto_fk = ?',
            [id_envio, id_producto]
        );
        
        if (!envioProductos || envioProductos.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Este producto no está en el envío' 
            });
        }
        
        // Crear o actualizar registro de producto entregado
        // Usaremos una tabla temporal en sesión o crear una tabla de seguimiento
        // Por ahora, guardaremos en sesión del usuario
        const sessionKey = `entregados_${id_envio}`;
        if (!req.session[sessionKey]) {
            req.session[sessionKey] = {};
        }
        
        if (!req.session[sessionKey][id_producto]) {
            req.session[sessionKey][id_producto] = 0;
        }
        
        const cantidadActual = req.session[sessionKey][id_producto];
        const cantidadTotal = parseInt(envioProductos[0].cantidad);
        
        if (cantidadActual >= cantidadTotal) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ya se entregaron todos los productos de este tipo' 
            });
        }
        
        req.session[sessionKey][id_producto] = cantidadActual + 1;
        
        // Obtener estado actualizado
        const [productos] = await queryWithRetry(`
            SELECT 
                ep.id_producto_fk,
                ep.cantidad,
                p.descripcion
            FROM envio_productos ep 
            LEFT JOIN productos p ON ep.id_producto_fk = p.id_producto 
            WHERE ep.id_envio_fk = ?
        `, [id_envio]);
        
        const productosConEstado = productos.map(p => {
            const entregado = req.session[sessionKey][p.id_producto_fk] || 0;
            return {
                ...p,
                entregado: entregado,
                pendiente: parseInt(p.cantidad) - entregado
            };
        });
        
        const totalEntregado = productosConEstado.reduce((sum, p) => sum + p.entregado, 0);
        const totalProductos = productosConEstado.reduce((sum, p) => sum + parseInt(p.cantidad), 0);
        
        res.json({
            success: true,
            productos: productosConEstado,
            totalEntregado,
            totalProductos,
            completado: totalEntregado >= totalProductos
        });
    } catch (error) {
        console.error('Error al marcar producto como entregado:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al marcar el producto como entregado' 
        });
    }
};

// Obtener estado actual de productos entregados
exports.getEstadoProductos = async (req, res) => {
    try {
        const { id_envio } = req.params;
        
        // Verificar que el envío pertenezca al repartidor
        const envio = await Envio.findById(id_envio);
        if (!envio || envio.id_repartidor !== req.user.id_usuario) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para ver este envío' 
            });
        }
        
        const sessionKey = `entregados_${id_envio}`;
        const entregados = req.session[sessionKey] || {};
        
        const [productos] = await queryWithRetry(`
            SELECT 
                ep.id_producto_fk,
                ep.cantidad,
                p.descripcion
            FROM envio_productos ep 
            LEFT JOIN productos p ON ep.id_producto_fk = p.id_producto 
            WHERE ep.id_envio_fk = ?
        `, [id_envio]);
        
        const productosConEstado = productos.map(p => {
            const entregado = entregados[p.id_producto_fk] || 0;
            return {
                ...p,
                entregado: entregado,
                pendiente: parseInt(p.cantidad) - entregado
            };
        });
        
        const totalEntregado = productosConEstado.reduce((sum, p) => sum + p.entregado, 0);
        const totalProductos = productosConEstado.reduce((sum, p) => sum + parseInt(p.cantidad), 0);
        
        res.json({
            success: true,
            productos: productosConEstado,
            totalEntregado,
            totalProductos,
            completado: totalEntregado >= totalProductos
        });
    } catch (error) {
        console.error('Error al obtener estado de productos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener el estado de productos' 
        });
    }
};
