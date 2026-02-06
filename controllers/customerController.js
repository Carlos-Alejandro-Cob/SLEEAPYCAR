// controllers/customerController.js
const ROLES = require('../config/roles');
const Envio = require('../models/Envio');
const { mapearEstadoCliente } = require('../utils/estadoEnvio');

// Mapeo de roles para mostrar el nombre del rol
const roleNames = {
    1: 'Administrador',
    2: 'Bodeguero',
    3: 'Repartidor',
    4: 'Sucursal',
    5: 'Contabilidad',
    6: 'Super Usuario',
    7: 'Cliente'
};

// Preparar información del usuario desde req.user (sin necesidad de consulta adicional)
function prepareUserInfo(reqUser) {
    if (!reqUser) {
        return null;
    }
    
    return {
        id_usuario: reqUser.id_usuario,
        nombre_completo: reqUser.nombre_completo || 'No especificado',
        nombre_usuario: reqUser.nombre_usuario,
        email: reqUser.email || null,
        id_rol_fk: reqUser.id_rol_fk,
        nombre_rol: roleNames[reqUser.id_rol_fk] || 'Usuario'
    };
}

// Mostrar el dashboard del cliente
exports.showDashboard = async (req, res) => {
    try {
        const userInfo = prepareUserInfo(req.user);
        
        res.render('public/dashboard', { 
            title: 'Mi Cuenta',
            activeSection: 'cuenta',
            userInfo: userInfo
        });
    } catch (error) {
        console.error('❌ Error en showDashboard:', error.message);
        req.flash('error_msg', 'Error al cargar la información de la cuenta');
        res.render('public/dashboard', { 
            title: 'Mi Cuenta',
            activeSection: 'cuenta',
            userInfo: null
        });
    }
};

// Obtener pedidos del cliente
async function getCustomerOrders(userId, nombreCompleto) {
    try {
        if (!nombreCompleto) {
            return [];
        }
        
        // Buscar envíos donde el nombre del destinatario coincida con el nombre del cliente
        const query = `
            SELECT 
                e.id_envio,
                e.codigo_envio,
                e.nombre_destinatario,
                e.direccion_completa,
                e.estado_envio,
                e.metodo_pago,
                e.precio,
                e.estado_pago,
                e.fecha_salida,
                e.fecha_entrega
            FROM envios e
            WHERE e.nombre_destinatario = ?
            ORDER BY e.fecha_salida DESC
        `;
        
        const { queryWithRetry } = require('../utils/dbQuery');
        const [rows] = await queryWithRetry(query, [nombreCompleto]);
        
        if (!rows || rows.length === 0) {
            return [];
        }
        
        // Obtener productos para cada envío
        const pedidosConProductos = await Promise.all(
            rows.map(async (pedido) => {
                try {
                    const [productos] = await queryWithRetry(
                        `SELECT 
                            ep.cantidad,
                            p.descripcion,
                            p.precio
                        FROM envio_productos ep
                        JOIN productos p ON ep.id_producto_fk = p.id_producto
                        WHERE ep.id_envio_fk = ?`,
                        [pedido.id_envio]
                    );
                    pedido.productos = productos || [];
                    // Mapear el estado interno al estado visible para el cliente
                    pedido.estado_envio_cliente = mapearEstadoCliente(pedido.estado_envio);
                    return pedido;
                } catch (error) {
                    console.error(`Error al obtener productos para envío ${pedido.id_envio}:`, error.message);
                    pedido.productos = [];
                    pedido.estado_envio_cliente = mapearEstadoCliente(pedido.estado_envio);
                    return pedido;
                }
            })
        );
        
        return pedidosConProductos;
    } catch (error) {
        console.error('Error al obtener pedidos del cliente:', error.message);
        // Retornar array vacío en lugar de lanzar error para que la página se muestre correctamente
        return [];
    }
}

// Mostrar la sección de Pedidos
exports.showPedidos = async (req, res) => {
    try {
        const userInfo = prepareUserInfo(req.user);
        let pedidos = [];
        
        if (userInfo && userInfo.nombre_completo) {
            pedidos = await getCustomerOrders(userInfo.id_usuario, userInfo.nombre_completo);
        }
        
        res.render('public/dashboard', { 
            title: 'Mis Pedidos',
            activeSection: 'pedidos',
            userInfo: userInfo,
            pedidos: pedidos
        });
    } catch (error) {
        console.error('Error en showPedidos:', error);
        res.render('public/dashboard', { 
            title: 'Mis Pedidos',
            activeSection: 'pedidos',
            userInfo: null,
            pedidos: []
        });
    }
};

