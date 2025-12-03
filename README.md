# APYCAR - Sistema de Gestión de Envíos

Sistema web profesional para la gestión y administración de envíos de **Comercializadora APYCAR**.

![APYCAR Logo](./assets/logo/logo%20apycar%20sin%20fondo.png)

## 📋 Descripción

APYCAR es una plataforma completa de gestión de envíos que permite a los administradores:
- Crear, editar y eliminar envíos
- Monitorear el estado de las entregas en tiempo real
- Gestionar incidencias y reportes
- Visualizar fotografías de entrega
- Exportar datos a Excel
- Sistema de autenticación seguro

## 🚀 Características

### Gestión de Envíos
- ✅ CRUD completo de envíos
- 📦 Estados: Pendiente, En Ruta, Entregado
- 🔍 Búsqueda y filtrado avanzado
- 📸 Carga y visualización de fotos de entrega
- 📊 Exportación a Excel

### Gestión de Incidencias
- 🚨 Reporte de incidencias con fotografías
- 📝 Seguimiento detallado de problemas
- 🔗 Vinculación con envíos específicos
- 📋 Historial completo de incidencias

### Seguridad
- 🔐 Autenticación con Passport.js
- 🛡️ Helmet para protección HTTP
- 🔑 Sesiones seguras
- 👤 Control de acceso por usuarios

## 🛠️ Tecnologías

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Passport.js** - Autenticación
- **Multer** - Carga de archivos
- **Supabase** - Almacenamiento de imágenes

### Frontend
- **EJS** - Motor de plantillas
- **Bootstrap 5** - Framework CSS
- **Font Awesome** - Iconografía
- **JavaScript** - Interactividad

### Seguridad
- **Helmet** - Seguridad HTTP
- **bcryptjs** - Hashing de contraseñas
- **express-session** - Gestión de sesiones

## 📦 Instalación

### Prerrequisitos
```bash
Node.js >= 14.x
MongoDB >= 4.x
npm o yarn
```

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/apycar.git
cd apycar/SLEEAPYCAR
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3001

# Base de datos
MONGODB_URI=mongodb://localhost:27017/apycar_db
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/apycar_db

# Seguridad
SECRET_KEY=tu_clave_secreta_super_segura_aqui

# Supabase (para almacenamiento de imágenes)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_clave_de_supabase
SUPABASE_BUCKET=incidencia-fotos

# Entorno
NODE_ENV=development
```

4. **Inicializar la base de datos**
```bash
# Asegúrate de que MongoDB esté corriendo
mongod

# En otra terminal, ejecuta:
npm run init-db  # Si tienes un script de inicialización
```

5. **Crear usuario administrador**
```bash
node scripts/createUser.js
```

6. **Iniciar el servidor**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📁 Estructura del Proyecto

```
SLEEAPYCAR/
├── assets/              # Recursos estáticos (logos, imágenes)
├── config/              # Configuración de la aplicación
│   ├── db.js           # Conexión a MongoDB
│   └── passport.js     # Configuración de autenticación
├── controllers/         # Lógica de negocio
│   ├── authController.js
│   └── envioController.js
├── middleware/          # Middlewares personalizados
│   └── auth.js         # Verificación de autenticación
├── models/             # Modelos de datos
│   ├── User.js
│   ├── Envio.js
│   ├── Incidencia.js
│   └── s3Service.js
├── public/             # Archivos públicos
│   ├── css/
│   │   └── style.css   # Estilos personalizados
│   └── js/
│       └── app.js      # JavaScript del cliente
├── routes/             # Definición de rutas
│   ├── authRoutes.js
│   └── adminRoutes.js
├── scripts/            # Scripts de utilidad
│   └── createUser.js   # Crear usuarios
├── utils/              # Utilidades
│   ├── dbQuery.js
│   ├── multerConfig.js
│   └── supabaseClient.js
├── views/              # Plantillas EJS
│   ├── admin/
│   ├── auth/
│   └── layouts/
├── app.js              # Punto de entrada
├── package.json
└── README.md
```

## 🎨 Diseño

El sistema cuenta con un diseño moderno y profesional con:
- Paleta de colores verde corporativa de APYCAR
- Interfaz responsive para móviles y tablets
- Diseño minimalista y limpio
- Experiencia de usuario optimizada

### Paleta de Colores
- **Verde Primario**: `#2d5016`
- **Verde Claro**: `#e8f5e9`
- **Verde Medio**: `#81c784`
- **Verde Oscuro**: `#1b5e20`

## 👤 Uso

### Iniciar Sesión
1. Accede a `http://localhost:3001`
2. Serás redirigido al login
3. Ingresa tus credenciales
4. Accederás al panel de administración

### Gestionar Envíos
1. Desde el dashboard, haz clic en "Nuevo Envío"
2. Completa el formulario con los datos del destinatario
3. Selecciona el estado del envío
4. Opcionalmente, agrega una URL de foto de entrega
5. Guarda el envío

### Reportar Incidencias
1. Haz clic en "Reportar Incidencia"
2. Ingresa el ID del envío relacionado
3. Describe el tipo de incidencia
4. Agrega observaciones
5. Sube una foto de evidencia (opcional)
6. Reporta la incidencia

### Filtrar y Buscar
- Utiliza la barra de búsqueda para encontrar envíos por destinatario o ID
- Filtra por estado: Pendiente, En Ruta, Entregado
- Exporta los resultados a Excel

## 🔒 Seguridad

El sistema implementa múltiples capas de seguridad:
- Contraseñas hasheadas con bcrypt
- Headers de seguridad con Helmet
- Protección CSRF
- Sesiones seguras
- Validación de datos en servidor
- Control de acceso basado en autenticación

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es propiedad de **Comercializadora APYCAR**.

## 📧 Contacto

Para soporte o consultas:
- **Empresa**: Comercializadora APYCAR
- **Email**: contacto@apycar.com
- **Sitio Web**: www.apycar.com

## 🔄 Versiones

### v1.0.0 (2024)
- ✅ Sistema de gestión de envíos
- ✅ Gestión de incidencias
- ✅ Sistema de autenticación
- ✅ Diseño responsive
- ✅ Exportación a Excel

## 🙏 Agradecimientos

Desarrollado con ❤️ para optimizar la gestión logística de APYCAR.

---

**© 2024 Comercializadora APYCAR. Todos los derechos reservados.**
