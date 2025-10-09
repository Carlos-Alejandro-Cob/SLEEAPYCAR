// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'nombre_usuario' }, async (username, password, done) => {
        try {
            // 1. Buscar el usuario en la base de datos
            const user = await User.findByUsername(username);
            if (!user) {
                return done(null, false, { message: 'El nombre de usuario no existe.' });
            }

            // 2. Comparar la contraseña
            const isMatch = await User.comparePassword(password, user.password_hash);
            if (isMatch) {
                return done(null, user); // Éxito, devuelve el usuario
            } else {
                return done(null, false, { message: 'Contraseña incorrecta.' });
            }
        } catch (error) {
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