// Función auxiliar para obtener el precio disponible (busca desde Precio #1 hasta Precio #15)
function obtenerPrecioDisponible(producto) {
    // Buscar precio desde #1 hasta #15
    for (let i = 1; i <= 15; i++) {
        const precioKey = `Precio #${i}`;
        const precio = producto[precioKey];
        
        // Si el precio existe y no está vacío
        if (precio !== undefined && precio !== null && precio !== '' && precio !== '0') {
            const precioNum = parseFloat(precio);
            if (!isNaN(precioNum) && precioNum > 0) {
                return precioNum;
            }
        }
    }
    return 0; // Si no encuentra ningún precio válido
}

// Obtener productos del catálogo
async function getProductos() {
    try {
        const fs = require('fs');
        const path = require('path');
        const productosPath = path.join(__dirname, '../data/productos.json');
        
        // Verificar si existe el archivo de productos
        if (fs.existsSync(productosPath)) {
            const productosData = fs.readFileSync(productosPath, 'utf8');
            const productosRaw = JSON.parse(productosData);
            
            // Transformar los productos al formato esperado
            const productos = productosRaw.map((producto, index) => {
                const precio = obtenerPrecioDisponible(producto);
                
                // Obtener existencia o asignar valor por defecto
                let existencia = producto['Existencia'];
                if (!existencia || existencia === '' || existencia === '0' || parseInt(existencia) <= 0) {
                    // Si no tiene existencia, asignar un valor por defecto (por ejemplo, 100)
                    existencia = '100';
                }
                
                return {
                    id_producto: producto['Código'] || producto['No.'] || (index + 1),
                    descripcion: producto['Descripción'] || producto['Nombre corto'] || 'Producto sin nombre',
                    precio: precio,
                    detalles: producto['Grupo'] || producto['Marca'] || '',
                    codigo: producto['Código'] || '',
                    existencia: existencia,
                    um: producto['UM'] || ''
                };
            }).filter(producto => {
                // Filtrar productos que tengan precio válido y descripción
                return producto.precio > 0 && producto.descripcion !== 'Producto sin nombre';
            });
            
            return productos;
        }
        
        // Si no existe, intentar obtener de la base de datos
        try {
            const { queryWithRetry } = require('../utils/dbQuery');
            const [rows] = await queryWithRetry('SELECT id_producto, descripcion, precio FROM productos ORDER BY descripcion', []);
            return rows || [];
        } catch (error) {
            console.error('Error al obtener productos de BD:', error.message);
            return [];
        }
    } catch (error) {
        console.error('Error al obtener productos:', error.message);
        return [];
    }
}

// Mostrar la sección de Catálogo
exports.showCatalogo = async (req, res) => {
    try {
        const userInfo = prepareUserInfo(req.user);
        const productos = await getProductos();
        
        // Obtener grupos únicos para el filtro
        const grupos = [...new Set(productos.map(p => p.detalles).filter(g => g && g !== ''))].sort();
        
        // Obtener cantidad de items en el carrito desde la sesión
        const carrito = req.session.carrito || [];
        const carritoCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        
        res.render('public/dashboard', { 
            title: 'Catálogo de Productos',
            activeSection: 'catalogo',
            userInfo: userInfo,
            productos: productos,
            grupos: grupos,
            carritoCount: carritoCount
        });
    } catch (error) {
        console.error('Error en showCatalogo:', error);
        res.render('public/dashboard', { 
            title: 'Catálogo de Productos',
            activeSection: 'catalogo',
            userInfo: null,
            productos: [],
            grupos: [],
            carritoCount: 0
        });
    }
};

// Mostrar la sección de Carrito
exports.showCarrito = async (req, res) => {
    try {
        const userInfo = prepareUserInfo(req.user);
        const carrito = req.session.carrito || [];
        
        res.render('public/dashboard', { 
            title: 'Carrito de Compras',
            activeSection: 'carrito',
            userInfo: userInfo,
            carrito: carrito,
            paypalClientId: process.env.PAYPAL_CLIENT_ID || 'sb' // Para el SDK de PayPal
        });
    } catch (error) {
        console.error('Error en showCarrito:', error);
        res.render('public/dashboard', { 
            title: 'Carrito de Compras',
            activeSection: 'carrito',
            userInfo: null,
            carrito: [],
            paypalClientId: process.env.PAYPAL_CLIENT_ID || 'sb'
        });
    }
};

