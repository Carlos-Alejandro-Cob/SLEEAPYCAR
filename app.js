// app.js

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config(); // Carga las variables de entorno desde .env
require('./config/db'); // Importa y ejecuta la configuración de la BD
const app = express();
const port = process.env.PORT || 3001;

// 1. Configuración de EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuración de Passport
require('./config/passport')(passport);

// --- MIDDLEWARES ---

// 2.0. CORS - Permitir solicitudes desde Flutter Web
app.use(cors({
    origin: function (origin, callback) {
        // Permitir cualquier origen en desarrollo
        callback(null, true);
    },
    credentials: true, // CRÍTICO: Permitir cookies/sesiones
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
}));

// 2.1. Parseo de Peticiones
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Para manejar JSON (útil para la futura API móvil)

// Simplificamos method-override para que busque '_method' en la query y en el body.
app.use(methodOverride('_method'));

// 2.2. Servidor de Archivos Estáticos
app.use(express.static(path.join(__dirname, 'public'))); // Sirve CSS, JS y estáticos
app.use('/assets', express.static(path.join(__dirname, 'assets'))); // Sirve assets (logo, imágenes, etc.)

// 2.3. Seguridad
// La configuración más robusta para Helmet es pasar un único objeto de configuración.
// Esto asegura que todas las directivas se apliquen correctamente en un solo paso.
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            "default-src": [
                "'self'",
                "https://cdn.jsdelivr.net",
                "http://localhost:3001",
                "ws://localhost:3001"
            ],
            "script-src": [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://sdk.mercadopago.com",
                "https://www.paypal.com",
                "https://www.sandbox.paypal.com",
                "https://*.mercadopago.com",
                "https://*.mercadolibre.com",
                "https://http2.mlstatic.com",
                "'unsafe-inline'",
                "'unsafe-eval'"
            ],
            "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
            "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://http2.mlstatic.com", "data:"],
            "img-src": ["'self'", "data:", "https://isubzrcyvxrkchodohtv.supabase.co/storage/v1/object/public/incidencia-fotos/public/", "https://res.cloudinary.com", "https://http2.mlstatic.com", "https://*.mercadolibre.com", "https://*.mercadopago.com", "https://www.paypalobjects.com", "https://www.mercadolibre.com", "https://www.mercadolivre.com"],
            "connect-src": ["'self'", "http://localhost:3001", "ws://localhost:3001", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://api.mercadopago.com", "https://events.mercadopago.com", "https://api.mercadopago.com/v1/events", "https://cdn.jsdelivr.net", "https://www.mercadolibre.com", "https://api.mercadolibre.com", "https://http2.mlstatic.com", "https://*.mercadopago.com", "https://*.mercadolibre.com"],
            "frame-src": ["'self'", "https://www.paypal.com", "https://sdk.mercadopago.com", "https://www.sandbox.paypal.com", "https://www.mercadolibre.com", "https://*.mercadopago.com", "https://*.mercadolibre.com"],
            "object-src": ["'none'"],
        },
    },
}));

// 2.4. Sesión y Autenticación
app.use(session({
    secret: process.env.SECRET_KEY || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true,
    name: 'connect.sid', // Nombre de la cookie de sesión
    cookie: {
        secure: false, // En desarrollo con HTTP, usar false. En producción con HTTPS, usar true
        httpOnly: true, // Mantener httpOnly para seguridad
        sameSite: 'lax', // 'lax' permite cookies en navegación cross-site (mejor para desarrollo local)
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/', // Asegurar que la cookie esté disponible en todas las rutas
        domain: undefined // No especificar dominio para que funcione en localhost
    }
}));
app.use(flash()); // Re-habilitado
// Inicialización de Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para debug de cookies (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        if (req.path.startsWith('/mobile/api')) {
            console.log('Request path:', req.path);
            console.log('Cookies recibidas:', req.headers.cookie);
            console.log('Headers completos:', JSON.stringify(req.headers, null, 2));
            console.log('Usuario autenticado:', req.isAuthenticated());
            if (req.user) {
                console.log('Usuario:', req.user.nombre_usuario);
            }
        }
        next();
    });
}

// 2.5. Variables Locales para Vistas
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg'); // Re-habilitado
    res.locals.error_msg = req.flash('error_msg'); // Re-habilitado
    res.locals.error = req.flash('error'); // Re-habilitado
    res.locals.user = req.user || null; // Pasa el usuario a todas las vistas
    next();
});

// 3. Rutas de la Aplicación
// Aquí conectaremos nuestro módulo administrativo
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const mobileRoutes = require('./routes/mobileRoutes');

// Middleware to handle favicon.ico requests and prevent 404 errors in the console
app.get('/favicon.ico', (req, res) => res.status(204).send());

app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/mobile', mobileRoutes);

// Ruta principal simple
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/admin/envios');
    } else {
        res.redirect('/auth/login');
    }
});

// Inicia el servidor - escuchar en todas las interfaces (0.0.0.0) para permitir conexiones desde la red
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor SLEE corriendo en http://localhost:${port}`);
    console.log(`Servidor también disponible en la red local: http://10.3.1.134:${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: El puerto ${port} ya está en uso. Por favor, cierra el proceso que lo ocupa o elige otro puerto.`);
        process.exit(1);
    } else {
        throw err;
    }
});
