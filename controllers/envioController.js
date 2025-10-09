// controllers/envioController.js
const Envio = require('../models/Envio');

// 1. Listar y Filtrar (CRUD Read)
exports.listEnvíos = async (req, res) => {
    try {
        const { q, estado } = req.query;
        const envios = await Envio.findAll({ q, estado });
        
        res.render('admin/list', {
            envios: envios,
            query: q || '',
            estadoFiltro: estado || ''
        });
    } catch (error) {
        console.error('Error al listar envíos:', error);
        req.flash('error_msg', 'Ocurrió un error al obtener los envíos.');
        res.redirect('/admin/envios');
    }
};

// 2. Mostrar Formulario de Creación
exports.showCreateForm = (req, res) => {
    res.render('admin/form', {
        envio: null, // No hay datos para pre-llenar
        isEdit: false
    });
};

// 3. Procesar Creación (CRUD Create)
exports.createEnvío = async (req, res) => {
    try {
        const nuevoEnvio = {
            codigo_envio: req.body.ID_Envio,
            nombre_destinatario: req.body.Nombre_Destinatario,
            direccion_completa: req.body.Direccion_Completa,
            estado_envio: req.body.Estado_Envio || 'En Espera'
        };
        
        await Envio.create(nuevoEnvio);
        
        req.flash('success_msg', `Envío "${nuevoEnvio.codigo_envio}" creado con éxito.`);
        res.redirect('/admin/envios');
    } catch (error) {
        console.error('Error al crear envío:', error);
        req.flash('error_msg', 'Error al crear el envío. Revisa los datos.');
        res.redirect('/admin/envios/nuevo');
    }
};

// 4. Mostrar Formulario de Edición
exports.showEditForm = async (req, res) => {
    try {
        const envio = await Envio.findById(req.params.id);
        if (!envio) {
            req.flash('error_msg', 'Envío no encontrado.');
            return res.redirect('/admin/envios');
        }
        res.render('admin/form', {
            envio: envio,
            isEdit: true
        });
    } catch (error) {
        console.error('Error al mostrar formulario de edición:', error);
        req.flash('error_msg', 'Error al cargar el envío.');
        res.redirect('/admin/envios');
    }
};

// 5. Procesar Modificación (CRUD Update)
exports.updateEnvío = async (req, res) => {
    try {
        const datosActualizados = {
            codigo_envio: req.body.ID_Envio,
            nombre_destinatario: req.body.Nombre_Destinatario,
            direccion_completa: req.body.Direccion_Completa,
            estado_envio: req.body.Estado_Envio
        };
        
        await Envio.update(req.params.id, datosActualizados);
        
        req.flash('success_msg', `Envío "${datosActualizados.codigo_envio}" actualizado correctamente.`);
        res.redirect('/admin/envios');
    } catch (error) {
        console.error('Error al actualizar envío:', error);
        req.flash('error_msg', 'Error al actualizar el envío.');
        res.redirect(`/admin/envios/${req.params.id}/editar`);
    }
};

// 6. Procesar Eliminación (CRUD Delete - Baja Lógica)
exports.deleteEnvío = async (req, res) => {
    try {
        const affectedRows = await Envio.remove(req.params.id);
        if (affectedRows > 0) {
            req.flash('success_msg', 'El envío ha sido eliminado.');
        } else {
            req.flash('error_msg', 'No se pudo eliminar el envío o no fue encontrado.');
        }
        res.redirect('/admin/envios');
    } catch (error) {
        console.error('Error al eliminar envío:', error);
        req.flash('error_msg', 'Error al eliminar el envío. Es posible que tenga datos asociados.');
        res.redirect('/admin/envios');
    }
};
