// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
// Asumimos que tendremos un controlador para manejar la lógica
const envioController = require('../controllers/envioController'); 

// GET /admin/envios        -> Listar y filtrar envíos
router.get('/envios', envioController.listEnvíos); 

// GET /admin/envios/nuevo  -> Mostrar formulario de alta
router.get('/envios/nuevo', envioController.showCreateForm);

// POST /admin/envios       -> Procesar el alta de un nuevo envío (CRUD Create)
router.post('/envios', envioController.createEnvío);

// GET /admin/envios/editar/:id -> Mostrar formulario de edición (con datos cargados)
router.get('/envios/editar/:id', envioController.showEditForm);

// POST /admin/envios/editar/:id -> Procesar la modificación (CRUD Update)
// Usamos POST aquí porque el formulario web no soporta PUT directamente,
// y method-override se encargará de simularlo.
router.post('/envios/editar/:id', envioController.updateEnvío);

// DELETE /admin/envios/eliminar/:id -> Eliminar (CRUD Delete)
// Usamos el verbo DELETE gracias a method-override
router.post('/envios/eliminar/:id', envioController.deleteEnvío);

module.exports = router;
