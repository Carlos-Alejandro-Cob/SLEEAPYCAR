// carrito.js - Manejo del carrito de compras

// Variables globales para el modal de cantidad
let productoActual = {
    id: null,
    nombre: null,
    precio: null
};

// Abrir modal para seleccionar cantidad
function abrirModalCantidad(idProducto, nombre, precio) {
    productoActual.id = idProducto;
    productoActual.nombre = nombre;
    productoActual.precio = parseFloat(precio);
    
    // Llenar información del modal
    const nombreInput = document.getElementById('producto-nombre-modal');
    const precioInput = document.getElementById('producto-precio-modal');
    const cantidadInput = document.getElementById('cantidad-modal');
    
    if (nombreInput && precioInput && cantidadInput) {
        nombreInput.value = nombre;
        precioInput.value = '$' + parseFloat(precio).toFixed(2);
        cantidadInput.value = 1;
        
        // Calcular total inicial
        actualizarTotalModal();
        
        // Mostrar modal
        const modalElement = document.getElementById('modalCantidad');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Modal no encontrado');
            mostrarNotificacion('Error al abrir el modal', 'error');
        }
    } else {
        console.error('Elementos del modal no encontrados');
        mostrarNotificacion('Error al abrir el modal', 'error');
    }
}

// Actualizar total en el modal
function actualizarTotalModal() {
    const cantidad = parseInt(document.getElementById('cantidad-modal').value) || 1;
    const total = productoActual.precio * cantidad;
    document.getElementById('total-modal').textContent = '$' + total.toFixed(2);
}

// Agregar producto al carrito con cantidad seleccionada
function agregarAlCarrito(idProducto, nombre, precio, cantidad) {
    fetch('/api/carrito/agregar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_producto: idProducto,
            nombre: nombre,
            precio: precio,
            cantidad: cantidad
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCantidad'));
            if (modal) {
                modal.hide();
            }
            // Mostrar notificación
            mostrarNotificacion('Producto agregado al carrito', 'success');
            // Actualizar contador del carrito
            actualizarContadorCarrito(data.carritoCount);
            // Si estamos en la página del carrito, recargar
            if (window.location.pathname === '/carrito') {
                location.reload();
            }
        } else {
            mostrarNotificacion('Error al agregar producto', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    });
}

// Actualizar cantidad en el carrito
function actualizarCantidad(idProducto, nuevaCantidad) {
    fetch('/api/carrito/actualizar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_producto: idProducto,
            cantidad: nuevaCantidad
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            mostrarNotificacion('Error al actualizar cantidad', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    });
}

// Eliminar producto del carrito
function eliminarDelCarrito(idProducto) {
    if (!confirm('¿Estás seguro de eliminar este producto del carrito?')) {
        return;
    }
    
    fetch('/api/carrito/eliminar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id_producto: idProducto
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacion('Producto eliminado del carrito', 'success');
            location.reload();
        } else {
            mostrarNotificacion('Error al eliminar producto', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    });
}

