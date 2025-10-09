# SLEE APYCAR - Sistema de Gestión de Envíos

Sistema web administrativo para la gestión y monitoreo de envíos desarrollado con Express.js y EJS.

## 🚀 Características

- **Gestión Completa de Envíos**: CRUD completo para administrar envíos
- **Filtros y Búsqueda**: Búsqueda por destinatario, ID de envío y estado
- **Interfaz Moderna**: Diseño responsive con Bootstrap 5
- **Estados de Envío**: Pendiente, En Ruta, Entregado
- **Fotos de Entrega**: Soporte para URLs de fotos de entrega
- **Exportación**: Funcionalidad para exportar datos a CSV

## 📋 Requisitos

- Node.js (versión 14 o superior)
- npm (Node Package Manager)

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd ProyectoExpress
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor**
   ```bash
   npm start
   ```
   
   O para desarrollo con auto-reload:
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación**
   - Abrir navegador en: `http://localhost:3000`
   - La aplicación redirigirá automáticamente a `/admin/envios`

## 📁 Estructura del Proyecto

```
ProyectoExpress/
├── controllers/          # Lógica de controladores
│   └── envioController.js
├── routes/              # Definición de rutas
│   └── adminRoutes.js
├── views/               # Plantillas EJS
│   ├── layouts/
│   │   └── main.ejs
│   └── admin/
│       ├── list.ejs
│       └── form.ejs
├── public/              # Archivos estáticos
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── app.js              # Archivo principal
├── package.json        # Dependencias del proyecto
└── README.md           # Este archivo
```

## 🎯 Funcionalidades Implementadas

### Gestión de Envíos
- ✅ **Listar envíos** con filtros y búsqueda
- ✅ **Crear nuevo envío** con formulario completo
- ✅ **Editar envío existente** con datos pre-cargados
- ✅ **Eliminar envío** con confirmación
- ✅ **Estados de envío**: Pendiente, En Ruta, Entregado

### Interfaz de Usuario
- ✅ **Diseño responsive** con Bootstrap 5
- ✅ **Navegación intuitiva** con navbar
- ✅ **Filtros avanzados** por estado y búsqueda de texto
- ✅ **Validación de formularios** en cliente y servidor
- ✅ **Confirmaciones** para acciones destructivas

### Características Técnicas
- ✅ **Motor de plantillas EJS** para vistas dinámicas
- ✅ **Middleware de Express** para procesamiento de datos
- ✅ **Rutas RESTful** para operaciones CRUD
- ✅ **Datos simulados** para prototipo funcional

## 🔧 Configuración

### Variables de Entorno
El proyecto está configurado para ejecutarse en el puerto 3000 por defecto. Para cambiar el puerto, modifica la variable `port` en `app.js`.

### Base de Datos
Actualmente utiliza datos simulados (mock data) para el prototipo. Para conectar con una base de datos real, modifica el archivo `controllers/envioController.js`.

## 📱 Rutas Disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Redirige a gestión de envíos |
| GET | `/admin/envios` | Lista todos los envíos |
| GET | `/admin/envios/nuevo` | Formulario para nuevo envío |
| POST | `/admin/envios` | Crea un nuevo envío |
| GET | `/admin/envios/editar/:id` | Formulario para editar envío |
| POST | `/admin/envios/editar/:id` | Actualiza un envío existente |
| POST | `/admin/envios/eliminar/:id` | Elimina un envío |

## 🎨 Personalización

### Estilos CSS
Los estilos personalizados se encuentran en `public/css/style.css`. Puedes modificar:
- Colores del tema
- Tipografías
- Espaciados
- Animaciones

### JavaScript
La lógica del cliente está en `public/js/app.js` e incluye:
- Validaciones de formulario
- Confirmaciones de eliminación
- Funciones de exportación
- Animaciones y efectos

## 🚀 Próximos Pasos

1. **Conexión a Base de Datos**: Integrar MongoDB, PostgreSQL o MySQL
2. **Autenticación**: Sistema de login y roles de usuario
3. **API REST**: Endpoints para aplicación móvil
4. **Reportes**: Generación de reportes en PDF
5. **Notificaciones**: Sistema de notificaciones en tiempo real

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contacta al equipo de desarrollo.

---

**SLEE APYCAR** - Sistema de Gestión de Envíos v1.0.0
