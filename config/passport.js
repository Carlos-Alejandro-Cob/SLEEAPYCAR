// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'nombre_usuario' }, async (username, password, done) => {
        const startTime = Date.now();
        console.log(`[PASSPORT] Iniciando autenticación para: ${username}`);
        
        try {
            // 1. Buscar el usuario en la base de datos (case-insensitive)
            // Convertir a minúsculas para la búsqueda
            console.log(`[PASSPORT] Buscando usuario en BD...`);
            const userStartTime = Date.now();
            const user = await User.findByUsername(username.toLowerCase());
            const userQueryTime = Date.now() - userStartTime;
            console.log(`[PASSPORT] Búsqueda de usuario completada en ${userQueryTime}ms`);
            
            if (!user) {
                console.log(`[PASSPORT] Usuario no encontrado: ${username}`);
                return done(null, false, { message: 'El nombre de usuario no existe.' });
            }

            // 2. Comparar la contraseña
            console.log(`[PASSPORT] Comparando contraseña...`);
            const pwdStartTime = Date.now();
            const isMatch = await User.comparePassword(password, user.password_hash);
            const pwdCompareTime = Date.now() - pwdStartTime;
            console.log(`[PASSPORT] Comparación de contraseña completada en ${pwdCompareTime}ms`);
            
            const totalTime = Date.now() - startTime;
            if (isMatch) {
                console.log(`[PASSPORT] Autenticación exitosa en ${totalTime}ms`);
                return done(null, user); // Éxito, devuelve el usuario
            } else {
                console.log(`[PASSPORT] Contraseña incorrecta (tiempo: ${totalTime}ms)`);
                return done(null, false, { message: 'Contraseña incorrecta.' });
            }
        } catch (error) {
            const totalTime = Date.now() - startTime;
            console.error(`[PASSPORT] Error en autenticación (tiempo: ${totalTime}ms):`, error);
            console.error(`[PASSPORT] Stack:`, error.stack);
            return done(error);
        }
    }));

    // Serializar usuario (guardar ID de usuario en la sesión)
    passport.serializeUser((user, done) => {
        done(null, user.id_usuario);
    });

    // Deserializar usuario (recuperar datos del usuario desde la sesión usando el ID)
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};