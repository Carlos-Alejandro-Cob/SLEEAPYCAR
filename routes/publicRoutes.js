const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const paymentController = require('../controllers/paymentController');
const productController = require('../controllers/productController');
const customerController = require('../controllers/customerController');
const { ensureAuthenticated } = require('../middleware/auth');

// Customer Dashboard
router.get('/', ensureAuthenticated, customerController.showDashboard);

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

module.exports = router;
