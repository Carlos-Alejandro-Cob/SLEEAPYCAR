// SLEE APYCAR - Custom JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializar popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts después de 5 segundos
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            if (alert.classList.contains('alert-success') || alert.classList.contains('alert-info')) {
                var bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        });
    }, 5000);

    // Confirmación antes de eliminar
    var deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
                e.preventDefault();
            }
        });
    });

    // Validación de formularios
    var forms = document.querySelectorAll('.needs-validation');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Auto-generar ID de envío
    var idEnvioInput = document.getElementById('ID_Envio');
    if (idEnvioInput && !idEnvioInput.value) {
        idEnvioInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                var timestamp = Date.now().toString().slice(-6);
                this.value = 'ENV' + timestamp;
            }
        });
    }

    // Validación de URL de imagen
    var urlFotoInput = document.getElementById('URL_Foto_Entrega');
    if (urlFotoInput) {
        urlFotoInput.addEventListener('blur', function() {
            if (this.value && !isValidUrl(this.value)) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Por favor, ingresa una URL válida');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }

    // Filtros de búsqueda en tiempo real
    var searchInput = document.getElementById('q');
    if (searchInput) {
        var searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                // Aquí podrías implementar búsqueda en tiempo real
                console.log('Búsqueda:', searchInput.value);
            }, 300);
        });
    }

    // Exportar funcionalidad
    window.exportarExcel = function() {
        // Implementar exportación a Excel
        var table = document.querySelector('table');
        if (table) {
            var csv = tableToCSV(table);
            downloadCSV(csv, 'envios.csv');
        }
    };

    // Función para convertir tabla a CSV
    function tableToCSV(table) {
        var rows = table.querySelectorAll('tr');
        var csv = [];
        
        for (var i = 0; i < rows.length; i++) {
            var row = [];
            var cols = rows[i].querySelectorAll('td, th');
            
            for (var j = 0; j < cols.length; j++) {
                var text = cols[j].textContent.trim();
                // Limpiar texto de botones y badges
                text = text.replace(/Ver Foto|Editar|Eliminar/g, '');
                row.push('"' + text + '"');
            }
            csv.push(row.join(','));
        }
        
        return csv.join('\n');
    }

    // Función para descargar CSV
    function downloadCSV(csv, filename) {
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Función para validar URL
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Función para mostrar error en campo
    function showFieldError(field, message) {
        hideFieldError(field);
        var errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    // Función para ocultar error en campo
    function hideFieldError(field) {
        var errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Confirmación de eliminación con modal
    window.confirmarEliminacion = function(id, envioId) {
        document.getElementById('envioId').textContent = envioId;
        document.getElementById('formEliminar').action = '/admin/envios/eliminar/' + id;
        var modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
        modal.show();
    };

    // Animaciones de entrada
    var cards = document.querySelectorAll('.card');
    cards.forEach(function(card, index) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(function() {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Contador de caracteres para textarea
    var textareas = document.querySelectorAll('textarea');
    textareas.forEach(function(textarea) {
        var maxLength = textarea.getAttribute('maxlength');
        if (maxLength) {
            var counter = document.createElement('small');
            counter.className = 'text-muted';
            counter.textContent = '0/' + maxLength + ' caracteres';
            
            textarea.addEventListener('input', function() {
                counter.textContent = this.value.length + '/' + maxLength + ' caracteres';
                if (this.value.length > maxLength * 0.9) {
                    counter.classList.add('text-warning');
                } else {
                    counter.classList.remove('text-warning');
                }
            });
            
            textarea.parentNode.appendChild(counter);
        }
    });
});

// Funciones globales
window.SLEE_APYCAR = {
    // Función para mostrar notificaciones
    showNotification: function(message, type = 'info') {
        var alertClass = 'alert-' + type;
        var alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        var container = document.querySelector('main .container-fluid');
        if (container) {
            container.insertAdjacentHTML('afterbegin', alertHtml);
            
            // Auto-hide después de 5 segundos
            setTimeout(function() {
                var alert = container.querySelector('.alert');
                if (alert) {
                    var bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        }
    },

    // Función para confirmar acciones
    confirmAction: function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    },

    // Función para formatear fechas
    formatDate: function(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};
