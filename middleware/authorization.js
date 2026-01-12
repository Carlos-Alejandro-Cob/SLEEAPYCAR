// middleware/authorization.js
const ROLES = require('../config/roles');

module.exports = {
    checkRole: function (roles) {
        return function (req, res, next) {
            if (!req.isAuthenticated()) {
                req.flash('error_msg', 'Por favor, inicia sesión para ver este recurso.');
                return res.redirect('/auth/login');
            }

            const userRole = req.user.id_rol_fk;

            // Permitir pasar un solo rol o un array
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (allowedRoles.includes(userRole)) {
                return next();
            } else {
                req.flash('error_msg', 'No tienes permiso para ver este recurso.');
                // Redirigir según rol si intenta acceder a algo prohibido
                if (userRole === ROLES.REPARTIDOR) {
                    return res.redirect('/admin/repartidor');
                }
                return res.redirect('/');
            }
        };
    }
};
