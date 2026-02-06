// routes/mobileRoutes.js
const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkRole } = require('../middleware/authorization');
const ROLES = require('../config/roles');

// API: Login para Flutter
router.post('/api/login', mobileController.loginMobile);

// API: Logout para Flutter
router.post('/api/logout', ensureAuthenticated, mobileController.logoutMobile);

// API: Obtener lista de envíos para repartidor (para Flutter)
router.get('/api/envios', 
    ensureAuthenticated, 
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), 
    mobileController.getEnviosRepartidor
);

// API: Obtener detalles de un envío
router.get('/api/envio/:id', 
    ensureAuthenticated, 
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), 
    mobileController.getEnvioDetalle
);

// API: Buscar producto por código
router.post('/api/producto/buscar', 
    ensureAuthenticated, 
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), 
    mobileController.buscarProductoPorCodigo
);

// API: Marcar producto como entregado
router.post('/api/producto/entregar', 
    ensureAuthenticated, 
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), 
    mobileController.marcarProductoEntregado
);

// API: Obtener estado de productos entregados
router.get('/api/envio/:id/estado', 
    ensureAuthenticated, 
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), 
    mobileController.getEstadoProductos
);

// API: Agregar envío a la ruta con código del bodeguero
router.post('/api/envios/agregar-ruta',
    ensureAuthenticated,
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]),
    mobileController.agregarEnvioARuta
);

// API: Confirmar entrega al cliente con código del cliente
router.post('/api/envio/:id/confirmar-entrega',
    ensureAuthenticated,
    checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]),
    mobileController.confirmarEntregaCliente
);

module.exports = router;
