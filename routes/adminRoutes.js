// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const envioController = require('../controllers/envioController');
const userController = require('../controllers/userController');
const { checkRole } = require('../middleware/authorization');
const upload = require('../utils/multerConfig'); // Importa la instancia de multer configurada
const ROLES = require('../config/roles');

// --- RUTAS CRUD PARA ENVÍOS ---

// [R]EAD: Listar todos los envíos (con filtros)
router.get('/envios', checkRole([ROLES.ADMIN, ROLES.BODEGUERO, ROLES.SUCURSAL, ROLES.SUPER_ADMIN]), envioController.listEnvíos);

// [C]REATE: Mostrar formulario para nuevo envío (Bodeguero NO puede crear, solo admin)
router.get('/envios/nuevo', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), envioController.showCreateForm);

// [C]REATE: Procesar el formulario y crear el nuevo envío (Bodeguero NO puede crear, solo admin)
router.post('/envios', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), envioController.createEnvío);

// [R]EAD: Mostrar formulario para editar un envío específico
router.get('/envios/:id/editar', checkRole([1, 2, 6]), envioController.showEditForm);

// [U]PDATE: Procesar la modificación de un envío
router.put('/envios/:id', checkRole([ROLES.ADMIN, ROLES.BODEGUERO, ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), envioController.updateEnvío);

// [D]ELETE: Eliminar un envío (Bodeguero NO puede eliminar)
router.delete('/envios/:id', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), envioController.deleteEnvío);

// --- RUTAS PARA INCIDENCIAS ---

// [R]EAD: Listar todas las incidencias
router.get('/incidencias', checkRole([ROLES.ADMIN, ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), envioController.listIncidencias);

// [C]REATE: Mostrar formulario para nueva incidencia
router.get('/incidencias/nueva', checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), envioController.showCreateIncidenciaForm);

// [C]REATE: Procesar la creación de una nueva incidencia con subida de imagen
router.post('/incidencias', checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), upload.single('foto_evidencia'), envioController.createIncidencia);

// [R]EAD: Mostrar formulario para editar una incidencia
router.get('/incidencias/:id/editar', checkRole([ROLES.ADMIN, ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), envioController.showEditIncidenciaForm);

// [U]PDATE: Procesar la modificación de una incidencia
router.put('/incidencias/:id', checkRole([ROLES.ADMIN, ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), upload.single('foto_evidencia'), envioController.updateIncidencia);

// [D]ELETE: Eliminar una incidencia
router.delete('/incidencias/:id', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), envioController.deleteIncidencia);

// --- RUTAS PARA GESTIÓN DE USUARIOS ---
router.get('/users', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), userController.listUsers);
router.get('/users/nuevo', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), userController.showCreateUserForm);
router.post('/users', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), userController.createUser);
router.get('/users/:id/editar', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), userController.showEditUserForm);
router.put('/users/:id', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), userController.updateUser);
router.delete('/users/:id', checkRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), userController.deleteUser);


// --- RUTA PARA REPARTIDOR ---
router.get('/repartidor', checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), envioController.showRepartidorDashboard);
router.post('/repartidor/ruta', checkRole([ROLES.REPARTIDOR, ROLES.SUPER_ADMIN]), envioController.addEnvioToRuta);

// --- API RUTAS PARA CÓDIGOS DE CONFIRMACIÓN (BODEGUERO) ---
router.post('/api/envios/:id/generar-codigo', checkRole([ROLES.BODEGUERO, ROLES.SUPER_ADMIN]), envioController.generarCodigoBodeguero);
router.post('/api/envios/:id/generar-codigo-sucursal', checkRole([ROLES.SUCURSAL, ROLES.SUPER_ADMIN]), envioController.generarCodigoSucursal);
router.post('/api/envios/:id/cancelar-codigo', checkRole([ROLES.BODEGUERO, ROLES.SUPER_ADMIN]), envioController.cancelarCodigoBodeguero);

// --- API VALIDACIÓN CÓDIGO DE SEGURIDAD (REPARTIDOR / ADMIN) ---
router.post('/api/envios/:id/validar-codigo-seguridad', checkRole([ROLES.REPARTIDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]), envioController.validarCodigoSeguridad);
router.post('/api/envios/:id/confirmar-entrega', checkRole([ROLES.REPARTIDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]), envioController.confirmarEntrega);


module.exports = router;
