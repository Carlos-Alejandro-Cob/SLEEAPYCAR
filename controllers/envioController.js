// controllers/envioController.js
const Envio = require('../models/Envio');
const Incidencia = require('../models/Incidencia');


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

// 7. Procesar Creación de Incidencia (con subida de imagen)
exports.createIncidencia = async (req, res) => {
    try {
        // Multer ya ha procesado el archivo y lo ha puesto en req.file
        const { codigo_envio, id_detalle_envio_fk, id_usuario_reporta_fk, tipo_incidencia, observaciones } = req.body;
        let url_foto_evidencia = null;

        if (req.file) {
            // Multer-Cloudinary ya ha subido la imagen y la URL está en req.file.path
            url_foto_evidencia = req.file.path;
        }

        let finalIdDetalle = id_detalle_envio_fk;

        // Si viene el código de envío (texto), buscamos el ID interno
        if (codigo_envio) {
            finalIdDetalle = await Envio.findDetailIdByCodigo(codigo_envio);
            if (!finalIdDetalle) {
                req.flash('error_msg', 'El código de envío no existe.');
                return res.redirect('/admin/incidencias/nueva');
            }
        }

        const nuevaIncidencia = {
            id_detalle_envio_fk: parseInt(finalIdDetalle),
            id_usuario_reporta_fk: parseInt(id_usuario_reporta_fk),
            tipo_incidencia,
            observaciones,
            url_foto_evidencia,
        };

        console.log('Nueva Incidencia a crear:', nuevaIncidencia);
        await Incidencia.create(nuevaIncidencia);

        req.flash('success_msg', 'Incidencia creada con éxito.');
        res.redirect('/admin/incidencias');
    } catch (error) {
        console.error('Error al crear incidencia:', error);
        req.flash('error_msg', `Error al crear la incidencia: ${error.message}`);
        res.redirect('/admin/incidencias/nueva');
    }
};

// 8. Mostrar Formulario de Creación de Incidencia
// 8. Mostrar Formulario de Creación de Incidencia
exports.showCreateIncidenciaForm = (req, res) => {
    res.render('admin/incidenciaForm', {
        incidencia: null,
        isEdit: false
    });
};

// 9. Listar Incidencias
exports.listIncidencias = async (req, res) => {
    try {
        const incidencias = await Incidencia.findAll();
        res.render('admin/incidenciaList', { incidencias });
    } catch (error) {
        console.error('Error al listar incidencias:', error);
        req.flash('error_msg', 'Ocurrió un error al obtener las incidencias.');
        res.redirect('/admin/envios'); // Redirige a envios si falla el listado de incidencias
    }
};

// 10. Mostrar Formulario de Edición de Incidencia
exports.showEditIncidenciaForm = async (req, res) => {
    try {
        const incidencia = await Incidencia.findById(req.params.id);
        if (!incidencia) {
            req.flash('error_msg', 'Incidencia no encontrada.');
            return res.redirect('/admin/incidencias');
        }
        res.render('admin/incidenciaForm', {
            incidencia: incidencia,
            isEdit: true
        });
    } catch (error) {
        console.error('Error al mostrar formulario de edición de incidencia:', error);
        req.flash('error_msg', 'Error al cargar la incidencia.');
        res.redirect('/admin/incidencias');
    }
};

// 11. Procesar Modificación de Incidencia
exports.updateIncidencia = async (req, res) => {
    try {
        const { codigo_envio, id_detalle_envio_fk, id_usuario_reporta_fk, tipo_incidencia, observaciones } = req.body;
        let url_foto_evidencia = null;

        if (req.file) {
            url_foto_evidencia = req.file.path;
        }

        let finalIdDetalle = id_detalle_envio_fk;

        // Si viene el código de envío (texto), buscamos el ID interno
        if (codigo_envio) {
            finalIdDetalle = await Envio.findDetailIdByCodigo(codigo_envio);
            if (!finalIdDetalle) {
                req.flash('error_msg', 'El código de envío no existe.');
                return res.redirect(`/admin/incidencias/${req.params.id}/editar`);
            }
        }

        const datosActualizados = {
            id_detalle_envio_fk: parseInt(finalIdDetalle),
            id_usuario_reporta_fk: parseInt(id_usuario_reporta_fk),
            tipo_incidencia,
            observaciones,
            url_foto_evidencia
        };

        await Incidencia.update(req.params.id, datosActualizados);

        req.flash('success_msg', 'Incidencia actualizada correctamente.');
        res.redirect('/admin/incidencias');
    } catch (error) {
        console.error('Error al actualizar incidencia:', error);
        req.flash('error_msg', 'Error al actualizar la incidencia.');
        res.redirect(`/admin/incidencias/${req.params.id}/editar`);
    }
};

// 12. Procesar Eliminación de Incidencia
exports.deleteIncidencia = async (req, res) => {
    try {
        const affectedRows = await Incidencia.delete(req.params.id);
        if (affectedRows > 0) {
            req.flash('success_msg', 'La incidencia ha sido eliminada.');
        } else {
            req.flash('error_msg', 'No se pudo eliminar la incidencia o no fue encontrada.');
        }
        res.redirect('/admin/incidencias');
    } catch (error) {
        console.error('Error al eliminar incidencia:', error);
        req.flash('error_msg', 'Error al eliminar la incidencia.');
        res.redirect('/admin/incidencias');
    }
};
