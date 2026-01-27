// controllers/envioController.js
const Envio = require('../models/Envio');
const Incidencia = require('../models/Incidencia');
const CodigoConfirmacion = require('../models/CodigoConfirmacion');
const { validateCodigoEnvio, generarCodigoEnvio, obtenerSiguienteSecuencial } = require('../utils/validations');

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
exports.showCreateForm = async (req, res) => {
    const userRole = req.user ? req.user.id_rol_fk : null;
    const isBodeguero = userRole === ROLES.BODEGUERO;
    
    // El bodeguero no puede crear envíos, solo editarlos
    if (isBodeguero) {
        req.flash('error_msg', 'No tiene permisos para crear envíos. Solo puede editar envíos existentes.');
        return res.redirect('/admin/envios');
    }
    
    // Generar código automático para admin (no para cliente)
    let codigoAuto = null;
    if (userRole !== ROLES.CLIENTE) {
        try {
            const siguienteSecuencial = await obtenerSiguienteSecuencial();
            codigoAuto = generarCodigoEnvio(siguienteSecuencial);
        } catch (error) {
            console.error('Error al generar código automático:', error);
        }
    }
    
    res.render('admin/form', {
        envio: codigoAuto ? { ID_Envio: codigoAuto } : null, // Pre-llenar con código generado
        isEdit: false,
        isBodeguero: false // Bodeguero no puede crear, así que siempre será false aquí
    });
};

