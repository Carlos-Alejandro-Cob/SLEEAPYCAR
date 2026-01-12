// controllers/customerController.js

// Mostrar el dashboard del cliente
exports.showDashboard = (req, res) => {
    res.render('public/dashboard', { title: 'Mi Cuenta' });
};
