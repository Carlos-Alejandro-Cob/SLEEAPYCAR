// middleware/auth.js
module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Por favor, inicia sesión para ver este recurso.');
        res.redirect('/auth/login');
    }
};