// 3. Procesar Creación (CRUD Create)
exports.createEnvío = async (req, res) => {
    const userRole = req.user.id_rol_fk;
    
    // El bodeguero no puede crear envíos, solo editarlos
    if (userRole === ROLES.BODEGUERO) {
        req.flash('error_msg', 'No tiene permisos para crear envíos. Solo puede editar envíos existentes.');
        return res.redirect('/admin/envios');
    }
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
        // Generar código usando el mismo formato que admin (E-yyyy/mm/dd-NN)
        try {
            const siguienteSecuencial = await obtenerSiguienteSecuencial();
            ID_Envio = generarCodigoEnvio(siguienteSecuencial);
        } catch (error) {
            console.error('Error al generar código automático para cliente:', error);
            // Fallback en caso de error
            const fecha = new Date();
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            ID_Envio = `E-${año}/${mes}/${dia}-01`;
        }
        Nombre_Destinatario = req.user.nombre_completo;
    } else {
        // Para admin y otros roles: generar automáticamente el ID si no se proporciona
        if (!ID_Envio || ID_Envio.trim() === '') {
            try {
                const siguienteSecuencial = await obtenerSiguienteSecuencial();
                ID_Envio = generarCodigoEnvio(siguienteSecuencial);
            } catch (error) {
                console.error('Error al generar código automático:', error);
                const errors = [{ msg: 'Error al generar el código de envío automático.' }];
                return res.render('admin/form', {
                    isEdit: false,
                    errors: errors,
                    envio: { Nombre_Destinatario, Direccion_Completa, Estado_Envio, metodo_pago, precio, estado_pago, products }
                });
            }
        }
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
        // Validar formato del código de envío (ahora todos usan el mismo formato E-yyyy/mm/dd-NN)
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
            const { estado_envio, motivo_cancelacion, codigo_confirmacion } = req.body;

            // Estados permitidos para repartidor
            const estadosPermitidos = ['En envío', 'Entregado', 'Intento de entrega', 'Devuelto a bodega', 'Cancelado en ruta'];

            if (!estadosPermitidos.includes(estado_envio)) {
                req.flash('error_msg', 'Estado no válido para repartidor.');
                return res.redirect('/admin/repartidor');
            }

            let estadoFinal = estado_envio;

            // Si el chofer marca "En envío", requiere código del bodeguero y cambia automáticamente a "En reparto"
            if (estado_envio === 'En envío') {
                if (!codigo_confirmacion || codigo_confirmacion.trim() === '') {
                    req.flash('error_msg', 'Debe ingresar el código de confirmación proporcionado por el bodeguero.');
                    return res.redirect('/admin/repartidor');
                }

                let validacion;
                try {
                    validacion = await CodigoConfirmacion.validarYUsar(codigo_confirmacion.trim(), id, currentUserId);
                } catch (error) {
                    if (error.code === 'ER_NO_SUCH_TABLE') {
                        req.flash('error_msg', 'La tabla de códigos de confirmación no existe. Por favor, ejecute el script SQL: scripts/create_codigos_confirmacion.sql');
                        return res.redirect('/admin/repartidor');
                    }
                    throw error;
                }
                
                if (!validacion.valido) {
                    req.flash('error_msg', validacion.mensaje);
                    return res.redirect('/admin/repartidor');
                }

                if (validacion.tipo !== 'BODEGUERO_CHOFER') {
                    req.flash('error_msg', 'El código ingresado no es válido para este proceso.');
                    return res.redirect('/admin/repartidor');
                }
                
                // Cambiar automáticamente a "En reparto"
                estadoFinal = 'En reparto';
            }

            // Si el chofer marca "Entregado", requiere código del cliente y cambia automáticamente
            if (estado_envio === 'Entregado') {
                if (!codigo_confirmacion || codigo_confirmacion.trim() === '') {
                    req.flash('error_msg', 'Debe ingresar el código de confirmación proporcionado por el cliente.');
                    return res.redirect('/admin/repartidor');
                }

                let validacion;
                try {
                    validacion = await CodigoConfirmacion.validarYUsar(codigo_confirmacion.trim(), id, currentUserId);
                } catch (error) {
                    if (error.code === 'ER_NO_SUCH_TABLE') {
                        req.flash('error_msg', 'La tabla de códigos de confirmación no existe. Por favor, ejecute el script SQL: scripts/create_codigos_confirmacion.sql');
                        return res.redirect('/admin/repartidor');
                    }
                    throw error;
                }
                
                if (!validacion.valido) {
                    req.flash('error_msg', validacion.mensaje);
                    return res.redirect('/admin/repartidor');
                }

                if (validacion.tipo !== 'CLIENTE_CHOFER') {
                    req.flash('error_msg', 'El código ingresado no es válido para confirmar la entrega.');
                    return res.redirect('/admin/repartidor');
                }
                // Ya está en "Entregado", se mantiene
                estadoFinal = 'Entregado';
            }

            // Si es cancelado, verificar que tenga motivo
            if (estadoFinal === 'Cancelado en ruta' && (!motivo_cancelacion || motivo_cancelacion.trim() === '')) {
                req.flash('error_msg', 'Debe proporcionar un motivo para cancelar el envío.');
                return res.redirect('/admin/repartidor');
            }

            await Envio.update(id, { estado_envio: estadoFinal });

            // Audit Log
            const mensajeLog = motivo_cancelacion
                ? `Envío ${id} actualizado a "${estadoFinal}" por Repartidor. Motivo: ${motivo_cancelacion}`
                : `Envío ${id} actualizado a "${estadoFinal}" por Repartidor`;
            await logger.logAction(currentUserId, 'UPDATE_ESTADO_ENVIO', mensajeLog);

            req.flash('success_msg', `Envío actualizado a "${estadoFinal}".`);
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

            // Si el estado es "Despachado", automáticamente cambiar a "En reparto"
            let estadoFinal = Estado_Envio;
            if (Estado_Envio === 'Despachado') {
                estadoFinal = 'En reparto';
                // Generar código de confirmación para el chofer
                try {
                    const codigoData = await CodigoConfirmacion.generar(id, 'BODEGUERO_CHOFER', currentUserId);
                    try {
                        await logger.logAction(currentUserId, 'GENERAR_CODIGO', `Código de confirmación ${codigoData.codigo} generado para envío ${id}`);
                    } catch (logError) {
                        console.warn('Error al registrar en log:', logError.message);
                    }
                    req.flash('success_msg', `Envío despachado. Estado actualizado automáticamente a "En reparto". Código de confirmación para el chofer: <strong>${codigoData.codigo}</strong>`);
                } catch (error) {
                    if (error.code === 'ER_NO_SUCH_TABLE') {
                        req.flash('warning_msg', `Estado actualizado a "En reparto". La tabla de códigos no existe.`);
                    } else {
                        console.error('Error al generar código:', error);
                        req.flash('success_msg', `Estado actualizado a "En reparto". Error al generar código de confirmación.`);
                    }
                }
            } else {
                req.flash('success_msg', `Estado del envío actualizado a "${Estado_Envio}".`);
            }

            await Envio.update(id, { estado_envio: estadoFinal });

            // Audit Log
            await logger.logAction(currentUserId, 'UPDATE_ESTADO_ENVIO', `Envío ${id} actualizado a "${estadoFinal}" por Bodeguero`);

            return res.redirect('/admin/envios');
        }

        const estadoEnvio = req.body.Estado_Envio;

        // Obtener el envío actual para mantener precio y otros campos
        const envioActual = await Envio.findById(id);
        
        // Log para depuración
        console.log('[UPDATE_ENVIO] Datos recibidos:', {
            id,
            estadoEnvio,
            ID_Envio_body: req.body.ID_Envio,
            ID_Envio_actual: envioActual.ID_Envio,
            metodo_pago: req.body.metodo_pago,
            estado_pago: req.body.estado_pago
        });
        
        // Validar que el admin solo pueda cambiar a "Aceptado" o "Rechazado"
        if (estadoEnvio !== 'Aceptado' && estadoEnvio !== 'Rechazado') {
            req.flash('error_msg', 'El administrador solo puede cambiar el estado a "Aceptado" o "Rechazado".');
            return res.redirect(`/admin/envios/${id}/editar`);
        }
        
        // En modo edición, solo actualizar los campos que pueden cambiar (estado, método de pago, estado de pago)
        // NO actualizar: código_envio, nombre_destinatario, direccion_completa, precio (son informativos o no editables)
        const datosActualizados = {
            // No incluir codigo_envio - no se actualiza en modo edición
            estado_envio: estadoEnvio,
            metodo_pago: req.body.metodo_pago,
            estado_pago: req.body.estado_pago
            // No incluir products aquí - se manejan por separado si es necesario
        };
        
        // Solo incluir products si se proporcionan explícitamente y es un array válido
        if (req.body.products && Array.isArray(req.body.products) && req.body.products.length > 0) {
            datosActualizados.products = req.body.products;
        }
        
        console.log('[UPDATE_ENVIO] Datos a actualizar:', datosActualizados);

        await Envio.update(id, datosActualizados);

        // Audit Log
        await logger.logAction(currentUserId, 'UPDATE_ENVIO', `Actualización completa del envío ${envioActual.ID_Envio}`);

        req.flash('success_msg', `Envío "${envioActual.ID_Envio}" actualizado correctamente.`);
        res.redirect('/admin/envios');
    } catch (error) {
        console.error('Error al actualizar envío:', error);
        
        // Mensaje de error más específico
        let mensajeError = 'Error al actualizar el envío.';
        if (error.code === 'ER_DUP_ENTRY') {
            mensajeError = 'El código de envío ya existe en el sistema. Por favor, contacta al administrador.';
        } else if (error.message) {
            mensajeError = `Error: ${error.message}`;
        }
        
        req.flash('error_msg', mensajeError);
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
    const { codigo_envio, codigo_confirmacion } = req.body;
    const id_usuario = req.user.id_usuario;

    try {
        // Validar que se proporcione el código de confirmación
        if (!codigo_confirmacion || codigo_confirmacion.trim() === '') {
            req.flash('error_msg', 'Debe ingresar el código de confirmación proporcionado por el bodeguero.');
            return res.redirect('/admin/repartidor');
        }

        // Buscar envío por código. Para asignación, idealmente no debería tener repartidor o no estar entregado.
        // El modelo Envio.findAll soporta 'NO_ENTREGADO' como filtro especial.
        const envios = await Envio.findAll({ q: codigo_envio, estado: 'NO_ENTREGADO' });
        if (envios.length === 0) {
            req.flash('error_msg', 'No se encontró el envío.');
            return res.redirect('/admin/repartidor');
        }

        const envio = envios[0];

        // Validar el código de confirmación
        let validacion;
        try {
            validacion = await CodigoConfirmacion.validarYUsar(codigo_confirmacion.trim(), envio._id, id_usuario);
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                req.flash('error_msg', 'El sistema de códigos no está configurado. Contacte al administrador.');
                return res.redirect('/admin/repartidor');
            }
            throw error;
        }
        
        if (!validacion.valido) {
            req.flash('error_msg', validacion.mensaje);
            return res.redirect('/admin/repartidor');
        }

        // Verificar que el código sea del tipo correcto (BODEGUERO_CHOFER)
        if (validacion.tipo !== 'BODEGUERO_CHOFER') {
            req.flash('error_msg', 'El código ingresado no es válido para asignar este envío.');
            return res.redirect('/admin/repartidor');
        }

        // Asignar en BD permanentemente y cambiar estado a "En Ruta"
        await Envio.update(envio._id, { 
            id_repartidor: id_usuario,
            estado_envio: 'En Ruta'
        });

        // Audit Log
        await logger.logAction(id_usuario, 'ASIGNAR_RUTA', `Envío ${envio.ID_Envio} asignado a repartidor ${req.user.nombre_usuario} y estado cambiado a "En Ruta"`);

        req.flash('success_msg', `Envío ${envio.ID_Envio} asignado a tu ruta. Estado actualizado a "En Ruta".`);
        res.redirect('/admin/repartidor');
    } catch (error) {
        console.error('Error al agregar envío a la ruta:', error);
        req.flash('error_msg', 'Error al agregar el envío a la ruta.');
        res.redirect('/admin/repartidor');
    }
};

