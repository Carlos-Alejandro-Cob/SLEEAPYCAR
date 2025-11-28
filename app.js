// app.js

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const helmet = require('helmet');
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
        directives: {
            "default-src": [
                "'self'",
                "https://cdn.jsdelivr.net",
                "http://localhost:3001", // Permitir conexiones HTTP a localhost
                "ws://localhost:3001" // Permitir conexiones WebSocket a localhost
            ],
            "script-src": [
                "'self'",
                "https://cdn.jsdelivr.net",
                "'unsafe-inline'",
                "'unsafe-eval'"
            ],
            "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            "font-src": ["'self'", "https://cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://isubzrcyvxrkchodohtv.supabase.co/storage/v1/object/public/incidencia-fotos/public/", "https://res.cloudinary.com"], // Permitir imágenes del mismo origen, data URIs y Cloudinary
            "object-src": ["'none'"],
            "upgrade-insecure-requests": [],
        },
    },
}));

// 2.4. Sesión y Autenticación
app.use(session({
    secret: process.env.SECRET_KEY || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash()); // Re-habilitado
// Inicialización de Passport
app.use(passport.initialize());
app.use(passport.session());

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

// Middleware to handle favicon.ico requests and prevent 404 errors in the console
app.get('/favicon.ico', (req, res) => res.status(204).send());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Ruta principal simple
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/admin/envios');
    } else {
        res.redirect('/auth/login');
    }
});

// Inicia el servidor
const server = app.listen(port, () => {
    console.log(`Servidor SLEE corriendo en http://localhost:${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: El puerto ${port} ya está en uso. Por favor, cierra el proceso que lo ocupa o elige otro puerto.`);
        process.exit(1);
    } else {
        throw err;
    }
});
