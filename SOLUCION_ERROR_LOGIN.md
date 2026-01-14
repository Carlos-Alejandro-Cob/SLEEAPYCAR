# Solución: Error "Credenciales incorrectas" / ERR_CONNECTION_REFUSED

## Problema Identificado

El error `ERR_CONNECTION_REFUSED` indica que **el servidor backend no está corriendo** en el puerto 3001.

## Solución Paso a Paso

### Paso 1: Iniciar el Servidor Backend

Abre una **nueva terminal** y ejecuta:

```bash
# Navega a la carpeta raíz del proyecto
cd C:\code\Outsystem\SLEEAPYCAR

# Inicia el servidor
npm start
```

O si prefieres modo desarrollo con auto-reload:

```bash
npm run dev
```

Deberías ver un mensaje como:
```
Servidor SLEE corriendo en http://localhost:3001
```

### Paso 2: Verificar que el Servidor Esté Corriendo

Abre tu navegador y visita:
- http://localhost:3001/auth/login

Si puedes ver la página de login, el servidor está funcionando correctamente.

### Paso 3: Verificar la URL en Flutter

Asegúrate de que en `flutter_app/lib/services/api_service.dart` la URL sea:

```dart
static const String baseUrl = 'http://localhost:3001/mobile/api';
```

### Paso 4: Probar el Login Nuevamente

1. Asegúrate de que el servidor backend esté corriendo
2. Ejecuta la app Flutter:
   ```bash
   cd flutter_app
   flutter run -d chrome
   ```
3. Intenta hacer login con:
   - Usuario: `erick`
   - Contraseña: `erick`

## Verificación del Endpoint de Login

Puedes probar el endpoint directamente con curl o Postman:

```bash
curl -X POST http://localhost:3001/mobile/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "nombre_usuario=erick&password=erick"
```

Deberías recibir una respuesta JSON con `success: true` si las credenciales son correctas.

## Si el Problema Persiste

### Verificar que el Usuario Existe y Tiene el Rol Correcto

Ejecuta el script de verificación:

```bash
node scripts/verificarUsuarioRepartidor.js
```

Este script verificará y actualizará el usuario "erick" si es necesario.

### Verificar los Logs del Servidor

Cuando intentes hacer login, revisa la terminal donde está corriendo el servidor para ver si hay errores.

### Verificar CORS (si es necesario)

Si sigues teniendo problemas de conexión, puede ser un tema de CORS. El servidor ya tiene configurado Helmet, pero asegúrate de que las rutas móviles estén accesibles.

## Comandos Útiles

```bash
# Verificar si el puerto 3001 está en uso
netstat -ano | findstr :3001

# Matar un proceso que esté usando el puerto (si es necesario)
# Primero encuentra el PID con el comando anterior, luego:
taskkill /PID <numero_pid> /F
```
