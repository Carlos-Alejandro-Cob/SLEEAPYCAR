// catalogo.js - Funcionalidades del catálogo de productos

let productosOriginales = [];
let productosFiltrados = [];
const productosPorPagina = 12;
let paginaActual = 1;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo ejecutar si estamos en la página del catálogo
    if (document.getElementById('catalogo-productos')) {
        inicializarCatalogo();
    }
});

function inicializarCatalogo() {
    // Obtener todos los productos del DOM
    const productosItems = document.querySelectorAll('.producto-item');
    productosOriginales = Array.from(productosItems);
    productosFiltrados = productosOriginales;
    
    // Configurar eventos
    const buscarInput = document.getElementById('buscar-producto');
    const filtroGrupo = document.getElementById('filtro-grupo');
    const ordenarSelect = document.getElementById('ordenar-productos');
    
    if (buscarInput) {
        buscarInput.addEventListener('input', function() {
            filtrarProductos();
        });
    }
    
    if (filtroGrupo) {
        filtroGrupo.addEventListener('change', function() {
            filtrarProductos();
        });
    }
    
    if (ordenarSelect) {
        ordenarSelect.addEventListener('change', function() {
            ordenarProductos();
        });
    }
    
    // Mostrar primera página
    mostrarProductos();
}

function filtrarProductos() {
    const busqueda = document.getElementById('buscar-producto').value.toLowerCase().trim();
    const grupoSeleccionado = document.getElementById('filtro-grupo').value.toLowerCase();
    
    productosFiltrados = productosOriginales.filter(producto => {
        const nombre = producto.dataset.nombre || '';
        const codigo = producto.dataset.codigo || '';
        const grupo = producto.dataset.grupo || '';
        
        // Filtro por búsqueda
        const coincideBusqueda = !busqueda || 
            nombre.includes(busqueda) || 
            codigo.includes(busqueda);
        
        // Filtro por grupo
        const coincideGrupo = !grupoSeleccionado || grupo.includes(grupoSeleccionado);
        
        return coincideBusqueda && coincideGrupo;
    });
    
    paginaActual = 1;
    mostrarProductos();
    actualizarContador();
}

function ordenarProductos() {
    const orden = document.getElementById('ordenar-productos').value;
    
    productosFiltrados = [...productosFiltrados].sort((a, b) => {
        switch(orden) {
            case 'nombre-asc':
                return (a.dataset.nombre || '').localeCompare(b.dataset.nombre || '');
            case 'nombre-desc':
                return (b.dataset.nombre || '').localeCompare(a.dataset.nombre || '');
            case 'precio-asc':
                return parseFloat(a.dataset.precio || 0) - parseFloat(b.dataset.precio || 0);
            case 'precio-desc':
                return parseFloat(b.dataset.precio || 0) - parseFloat(a.dataset.precio || 0);
            default:
                return 0;
        }
    });
    
    paginaActual = 1;
    mostrarProductos();
}

function mostrarProductos() {
    const contenedor = document.getElementById('catalogo-productos');
    if (!contenedor) return;
    
    // Ocultar todos los productos
    productosOriginales.forEach(producto => {
        producto.style.display = 'none';
    });
    
    // Calcular índices de paginación
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosPagina = productosFiltrados.slice(inicio, fin);
    
    // Mostrar productos de la página actual
    productosPagina.forEach(producto => {
        producto.style.display = 'block';
    });
    
    // Mostrar mensaje si no hay productos
    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">No se encontraron productos</h4>
                        <p class="text-muted">Intenta ajustar los filtros de búsqueda.</p>
                        <button class="btn btn-outline-primary mt-3" onclick="limpiarFiltros()">
                            <i class="fas fa-times me-2"></i>
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Actualizar paginación
    actualizarPaginacion();
}

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const contenedorPaginacion = document.getElementById('paginacion-container');
    const ulPaginacion = document.getElementById('paginacion');
    
    if (totalPaginas <= 1) {
        contenedorPaginacion.classList.add('d-none');
        return;
    }
    
    contenedorPaginacion.classList.remove('d-none');
    ulPaginacion.innerHTML = '';
    
    // Botón Anterior
    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `
        <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1}); return false;">
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    ulPaginacion.appendChild(liAnterior);
    
    // Números de página
    const maxPaginasVisibles = 5;
    let inicioPagina = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2));
    let finPagina = Math.min(totalPaginas, inicioPagina + maxPaginasVisibles - 1);
    
    if (finPagina - inicioPagina < maxPaginasVisibles - 1) {
        inicioPagina = Math.max(1, finPagina - maxPaginasVisibles + 1);
    }
    
    if (inicioPagina > 1) {
        const liPrimera = document.createElement('li');
        liPrimera.className = 'page-item';
        liPrimera.innerHTML = `<a class="page-link" href="#" onclick="cambiarPagina(1); return false;">1</a>`;
        ulPaginacion.appendChild(liPrimera);
        
        if (inicioPagina > 2) {
            const liEllipsis = document.createElement('li');
            liEllipsis.className = 'page-item disabled';
            liEllipsis.innerHTML = `<span class="page-link">...</span>`;
            ulPaginacion.appendChild(liEllipsis);
        }
    }
    
    for (let i = inicioPagina; i <= finPagina; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>`;
        ulPaginacion.appendChild(li);
    }
    
    if (finPagina < totalPaginas) {
        if (finPagina < totalPaginas - 1) {
            const liEllipsis = document.createElement('li');
            liEllipsis.className = 'page-item disabled';
            liEllipsis.innerHTML = `<span class="page-link">...</span>`;
            ulPaginacion.appendChild(liEllipsis);
        }
        
        const liUltima = document.createElement('li');
        liUltima.className = 'page-item';
        liUltima.innerHTML = `<a class="page-link" href="#" onclick="cambiarPagina(${totalPaginas}); return false;">${totalPaginas}</a>`;
        ulPaginacion.appendChild(liUltima);
    }
    
    // Botón Siguiente
    const liSiguiente = document.createElement('li');
    liSiguiente.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    liSiguiente.innerHTML = `
        <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1}); return false;">
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    ulPaginacion.appendChild(liSiguiente);
}

function cambiarPagina(pagina) {
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActual = pagina;
        mostrarProductos();
        // Scroll al inicio del catálogo
        document.getElementById('catalogo-productos').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function actualizarContador() {
    const contador = document.getElementById('contador-productos');
    if (contador) {
        const total = productosFiltrados.length;
        const texto = total === 1 ? 'producto' : 'productos';
        contador.textContent = `Mostrando ${total} ${texto}`;
    }
}

function limpiarFiltros() {
    document.getElementById('buscar-producto').value = '';
    document.getElementById('filtro-grupo').value = '';
    document.getElementById('ordenar-productos').value = 'nombre-asc';
    productosFiltrados = productosOriginales;
    paginaActual = 1;
    mostrarProductos();
    actualizarContador();
}

// Hacer funciones disponibles globalmente
window.cambiarPagina = cambiarPagina;
window.limpiarFiltros = limpiarFiltros;
