// controllers/envioController.js

// **Simulación de Base de Datos para el prototipo**
const mockEnvios = [
    { _id: 'a1b2c3d4', ID_Envio: 'ENV001', Nombre_Destinatario: 'Sucursal Centro', Direccion_Completa: 'Calle 10 #123', Estado_Envio: 'Entregado', URL_Foto_Entrega: 'http://bucket/foto001.jpg' },
    { _id: 'e5f6g7h8', ID_Envio: 'ENV002', Nombre_Destinatario: 'Sucursal Norte', Direccion_Completa: 'Av. Las Flores #45', Estado_Envio: 'En Ruta', URL_Foto_Entrega: null },
    { _id: 'i9j0k1l2', ID_Envio: 'ENV003', Nombre_Destinatario: 'Cliente Premium', Direccion_Completa: 'Carrera 15 #67-89', Estado_Envio: 'Pendiente', URL_Foto_Entrega: null },
    { _id: 'm3n4o5p6', ID_Envio: 'ENV004', Nombre_Destinatario: 'Oficina Principal', Direccion_Completa: 'Avenida 30 #100-50', Estado_Envio: 'Entregado', URL_Foto_Entrega: 'http://bucket/foto004.jpg' },
    { _id: 'q7r8s9t0', ID_Envio: 'ENV005', Nombre_Destinatario: 'Almacén Sur', Direccion_Completa: 'Calle 80 #25-30', Estado_Envio: 'En Ruta', URL_Foto_Entrega: null }
];

// 1. Listar y Filtrar (CRUD Read)
exports.listEnvíos = (req, res) => {
    // 💡 Aquí iría la lógica de consulta a la BD y aplicación de filtros (req.query)
    const { q, estado } = req.query; 
    
    let enviosFiltrados = mockEnvios;
    
    if (q) {
        enviosFiltrados = enviosFiltrados.filter(e => 
            e.Nombre_Destinatario.toLowerCase().includes(q.toLowerCase()) || 
            e.ID_Envio.toLowerCase().includes(q.toLowerCase())
        );
    }
    if (estado) {
        enviosFiltrados = enviosFiltrados.filter(e => e.Estado_Envio === estado);
    }
    
    // Renderiza la vista 'list.ejs' inyectando el layout principal (main.ejs)
    res.render('admin/list', { 
        envios: enviosFiltrados,
        query: q || '',
        estadoFiltro: estado || '',
        layout: 'layouts/main' 
    });
};

// 2. Mostrar Formulario de Creación
exports.showCreateForm = (req, res) => {
    // Renderiza el formulario vacío para un nuevo registro
    res.render('admin/form', { 
        envio: null, // No hay datos para pre-llenar
        isEdit: false,
        layout: 'layouts/main' 
    });
};

// 3. Procesar Creación (CRUD Create)
exports.createEnvío = (req, res) => {
    // 💡 Lógica de validación y GUARDADO en BD usando req.body
    const nuevoEnvio = {
        _id: Date.now().toString(), // ID temporal
        ID_Envio: req.body.ID_Envio,
        Nombre_Destinatario: req.body.Nombre_Destinatario,
        Direccion_Completa: req.body.Direccion_Completa,
        Estado_Envio: req.body.Estado_Envio || 'Pendiente',
        URL_Foto_Entrega: req.body.URL_Foto_Entrega || null
    };
    
    mockEnvios.push(nuevoEnvio);
    console.log('Nuevo Envío Creado:', nuevoEnvio);
    res.redirect('/admin/envios'); // Redirige a la lista
};

// 4. Mostrar Formulario de Edición
exports.showEditForm = (req, res) => {
    // 💡 Lógica para BUSCAR el envío por req.params.id en la BD
    const envioId = req.params.id;
    const envio = mockEnvios.find(e => e._id === envioId);

    if (!envio) {
        return res.status(404).send('Envío no encontrado');
    }

    res.render('admin/form', { 
        envio: envio, // Pasa el objeto 'envio' para pre-llenar el formulario
        isEdit: true,
        layout: 'layouts/main' 
    });
};

// 5. Procesar Modificación (CRUD Update)
exports.updateEnvío = (req, res) => {
    // 💡 Lógica de validación y ACTUALIZACIÓN en BD
    const envioId = req.params.id;
    const envioIndex = mockEnvios.findIndex(e => e._id === envioId);
    
    if (envioIndex === -1) {
        return res.status(404).send('Envío no encontrado');
    }
    
    // Actualizar el envío
    mockEnvios[envioIndex] = {
        ...mockEnvios[envioIndex],
        ID_Envio: req.body.ID_Envio,
        Nombre_Destinatario: req.body.Nombre_Destinatario,
        Direccion_Completa: req.body.Direccion_Completa,
        Estado_Envio: req.body.Estado_Envio,
        URL_Foto_Entrega: req.body.URL_Foto_Entrega || null
    };
    
    console.log(`Actualizando Envío ${envioId}:`, mockEnvios[envioIndex]);
    res.redirect('/admin/envios');
};

// 6. Procesar Eliminación (CRUD Delete - Baja Lógica)
exports.deleteEnvío = (req, res) => {
    // 💡 Lógica de BAJA LÓGICA (marcar 'activo: false' en BD)
    const envioId = req.params.id;
    const envioIndex = mockEnvios.findIndex(e => e._id === envioId);
    
    if (envioIndex === -1) {
        return res.status(404).send('Envío no encontrado');
    }
    
    // Eliminar del array (en producción sería baja lógica)
    mockEnvios.splice(envioIndex, 1);
    console.log(`Eliminando Envío: ${envioId}`);
    res.redirect('/admin/envios');
};
