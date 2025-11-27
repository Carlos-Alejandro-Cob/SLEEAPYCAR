// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const envioController = require('../controllers/envioController');
const { ensureAuthenticated } = require('../middleware/auth');
const upload = require('../utils/multerConfig'); // Importa la instancia de multer configurada

// --- RUTAS CRUD PARA ENVÍOS ---

// [R]EAD: Listar todos los envíos (con filtros)
router.get('/envios', ensureAuthenticated, envioController.listEnvíos);

// [C]REATE: Mostrar formulario para nuevo envío
router.get('/envios/nuevo', ensureAuthenticated, envioController.showCreateForm);

// [C]REATE: Procesar el formulario y crear el nuevo envío
router.post('/envios', ensureAuthenticated, envioController.createEnvío);

// [R]EAD: Mostrar formulario para editar un envío específico
router.get('/envios/:id/editar', ensureAuthenticated, envioController.showEditForm);

// [U]PDATE: Procesar la modificación de un envío
router.put('/envios/:id', ensureAuthenticated, envioController.updateEnvío);

// [D]ELETE: Eliminar un envío
router.delete('/envios/:id', ensureAuthenticated, envioController.deleteEnvío);

// --- RUTAS PARA INCIDENCIAS ---

// [R]EAD: Listar todas las incidencias
router.get('/incidencias', ensureAuthenticated, envioController.listIncidencias);

// [C]REATE: Mostrar formulario para nueva incidencia
router.get('/incidencias/nueva', ensureAuthenticated, envioController.showCreateIncidenciaForm);

// [C]REATE: Procesar la creación de una nueva incidencia con subida de imagen
router.post('/incidencias', ensureAuthenticated, upload.single('foto_evidencia'), envioController.createIncidencia);

module.exports = router;
