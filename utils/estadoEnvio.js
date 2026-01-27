// utils/estadoEnvio.js
/**
 * Mapea el estado interno del envío al estado visible para el cliente
 * @param {string} estadoInterno - Estado interno del envío
 * @returns {string} - Estado visible para el cliente
 */
function mapearEstadoCliente(estadoInterno) {
    if (!estadoInterno) return 'Aceptado';
    
    const estado = estadoInterno.trim();
    
    // Estados que el cliente ve como "Aceptado"
    if (['Aceptado', 'Pendiente', 'Preparado', 'Despachado'].includes(estado)) {
        return 'Aceptado';
    }
    
    // Estados que el cliente ve como "En reparto"
    if (['En reparto', 'En envío', 'En Ruta', 'En envío'].includes(estado)) {
        return 'En reparto';
    }
    
    // Estado "Entregado" se mantiene igual
    if (estado === 'Entregado') {
        return 'Entregado';
    }
    
    // Estado "Rechazado" se mantiene igual
    if (estado === 'Rechazado') {
        return 'Rechazado';
    }
    
    // Por defecto, mostrar "Aceptado"
    return 'Aceptado';
}

module.exports = {
    mapearEstadoCliente
};
