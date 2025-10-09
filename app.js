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
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // busca en req.body y lo elimina
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
}));

// 2.2. Servidor de Archivos Estáticos
app.use(express.static(path.join(__dirname, 'public'))); // Sirve CSS, JS y estáticos

// 2.3. Seguridad
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://cdn.jsdelivr.net", // Permitir Bootstrap JS
            ],
            styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"], // Permitir Font Awesome
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"], // Permitir conexiones para source maps
            imgSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
        },
    })
);

// 2.4. Sesión y Autenticación
app.use(session({
    secret: process.env.SECRET_KEY || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
// Inicialización de Passport
app.use(passport.initialize());
app.use(passport.session());

// 2.5. Variables Locales para Vistas
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg'); // Para errores personalizados
    res.locals.error = req.flash('error'); // Para errores de Passport
    res.locals.user = req.user || null; // Pasa el usuario a todas las vistas
    next();
});

// 3. Rutas de la Aplicación
// Aquí conectaremos nuestro módulo administrativo
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

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
