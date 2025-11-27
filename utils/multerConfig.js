const multer = require('multer');

// Configurar Multer para almacenar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

module.exports = upload;