// API: Agregar producto al carrito
exports.agregarAlCarrito = (req, res) => {
    try {
        if (!req.session.carrito) {
            req.session.carrito = [];
        }
        
        const { id_producto, nombre, precio, cantidad = 1 } = req.body;
        
        if (!id_producto || !nombre || precio === undefined) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }
        
        const carrito = req.session.carrito;
        const productoExistente = carrito.find(item => item.id_producto == id_producto);
        
        if (productoExistente) {
            productoExistente.cantidad += parseInt(cantidad);
        } else {
            carrito.push({
                id_producto: parseInt(id_producto),
                nombre: nombre,
                precio: parseFloat(precio),
                cantidad: parseInt(cantidad)
            });
        }
        
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        
        res.json({ 
            success: true, 
            message: 'Producto agregado al carrito',
            carritoCount: totalItems
        });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ success: false, message: 'Error al agregar producto' });
    }
};

// API: Actualizar cantidad en el carrito
exports.actualizarCarrito = (req, res) => {
    try {
        const { id_producto, cantidad } = req.body;
        
        if (!req.session.carrito) {
            return res.status(400).json({ success: false, message: 'Carrito vacío' });
        }
        
        const carrito = req.session.carrito;
        const producto = carrito.find(item => item.id_producto == id_producto);
        
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        if (cantidad <= 0) {
            carrito.splice(carrito.indexOf(producto), 1);
        } else {
            producto.cantidad = parseInt(cantidad);
        }
        
        res.json({ success: true, message: 'Carrito actualizado' });
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar carrito' });
    }
};

// API: Eliminar producto del carrito
exports.eliminarDelCarrito = (req, res) => {
    try {
        const { id_producto } = req.body;
        
        if (!req.session.carrito) {
            return res.status(400).json({ success: false, message: 'Carrito vacío' });
        }
        
        const carrito = req.session.carrito;
        const index = carrito.findIndex(item => item.id_producto == id_producto);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        carrito.splice(index, 1);
        
        res.json({ success: true, message: 'Producto eliminado del carrito' });
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

// API: Obtener carrito
exports.obtenerCarrito = (req, res) => {
    try {
        const carrito = req.session.carrito || [];
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        res.json({ 
            success: true, 
            carrito: carrito,
            carritoCount: totalItems,
            subtotal: subtotal,
            total: subtotal
        });
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ success: false, message: 'Error al obtener carrito' });
    }
};

