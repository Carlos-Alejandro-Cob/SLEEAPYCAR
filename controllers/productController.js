// controllers/productController.js
const pool = require('../config/db');

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id_producto = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el producto' });
    }
};