// Actualizar contador del carrito en el header
function actualizarContadorCarrito(count) {
    const badge = document.querySelector('.badge.bg-danger');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacion.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// Realizar pedido desde el carrito
function realizarPedido() {
    const direccion = document.getElementById('direccion-entrega');
    const metodoPago = document.getElementById('metodo-pago');
    const btnRealizarPedido = document.getElementById('btn-realizar-pedido');
    
    if (!direccion || !direccion.value.trim()) {
        mostrarNotificacion('Por favor, ingresa la dirección de entrega', 'error');
        direccion.focus();
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    btnRealizarPedido.disabled = true;
    btnRealizarPedido.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
    
    fetch('/api/carrito/realizar-pedido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            direccion_completa: direccion.value.trim(),
            metodo_pago: metodoPago ? metodoPago.value : 'Pendiente'
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch {
                    throw new Error('Error del servidor: ' + response.status);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Si requiere pago con PayPal
            if (data.requierePago && data.metodo_pago === 'paypal') {
                iniciarPagoPayPal(data.codigo_envio, data.precio);
            } else {
                mostrarNotificacion(`¡Pedido realizado con éxito! Código: ${data.codigo_envio}`, 'success');
                // Redirigir a pedidos después de 2 segundos
                setTimeout(() => {
                    window.location.href = data.redirect || '/pedidos';
                }, 2000);
            }
        } else {
            mostrarNotificacion(data.message || 'Error al realizar el pedido', 'error');
            btnRealizarPedido.disabled = false;
            btnRealizarPedido.innerHTML = '<i class="fas fa-check me-2"></i>Realizar Pedido';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión. Por favor, intenta nuevamente.', 'error');
        btnRealizarPedido.disabled = false;
        btnRealizarPedido.innerHTML = '<i class="fas fa-check me-2"></i>Realizar Pedido';
    });
}

// Iniciar pago con PayPal usando SDK
function iniciarPagoPayPal(codigoEnvio, precio) {
    const paypalClientId = window.paypalClientId || 'sb';
    
    // Verificar si el SDK de PayPal está cargado
    if (typeof paypal === 'undefined') {
        // Cargar el SDK de PayPal dinámicamente
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=MXN`;
        script.onload = function() {
            procesarPagoPayPal(codigoEnvio, precio);
        };
        script.onerror = function() {
            mostrarNotificacion('Error al cargar PayPal. Por favor, intenta nuevamente.', 'error');
            const btnRealizarPedido = document.getElementById('btn-realizar-pedido');
            if (btnRealizarPedido) {
                btnRealizarPedido.disabled = false;
                btnRealizarPedido.innerHTML = '<i class="fas fa-check me-2"></i>Realizar Pedido';
            }
        };
        document.head.appendChild(script);
    } else {
        procesarPagoPayPal(codigoEnvio, precio);
    }
}

// Procesar pago con PayPal
function procesarPagoPayPal(codigoEnvio, precio) {
    // Crear contenedor para los botones de PayPal si no existe
    let paypalContainer = document.getElementById('paypal-button-container');
    if (!paypalContainer) {
        paypalContainer = document.createElement('div');
        paypalContainer.id = 'paypal-button-container';
        paypalContainer.style.marginTop = '1rem';
        
        const resumenCard = document.querySelector('.card .card-body');
        if (resumenCard) {
            resumenCard.appendChild(paypalContainer);
        }
    }
    
    // Limpiar contenedor anterior
    paypalContainer.innerHTML = '';
    
    // Ocultar botón de realizar pedido
    const btnRealizarPedido = document.getElementById('btn-realizar-pedido');
    if (btnRealizarPedido) {
        btnRealizarPedido.style.display = 'none';
    }
    
    mostrarNotificacion('Iniciando proceso de pago con PayPal...', 'info');
    
    // Renderizar botones de PayPal
    paypal.Buttons({
        createOrder: function(data, actions) {
            return fetch('/api/pagos/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: codigoEnvio,
                    amount: parseFloat(precio).toFixed(2)
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    return data.id;
                } else {
                    throw new Error(data.error || 'Error al crear orden de PayPal');
                }
            });
        },
        onApprove: function(data, actions) {
            return fetch('/api/pagos/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: data.orderID
                })
            })
            .then(response => response.json())
            .then(function(orderData) {
                if (orderData.status === 'COMPLETED') {
                    mostrarNotificacion('¡Pago completado exitosamente! Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = '/pedidos';
                    }, 2000);
                } else {
                    throw new Error('El pago no se completó correctamente');
                }
            });
        },
        onError: function(err) {
            console.error('Error PayPal:', err);
            mostrarNotificacion('Error al procesar el pago con PayPal. Por favor, intenta nuevamente.', 'error');
            if (btnRealizarPedido) {
                btnRealizarPedido.style.display = 'block';
                btnRealizarPedido.disabled = false;
                btnRealizarPedido.innerHTML = '<i class="fas fa-check me-2"></i>Realizar Pedido';
            }
            if (paypalContainer) {
                paypalContainer.innerHTML = '';
            }
        },
        onCancel: function(data) {
            mostrarNotificacion('Pago cancelado', 'warning');
            if (btnRealizarPedido) {
                btnRealizarPedido.style.display = 'block';
                btnRealizarPedido.disabled = false;
                btnRealizarPedido.innerHTML = '<i class="fas fa-check me-2"></i>Realizar Pedido';
            }
            if (paypalContainer) {
                paypalContainer.innerHTML = '';
            }
        }
    }).render('#paypal-button-container');
}

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Eventos para botones de agregar al carrito - abrir modal
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const idProducto = this.dataset.productId;
            const nombre = this.dataset.productName;
            const precio = this.dataset.productPrice;
            abrirModalCantidad(idProducto, nombre, precio);
        });
    });
    
    // Eventos del modal de cantidad
    const cantidadInput = document.getElementById('cantidad-modal');
    const btnDecrementar = document.getElementById('btn-decrementar-modal');
    const btnIncrementar = document.getElementById('btn-incrementar-modal');
    const btnConfirmar = document.getElementById('btn-confirmar-cantidad');
    
    if (cantidadInput) {
        cantidadInput.addEventListener('input', function() {
            const valor = parseInt(this.value) || 1;
            if (valor < 1) {
                this.value = 1;
            }
            actualizarTotalModal();
        });
    }
    
    if (btnDecrementar) {
        btnDecrementar.addEventListener('click', function() {
            const cantidad = parseInt(cantidadInput.value) || 1;
            if (cantidad > 1) {
                cantidadInput.value = cantidad - 1;
                actualizarTotalModal();
            }
        });
    }
    
    if (btnIncrementar) {
        btnIncrementar.addEventListener('click', function() {
            const cantidad = parseInt(cantidadInput.value) || 1;
            cantidadInput.value = cantidad + 1;
            actualizarTotalModal();
        });
    }
    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', function() {
            const cantidad = parseInt(cantidadInput.value) || 1;
            if (cantidad < 1) {
                mostrarNotificacion('La cantidad debe ser al menos 1', 'error');
                return;
            }
            agregarAlCarrito(productoActual.id, productoActual.nombre, productoActual.precio, cantidad);
        });
    }
    
    // Permitir Enter en el input de cantidad para confirmar
    if (cantidadInput && btnConfirmar) {
        cantidadInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                btnConfirmar.click();
            }
        });
    }
    
    // Eventos para botones de actualizar cantidad
    document.querySelectorAll('.update-cantidad').forEach(button => {
        button.addEventListener('click', function() {
            const idProducto = this.dataset.productId;
            const nuevaCantidad = parseInt(this.dataset.cantidad);
            actualizarCantidad(idProducto, nuevaCantidad);
        });
    });
    
    // Eventos para botones de eliminar
    document.querySelectorAll('.eliminar-producto').forEach(button => {
        button.addEventListener('click', function() {
            const idProducto = this.dataset.productId;
            eliminarDelCarrito(idProducto);
        });
    });
    
    // Evento para botón de realizar pedido
    const btnRealizarPedido = document.getElementById('btn-realizar-pedido');
    if (btnRealizarPedido) {
        btnRealizarPedido.addEventListener('click', function() {
            realizarPedido();
        });
    }
    
    // Permitir realizar pedido con Enter en el textarea de dirección
    const direccionInput = document.getElementById('direccion-entrega');
    if (direccionInput) {
        direccionInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter' && btnRealizarPedido && !btnRealizarPedido.disabled) {
                realizarPedido();
            }
        });
    }
});

// Hacer funciones disponibles globalmente
window.abrirModalCantidad = abrirModalCantidad;
window.agregarAlCarrito = agregarAlCarrito;
window.actualizarTotalModal = actualizarTotalModal;
