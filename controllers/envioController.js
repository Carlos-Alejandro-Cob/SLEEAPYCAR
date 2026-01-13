// controllers/envioController.js
const Envio = require('../models/Envio');
const Incidencia = require('../models/Incidencia');
const { validateCodigoEnvio } = require('../utils/validations');

const ROLES = require('../config/roles');
const logger = require('../utils/logger');


// 1. Listar y Filtrar (CRUD Read)
exports.listEnvíos = async (req, res) => {
    try {
        const { q, estado } = req.query;
        const userRole = req.user ? req.user.id_rol_fk : null;
        
        // Si es bodeguero, por ahora mostrar todos los envíos (no hay asignación por bodega aún)
        // TODO: Implementar filtrado por bodega_id cuando se agregue el campo
        const envios = await Envio.findAll({ q, estado });

        // Determinar si es bodeguero para ajustar la vista
        const isBodeguero = userRole === ROLES.BODEGUERO;

        res.render('admin/list', {
            envios: envios,
            query: q || '',
            estadoFiltro: estado || '',
            isBodeguero: isBodeguero || false
        });
    } catch (error) {
        console.error('Error al listar envíos:', error);
        req.flash('error_msg', 'Ocurrió un error al obtener los envíos.');
        res.redirect('/admin/envios');
    }
};

// 2. Mostrar Formulario de Creación
exports.showCreateForm = (req, res) => {
    const userRole = req.user ? req.user.id_rol_fk : null;
    const isBodeguero = userRole === ROLES.BODEGUERO;
    res.render('admin/form', {
        envio: null, // No hay datos para pre-llenar
        isEdit: false,
        isBodeguero: isBodeguero || false
    });
};

