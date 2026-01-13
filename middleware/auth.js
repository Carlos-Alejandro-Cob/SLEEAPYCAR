// middleware/auth.js
module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        
        // Si es una petición AJAX/API, devolver JSON en lugar de redirigir
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No autenticado. Por favor, inicia sesión.' 
            });
        }
        
        req.flash('error_msg', 'Por favor, inicia sesión para ver este recurso.');
        res.redirect('/auth/login');
    }
};