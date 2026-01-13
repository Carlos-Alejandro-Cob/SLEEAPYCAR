const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const paymentController = require('../controllers/paymentController');
const productController = require('../controllers/productController');
const customerController = require('../controllers/customerController');
const { ensureAuthenticated } = require('../middleware/auth');

// Customer Dashboard - Redirigir a catálogo por defecto
// Customer Dashboard - Redirigir a catálogo por defecto
// La ruta '/' ya no se maneja aquí, se delega a app.js para redirección inteligente
router.get('/catalogo', ensureAuthenticated, customerController.showCatalogo);
router.get('/pedidos', ensureAuthenticated, customerController.showPedidos);
router.get('/carrito', ensureAuthenticated, customerController.showCarrito);

// Tracking Routes
router.get('/rastreo', publicController.showSearch);
router.post('/rastreo/buscar', publicController.processSearch);
router.get('/rastreo/:id', publicController.showDetails);

// Payment API Routes
router.post('/api/pagos/paypal/create-order', paymentController.createPaypalOrder);
router.post('/api/pagos/paypal/capture-order', paymentController.capturePaypalOrder);
router.post('/api/pagos/mercadopago/create-preference', paymentController.createMercadoPagoPreference);

// Product API
router.get('/api/products/:id', productController.getProductById);

// Cart API Routes
router.post('/api/carrito/agregar', ensureAuthenticated, customerController.agregarAlCarrito);
router.post('/api/carrito/actualizar', ensureAuthenticated, customerController.actualizarCarrito);
router.post('/api/carrito/eliminar', ensureAuthenticated, customerController.eliminarDelCarrito);
router.get('/api/carrito', ensureAuthenticated, customerController.obtenerCarrito);
router.post('/api/carrito/realizar-pedido', ensureAuthenticated, customerController.realizarPedido);
router.post('/api/carrito/crear-despues-pago', ensureAuthenticated, customerController.crearPedidoDespuesPago);

module.exports = router;
