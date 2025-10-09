// app.js

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// 1. Configuración de EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 2. Configuración de Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Para manejar JSON (útil para la futura API móvil)
app.use(methodOverride('_method')); // Permite usar ?_method=DELETE en URLs
app.use(express.static(path.join(__dirname, 'public'))); // Sirve CSS, JS y estáticos

// 3. Rutas de la Aplicación
// Aquí conectaremos nuestro módulo administrativo
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes); 

// Ruta principal simple
app.get('/', (req, res) => {
    res.redirect('/admin/envios'); // Redirige directamente al módulo de gestión
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
