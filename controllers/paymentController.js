const Envio = require('../models/Envio');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Initialize Mercado Pago Client
if (!process.env.MP_ACCESS_TOKEN) {
    console.warn('WARNING: MP_ACCESS_TOKEN is not set in environment variables. Mercado Pago integration will fail.');
}

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'INVALID_TOKEN'
});

const paypal = require('@paypal/checkout-server-sdk');

// Initialize PayPal Client
const environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

exports.createPaypalOrder = async (req, res) => {
    const { orderId, amount } = req.body;
    console.log('Creating PayPal Order:', { orderId, amount });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: orderId,
            amount: {
                currency_code: 'MXN',
                value: String(amount)
            }
        }]
    });

    try {
        const order = await paypalClient.execute(request);
        console.log('PayPal Order Created:', order.result.id);
        res.json({ id: order.result.id });
    } catch (e) {
        console.error('PayPal Create Order Error:', e);
        // Log detailed error if available
        if (e.statusCode) console.error('Status Code:', e.statusCode);
        if (e.message) console.error('Message:', e.message);
        res.status(500).json({ error: 'Error creating PayPal order', details: e.message });
    }
};

exports.capturePaypalOrder = async (req, res) => {
    const { orderID, envioId } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);

        // Update DB if payment is successful
        if (capture.result.status === 'COMPLETED') {
            const envio = await Envio.findById(envioId);
            if (envio) {
                await Envio.update(envioId, {
                    ...envio,
                    codigo_envio: envio.ID_Envio,
                    nombre_destinatario: envio.Nombre_Destinatario,
                    direccion_completa: envio.Direccion_Completa,
                    estado_envio: envio.Estado_Envio,
                    metodo_pago: envio.metodo_pago,
                    precio: envio.precio,
                    estado_pago: 'Pagado'
                });
            }
            res.json({ status: 'COMPLETED', capture: capture.result });
        } else {
            res.status(400).json({ error: 'Payment not completed', status: capture.result.status });
        }

    } catch (error) {
        console.error('PayPal Capture Error:', error);
        res.status(500).json({ error: 'Error capturing payment' });
    }
};

exports.createMercadoPagoPreference = async (req, res) => {
    const { envioId, title, price } = req.body;

    try {
        const preference = new Preference(client);

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        console.log('Creating MP Preference with Base URL:', baseUrl);

        const preferenceBody = {
            items: [
                {
                    id: envioId,
                    title: title,
                    quantity: 1,
                    unit_price: Number(price)
                }
            ],
            back_urls: {
                success: `${baseUrl}/rastreo/${envioId}?status=approved`,
                failure: `${baseUrl}/rastreo/${envioId}?status=failure`,
                pending: `${baseUrl}/rastreo/${envioId}?status=pending`
            },
            // auto_return: 'approved',
        };

        const result = await preference.create({
            body: preferenceBody
        });

        res.json({ id: result.id });
    } catch (error) {
        console.error('Error creating Mercado Pago preference:', error);
        if (error.cause) {
            console.error('Error cause:', JSON.stringify(error.cause, null, 2));
        }
        res.status(500).json({ error: 'Error creating payment preference' });
    }
};
