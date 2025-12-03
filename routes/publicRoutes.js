const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const paymentController = require('../controllers/paymentController');

// Tracking Routes
router.get('/rastreo', publicController.showSearch);
router.post('/rastreo/buscar', publicController.processSearch);
router.get('/rastreo/:id', publicController.showDetails);

// Payment API Routes
router.post('/api/pagos/paypal/create-order', paymentController.createPaypalOrder);
router.post('/api/pagos/paypal/capture-order', paymentController.capturePaypalOrder);
router.post('/api/pagos/mercadopago/create-preference', paymentController.createMercadoPagoPreference);

module.exports = router;