// Procesar pedido desde el carrito
exports.realizarPedido = async (req, res) => {
    try {
        const carrito = req.session.carrito || [];
        const userInfo = prepareUserInfo(req.user);
        
        // Validar que el carrito no esté vacío
        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El carrito está vacío. Agrega productos antes de realizar el pedido.' 
            });
        }
        
        // Validar que el usuario tenga información completa
        if (!userInfo || !userInfo.nombre_completo) {
            return res.status(400).json({ 
                success: false, 
                message: 'Información de usuario incompleta. Por favor, completa tu perfil.' 
            });
        }
        
        // Obtener método de pago del cuerpo de la petición
        const { metodo_pago = 'Pendiente' } = req.body;
        
        // La dirección ya no es requerida en el proceso de compra del cliente
        const direccion_completa = '';
        
        // Generar código de envío único usando el mismo formato que admin (E-yyyy/mm/dd-NN)
        const { obtenerSiguienteSecuencial, generarCodigoEnvio } = require('../utils/validations');
        let codigoEnvio;
        try {
            const siguienteSecuencial = await obtenerSiguienteSecuencial();
            codigoEnvio = generarCodigoEnvio(siguienteSecuencial);
        } catch (error) {
            console.error('Error al generar código de envío:', error);
            // Fallback en caso de error
            const fecha = new Date();
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            codigoEnvio = `E-${año}/${mes}/${dia}-01`;
        }
        
        // Calcular precio total
        const precioTotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // Transformar productos del carrito al formato esperado
        // Necesitamos obtener o crear los productos en la base de datos
        const { queryWithRetry } = require('../utils/dbQuery');
        const pool = require('../config/db');
        const products = [];
        
        for (const item of carrito) {
            try {
                let idProducto = null;
                
                try {
                    // Buscar producto por descripción (nombre) en la tabla productos
                    const [productosRows] = await queryWithRetry(
                        'SELECT id_producto FROM productos WHERE descripcion = ? LIMIT 1',
                        [item.nombre]
                    );
                    
                    if (productosRows && productosRows.length > 0) {
                        idProducto = productosRows[0].id_producto;
                    } else {
                        // Si no existe, crear el producto en la base de datos
                        const connection = await pool.getConnection();
                        try {
                            const [insertResult] = await connection.query(
                                'INSERT INTO productos (descripcion, precio) VALUES (?, ?)',
                                [item.nombre, item.precio]
                            );
                            idProducto = insertResult.insertId;
                        } catch (insertError) {
                            console.error(`Error al crear producto ${item.nombre}:`, insertError.message);
                            // Si falla la inserción, intentar usar el código como ID
                            idProducto = parseInt(item.id_producto) || null;
                        } finally {
                            connection.release();
                        }
                    }
                } catch (dbError) {
                    console.warn(`Error al buscar/crear producto ${item.nombre}:`, dbError.message);
                    // Si no hay acceso a BD, intentar usar el código directamente
                    idProducto = parseInt(item.id_producto) || null;
                }
                
                if (idProducto) {
                    products.push({
                        id_producto: idProducto,
                        cantidad: parseInt(item.cantidad) || 1
                    });
                } else {
                    console.warn(`No se pudo obtener ID para producto: ${item.nombre}`);
                }
            } catch (error) {
                console.error(`Error procesando producto ${item.id_producto}:`, error.message);
                // Continuar con el siguiente producto
            }
        }
        
        // Validar que haya al menos un producto válido
        if (products.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se pudieron procesar los productos del carrito. Verifica que los productos existan en el sistema.' 
            });
        }
        
        // Si el método de pago es Tarjeta, guardar información temporal y redirigir a PayPal
        if (metodo_pago === 'Tarjeta') {
            // Guardar información del pedido en sesión para después del pago
            req.session.pedidoPendiente = {
                codigo_envio: codigoEnvio,
                nombre_destinatario: userInfo.nombre_completo,
                direccion_completa: direccion_completa.trim(),
                metodo_pago: metodo_pago,
                precio: precioTotal,
                products: products,
                carrito: carrito
            };
            
            return res.json({ 
                success: true, 
                requierePago: true,
                metodo_pago: 'paypal',
                codigo_envio: codigoEnvio,
                precio: precioTotal,
                message: 'Redirigiendo a PayPal...'
            });
        }
        
        // Crear el envío usando el modelo Envio (para métodos de pago que no requieren PayPal)
        const Envio = require('../models/Envio');
        const nuevoEnvio = {
            codigo_envio: codigoEnvio,
            nombre_destinatario: userInfo.nombre_completo,
            direccion_completa: direccion_completa.trim(),
            estado_envio: 'Solicitud', // Estado especial para solicitudes de clientes
            metodo_pago: metodo_pago,
            precio: precioTotal,
            estado_pago: metodo_pago === 'Efectivo' || metodo_pago === 'Transferencia' ? 'Pendiente' : 'Pagado',
            products: products
        };
        
        await Envio.create(nuevoEnvio);
        
        // Limpiar el carrito después de crear el pedido
        req.session.carrito = [];
        
        // Guardar mensaje de éxito
        req.flash('success_msg', `¡Pedido realizado con éxito! Código de solicitud: ${codigoEnvio}`);
        
        res.json({ 
            success: true, 
            message: 'Pedido realizado con éxito',
            codigo_envio: codigoEnvio,
            redirect: '/pedidos'
        });
        
    } catch (error) {
        console.error('Error al realizar pedido:', error);
        console.error('Stack trace:', error.stack);
        console.error('Carrito:', JSON.stringify(carrito, null, 2));
        console.error('User info:', JSON.stringify(userInfo, null, 2));
        
        res.status(500).json({ 
            success: false, 
            message: 'Error al procesar el pedido. Por favor, intenta nuevamente.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Crear pedido después del pago exitoso con PayPal
exports.crearPedidoDespuesPago = async (req, res) => {
    try {
        const pedidoPendiente = req.session.pedidoPendiente;
        
        if (!pedidoPendiente) {
            return res.status(400).json({ 
                success: false, 
                message: 'No hay pedido pendiente de procesar.' 
            });
        }
        
        const Envio = require('../models/Envio');
        const nuevoEnvio = {
            codigo_envio: pedidoPendiente.codigo_envio,
            nombre_destinatario: pedidoPendiente.nombre_destinatario,
            direccion_completa: pedidoPendiente.direccion_completa,
            estado_envio: 'Solicitud',
            metodo_pago: pedidoPendiente.metodo_pago,
            precio: pedidoPendiente.precio,
            estado_pago: 'Pagado',
            products: pedidoPendiente.products
        };
        
        await Envio.create(nuevoEnvio);
        
        // Limpiar sesión
        req.session.carrito = [];
        req.session.pedidoPendiente = null;
        
        req.flash('success_msg', `¡Pedido realizado y pagado con éxito! Código: ${pedidoPendiente.codigo_envio}`);
        
        res.json({ 
            success: true, 
            message: 'Pedido creado exitosamente',
            codigo_envio: pedidoPendiente.codigo_envio,
            redirect: '/pedidos'
        });
        
    } catch (error) {
        console.error('Error al crear pedido después del pago:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear el pedido después del pago.' 
        });
    }
};