// 3. Procesar Creación (CRUD Create)
exports.createEnvío = async (req, res) => {
    const userRole = req.user.id_rol_fk;
    let {
        ID_Envio,
        Nombre_Destinatario,
        Direccion_Completa,
        Estado_Envio,
        metodo_pago,
        precio,
        estado_pago,
        products // Array of products
    } = req.body;

    if (userRole === ROLES.CLIENTE) { // Cliente
        Estado_Envio = 'Pendiente';
        ID_Envio = 'C-' + Math.random().toString(36).substr(2, 9);
        Nombre_Destinatario = req.user.nombre_completo;
    }

    const errors = [];
    if (!ID_Envio || ID_Envio.trim() === '') {
        errors.push({ msg: 'El ID de Envío es obligatorio.' });
    }
    if (!Nombre_Destinatario || Nombre_Destinatario.trim() === '') {
        errors.push({ msg: 'El Nombre del Destinatario es obligatorio.' });
    }
    if (!Direccion_Completa || Direccion_Completa.trim() === '') {
        errors.push({ msg: 'La Dirección Completa es obligatoria.' });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
        errors.push({ msg: 'Debe agregar al menos un producto.' });
    }
    // Verificar que el precio es un número válido y no negativo
    if (precio === null || precio === '' || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
        errors.push({ msg: 'El Precio debe ser un número válido y positivo.' });
    }

    if (errors.length > 0) {
        // Si hay errores, renderiza el formulario de nuevo con los errores y los datos previos
        return res.render('admin/form', {
            isEdit: false,
            errors: errors, // Pasa el array de errores a la vista
            envio: { // Pasa los datos del formulario para repoblar los campos
                ID_Envio,
                Nombre_Destinatario,
                Direccion_Completa,
                Estado_Envio,
                metodo_pago,
                precio,
                estado_pago,
                products
            }
        });
    }

    try {
        // Validar formato del código de envío (excepto si es cliente que genera su propio código)
        if (userRole !== ROLES.CLIENTE) {
            const validacion = validateCodigoEnvio(ID_Envio);
            if (!validacion.valid) {
                errors.push({ msg: validacion.error });
                return res.render('admin/form', {
                    isEdit: false,
                    errors: errors,
                    envio: {
                        ID_Envio,
                        Nombre_Destinatario,
                        Direccion_Completa,
                        Estado_Envio,
                        metodo_pago,
                        precio,
                        estado_pago,
                        products
                    }
                });
            }
        }

        const nuevoEnvio = {
            codigo_envio: ID_Envio.trim(),
            nombre_destinatario: Nombre_Destinatario.trim(),
            direccion_completa: Direccion_Completa.trim(),
            estado_envio: Estado_Envio || 'Nuevo',
            metodo_pago,
            precio: parseFloat(precio),
            estado_pago,
            products
        };

        await Envio.create(nuevoEnvio);

        req.flash('success_msg', `Envío "${nuevoEnvio.codigo_envio}" creado con éxito.`);
        if (userRole === ROLES.CLIENTE) {
            return res.redirect('/');
        }
        res.redirect('/admin/envios');
    } catch (error) {
        console.error('Error al crear envío:', error);
        req.flash('error_msg', `Error al crear el envío: ${error.message}`);
        if (userRole === ROLES.CLIENTE) {
            return res.redirect('/');
        }
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
        const userRole = req.user ? req.user.id_rol_fk : null;
        const isBodeguero = userRole === ROLES.BODEGUERO;
        res.render('admin/form', {
            envio: envio,
            isEdit: true,
            isBodeguero: isBodeguero || false
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
        const userRole = req.user.id_rol_fk;
        const currentUserId = req.user.id_usuario;
        const { id } = req.params;

        if (userRole === ROLES.REPARTIDOR) { // Transportista
            const { estado_envio, motivo_cancelacion } = req.body;
            
            // Estados permitidos para repartidor
            const estadosPermitidos = ['Entregado', 'Intento de entrega', 'Devuelto a bodega', 'Cancelado en ruta'];
            
            if (!estadosPermitidos.includes(estado_envio)) {
                req.flash('error_msg', 'Estado no válido para repartidor.');
                return res.redirect('/admin/repartidor');
            }
            
            // Si es cancelado, verificar que tenga motivo
            if (estado_envio === 'Cancelado en ruta' && (!motivo_cancelacion || motivo_cancelacion.trim() === '')) {
                req.flash('error_msg', 'Debe proporcionar un motivo para cancelar el envío.');
                return res.redirect('/admin/repartidor');
            }
            
            await Envio.update(id, { estado_envio });

            // Audit Log
            const mensajeLog = motivo_cancelacion 
                ? `Envío ${id} actualizado a "${estado_envio}" por Repartidor. Motivo: ${motivo_cancelacion}`
                : `Envío ${id} actualizado a "${estado_envio}" por Repartidor`;
            await logger.logAction(currentUserId, 'UPDATE_ESTADO_ENVIO', mensajeLog);

            req.flash('success_msg', `Envío actualizado a "${estado_envio}".`);
            // Redirigir al dashboard de repartidor si es repartidor
            return res.redirect('/admin/repartidor');
        }

        if (userRole === ROLES.BODEGUERO) { // Bodeguero - Solo puede cambiar estado logístico
            const { Estado_Envio } = req.body;
            
            // Estados permitidos para bodeguero (logísticos)
            const estadosPermitidos = ['Pendiente', 'Preparado', 'Despachado'];
            
            if (!estadosPermitidos.includes(Estado_Envio)) {
                req.flash('error_msg', 'Estado no válido para bodeguero. Solo puede cambiar a: Pendiente, Preparado o Despachado.');
                return res.redirect(`/admin/envios/${id}/editar`);
            }
            
            await Envio.update(id, { estado_envio: Estado_Envio });

            // Audit Log
            await logger.logAction(currentUserId, 'UPDATE_ESTADO_ENVIO', `Envío ${id} actualizado a "${Estado_Envio}" por Bodeguero`);

            req.flash('success_msg', `Estado del envío actualizado a "${Estado_Envio}".`);
            return res.redirect('/admin/envios');
        }

        const codigoEnvio = req.body.ID_Envio;

        // Validar formato del código de envío
        const validacion = validateCodigoEnvio(codigoEnvio);
        if (!validacion.valid) {
            req.flash('error_msg', validacion.error);
            return res.redirect(`/admin/envios/${id}/editar`);
        }

        const datosActualizados = {
            codigo_envio: codigoEnvio,
            nombre_destinatario: req.body.Nombre_Destinatario,
            direccion_completa: req.body.Direccion_Completa,
            estado_envio: req.body.Estado_Envio,
            metodo_pago: req.body.metodo_pago,
            precio: req.body.precio,
            estado_pago: req.body.estado_pago,
            products: req.body.products
        };

        await Envio.update(id, datosActualizados);

        // Audit Log
        await logger.logAction(currentUserId, 'UPDATE_ENVIO', `Actualización completa del envío ${datosActualizados.codigo_envio}`);

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
    const { codigo_envio, tipo_incidencia, observaciones } = req.body;
    const id_usuario_reporta_fk = req.user ? req.user.id_usuario : req.body.id_usuario_reporta_fk;

    const errors = [];

    // 1. Validaciones básicas de campos
    if (!tipo_incidencia || tipo_incidencia.trim() === '') {
        errors.push({ msg: 'El tipo de incidencia es obligatorio.' });
    }
    if (!observaciones || observaciones.trim() === '') {
        errors.push({ msg: 'Las observaciones son obligatorias.' });
    }
    if (!codigo_envio || codigo_envio.trim() === '') {
        errors.push({ msg: 'El Código de Envío es obligatorio.' });
    }
    if (!id_usuario_reporta_fk) {
        errors.push({ msg: 'No se pudo identificar al usuario que reporta. Por favor, inicia sesión de nuevo.' });
    }

    // 2. Si hay errores básicos, retornar antes de consultar la BD
    if (errors.length > 0) {
        return res.render('admin/incidenciaForm', {
            isEdit: false,
            errors: errors,
            incidencia: { codigo_envio, tipo_incidencia, observaciones }
        });
    }

    try {
        // 3. Validación contra la base de datos (verificar si el envío existe)
        const finalIdDetalle = await Envio.findDetailIdByCodigo(codigo_envio.trim());
        if (!finalIdDetalle) {
            errors.push({ msg: 'El código de envío proporcionado no existe.' });
            return res.render('admin/incidenciaForm', {
                isEdit: false,
                errors: errors,
                incidencia: { codigo_envio, tipo_incidencia, observaciones }
            });
        }

        // Validar formato del código de envío
        const validacion = validateCodigoEnvio(codigo_envio.trim());
        if (!validacion.valid) {
            errors.push({ msg: validacion.error });
            return res.render('admin/incidenciaForm', {
                isEdit: false,
                errors: errors,
                incidencia: { codigo_envio, tipo_incidencia, observaciones }
            });
        }

        let url_foto_evidencia = null;
        if (req.file) {
            url_foto_evidencia = req.file.path;
        }

        const nuevaIncidencia = {
            id_detalle_envio_fk: parseInt(finalIdDetalle),
            id_usuario_reporta_fk: parseInt(id_usuario_reporta_fk),
            tipo_incidencia: tipo_incidencia.trim(),
            observaciones: observaciones.trim(),
            url_foto_evidencia,
        };

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
        const { codigo_envio, id_detalle_envio_fk, tipo_incidencia, observaciones } = req.body;
        const id_usuario_reporta_fk = req.user ? req.user.id_usuario : req.body.id_usuario_reporta_fk;
        let url_foto_evidencia = null;

        if (req.file) {
            url_foto_evidencia = req.file.path;
        }

        // Validar formato del código de envío si se proporciona
        if (codigo_envio) {
            const validacion = validateCodigoEnvio(codigo_envio);
            if (!validacion.valid) {
                req.flash('error_msg', validacion.error);
                return res.redirect(`/admin/incidencias/${req.params.id}/editar`);
            }
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

// 13. Mostrar vista de rastreo para transportista
exports.showAdminSearch = (req, res) => {
    res.render('admin/rastreo');
};

// 14. Mostrar dashboard para repartidor
// 14. Mostrar dashboard para repartidor
exports.showRepartidorDashboard = async (req, res) => {
    try {
        // Obtener ruta desde la BD
        const ruta = await Envio.findAll({ id_repartidor: req.user.id_usuario, estado: 'NO_ENTREGADO' });
        res.render('admin/repartidor', { ruta });
    } catch (error) {
        console.error('Error al cargar dashboard repartidor:', error);
        req.flash('error_msg', 'Error al cargar la ruta.');
        res.redirect('/');
    }
};

// 15. Agregar envío a la ruta del repartidor
exports.addEnvioToRuta = async (req, res) => {
    const { codigo_envio } = req.body;
    const id_usuario = req.user.id_usuario;

    try {
        const envios = await Envio.findAll({ q: codigo_envio, estado: null });
        if (envios.length > 0) {
            const envio = envios[0];

            // Asignar en BD permanentemente
            await Envio.update(envio._id, { id_repartidor: id_usuario });

            // Audit Log
            await logger.logAction(id_usuario, 'ASIGNAR_RUTA', `Envío ${envio.ID_Envio} asignado a repartidor ${req.user.nombre_usuario}`);

            req.flash('success_msg', 'Envío asignado a tu ruta.');
        } else {
            req.flash('error_msg', 'No se encontró el envío.');
        }
        res.redirect('/admin/repartidor');
    } catch (error) {
        console.error('Error al agregar envío a la ruta:', error);
        req.flash('error_msg', 'Error al agregar el envío a la ruta.');
        res.redirect('/admin/repartidor');
    }
};