// 16. API: Generar código de confirmación para bodeguero
exports.generarCodigoBodeguero = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id_usuario;
        const userRole = req.user.id_rol_fk;

        // Verificar que sea bodeguero
        if (userRole !== ROLES.BODEGUERO) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para generar códigos'
            });
        }

        // Verificar que el envío existe
        const envio = await Envio.findById(id);
        if (!envio) {
            return res.status(404).json({
                success: false,
                message: 'Envío no encontrado'
            });
        }

        // Generar código
        // Generar código usando la tabla codigos_confirmacion
        const codigoData = await CodigoConfirmacion.generar(id, 'BODEGUERO_CHOFER', currentUserId);
        
        // Audit Log
        await logger.logAction(currentUserId, 'GENERAR_CODIGO', `Código de confirmación ${codigoData.codigo} generado para envío ${id}`);

        res.json({
            success: true,
            codigo: codigoData.codigo,
            message: 'Código generado exitosamente'
        });
    } catch (error) {
        console.error('Error al generar código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar el código: ' + error.message
        });
    }
};

// 17. API: Cancelar código de confirmación para bodeguero
exports.cancelarCodigoBodeguero = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id_usuario;
        const userRole = req.user.id_rol_fk;

        // Verificar que sea bodeguero
        if (userRole !== ROLES.BODEGUERO) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para cancelar códigos'
            });
        }

        // Verificar que el envío existe
        const envio = await Envio.findById(id);
        if (!envio) {
            return res.status(404).json({
                success: false,
                message: 'Envío no encontrado'
            });
        }

        // Cancelar código activo si existe
        // Cancelar código usando la tabla codigos_confirmacion
        const resultado = await CodigoConfirmacion.cancelarCodigoActivo(id, 'BODEGUERO_CHOFER', currentUserId);
        
        if (!resultado.cancelado) {
            return res.status(400).json({
                success: false,
                message: resultado.mensaje
            });
        }

        // Audit Log
        await logger.logAction(currentUserId, 'CANCELAR_CODIGO', `Código de confirmación ${resultado.codigo} cancelado para envío ${id}`);

        res.json({
            success: true,
            message: 'Código cancelado exitosamente'
        });
    } catch (error) {
        console.error('Error al cancelar código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar el código: ' + error.message
        });
    }
};
