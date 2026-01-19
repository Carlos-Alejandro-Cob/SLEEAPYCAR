const Envio = require('../models/Envio');
const CodigoConfirmacion = require('../models/CodigoConfirmacion');

exports.showSearch = (req, res) => {
    res.render('public/search', {
        title: 'Rastreo de Envíos',
        error: null,
        layout: 'public/layout'
    });
};

exports.processSearch = async (req, res) => {
    const { codigo } = req.body;
    try {
        // Usamos findDetailIdByCodigo para verificar si existe, pero necesitamos el objeto completo
        // Como Envio.findAll busca por código parcial, podemos usarlo o crear un método específico
        // Por ahora usaremos findAll con filtro exacto si es posible, o filtramos en memoria (menos eficiente pero rápido para MVP)

        const envios = await Envio.findAll({ q: codigo });
        // Buscamos coincidencia exacta
        const envio = envios.find(e => e.ID_Envio === codigo);

        if (envio) {
            res.redirect(`/rastreo/${envio._id}`);
        } else {
            res.render('public/search', {
                title: 'Rastreo de Envíos',
                error: 'No se encontró ningún envío con ese código.',
                layout: 'public/layout'
            });
        }
    } catch (error) {
        console.error(error);
        res.render('public/search', {
            title: 'Rastreo de Envíos',
            error: 'Ocurrió un error al buscar el envío.',
            layout: 'public/layout'
        });
    }
};

exports.showDetails = async (req, res) => {
    const { id } = req.params;
    const { status, collection_status, payment_id } = req.query;

    try {
        let envio = await Envio.findById(id);
        if (!envio) {
            return res.redirect('/rastreo');
        }

        // Check for Mercado Pago success return
        if ((status === 'approved' || collection_status === 'approved') && envio.estado_pago !== 'Pagado') {
            // Update status to Pagado
            await Envio.update(id, {
                ...envio,
                codigo_envio: envio.ID_Envio,
                nombre_destinatario: envio.Nombre_Destinatario,
                direccion_completa: envio.Direccion_Completa,
                estado_envio: envio.Estado_Envio,
                metodo_pago: envio.metodo_pago,
                precio: envio.precio,
                estado_pago: 'Pagado'
            });

            // Refresh envio object
            envio = await Envio.findById(id);

            // Optional: Flash message could be added here
        }

        // Verificar si ya existe un código activo para este envío
        const codigoActivo = await CodigoConfirmacion.obtenerCodigoActivo(id, 'CLIENTE_CHOFER');

        res.render('public/details', {
            title: `Envío ${envio.ID_Envio}`,
            envio,
            codigoActivo: codigoActivo ? codigoActivo.codigo : null,
            layout: 'public/layout',
            paypalClientId: process.env.PAYPAL_CLIENT_ID || 'sb', // Fallback to sandbox
            mpPublicKey: process.env.MP_PUBLIC_KEY || 'TEST-PUBLIC-KEY'
        });
    } catch (error) {
        console.error(error);
        res.redirect('/rastreo');
    }
};

// Generar código de confirmación para cliente
exports.generarCodigoConfirmacion = async (req, res) => {
    const { id } = req.params;

    try {
        const envio = await Envio.findById(id);
        if (!envio) {
            return res.status(404).json({ success: false, message: 'Envío no encontrado' });
        }

        // Verificar que el envío esté en estado "En envío"
        if (envio.Estado_Envio !== 'En envío') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se puede generar código cuando el envío está "En envío"' 
            });
        }

        // Generar código
        const codigoData = await CodigoConfirmacion.generar(id, 'CLIENTE_CHOFER', null);

        res.json({
            success: true,
            codigo: codigoData.codigo,
            message: 'Código generado exitosamente'
        });
    } catch (error) {
        console.error('Error al generar código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar el código de confirmación'
        });
    }
};
