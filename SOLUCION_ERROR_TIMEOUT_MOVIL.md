# Solución: Error de Timeout al Conectar App Móvil

## Problema

Al intentar iniciar sesión desde la app móvil Flutter, aparece el error:
```
Error en login: Exception: Tiempo de espera agotado
```

Aunque el backend esté corriendo, el dispositivo móvil no puede conectarse.

## Causa Principal

**El Firewall de Windows está bloqueando las conexiones entrantes al puerto 3001.**

Cuando usas un dispositivo físico, la conexión viene desde otra máquina en la red, por lo que Windows considera esto como una "conexión entrante" y la bloquea por defecto.

## Solución Automática (Recomendada)

### Paso 1: Ejecutar el Script de Solución

1. **Cierra esta ventana si está abierta**
2. **Haz clic derecho** en el archivo `solucionar_conexion_movil.bat`
3. Selecciona **"Ejecutar como administrador"**
4. Sigue las instrucciones que aparecen en pantalla

Este script automáticamente:
- ✅ Verifica que el servidor esté corriendo
- ✅ Obtiene tu IP local
- ✅ Configura el firewall para permitir conexiones
- ✅ Te muestra la URL correcta para usar en Flutter

### Paso 2: Verificar la URL en Flutter

Después de ejecutar el script, edita el archivo:
```
flutter_app/lib/services/api_service.dart
```

Busca la línea 21 y asegúrate de que tenga la IP correcta:
```dart
static const String baseUrl = 'http://TU_IP:3001/mobile/api';
```

El script te mostrará cuál es tu IP actual.

### Paso 3: Probar la Conexión

1. **En tu celular** (conectado al mismo WiFi que tu PC):
   - Abre un navegador
   - Ve a: `http://TU_IP:3001`
   - Si ves la página de login, ¡funciona!

2. **En la app Flutter**:
   - Intenta hacer login nuevamente
   - Debería funcionar ahora

## Solución Manual

Si prefieres hacerlo manualmente:

### 1. Configurar el Firewall

1. Abre **Windows Defender Firewall**
2. Click en **"Configuración avanzada"**
3. Click en **"Reglas de entrada"** (Inbound Rules)
4. Click en **"Nueva regla"**
5. Selecciona **"Puerto"** y click Siguiente
6. Selecciona **TCP** y escribe **3001** en "Puertos locales específicos"
7. Selecciona **"Permitir la conexión"**
8. Marca las tres casillas (Dominio, Privada, Pública)
9. Nombra la regla: "APYCAR Backend Port 3001"
10. Click Finalizar

### 2. Obtener tu IP Local

Abre PowerShell o CMD y ejecuta:
```powershell
ipconfig
```

Busca "Dirección IPv4" o "IPv4 Address". Ejemplo: `192.168.1.100`

### 3. Actualizar la URL en Flutter

Edita `flutter_app/lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://TU_IP:3001/mobile/api';
```

## Verificación Rápida

Ejecuta este comando para verificar que el puerto esté abierto:
```powershell
netstat -ano | findstr :3001
```

Deberías ver algo como:
```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
```

Si aparece `0.0.0.0:3001`, el servidor está escuchando en todas las interfaces ✅

## Solución de Problemas

### Error: "Connection refused"
- El servidor no está corriendo
- Ejecuta: `npm start` en la carpeta raíz

### Error: "Failed host lookup"
- La IP es incorrecta
- Verifica tu IP con: `ipconfig`
- Asegúrate de usar la IP correcta en Flutter

### Error: "Network unreachable"
- El dispositivo móvil está en una red WiFi diferente
- Conecta ambos (PC y móvil) a la misma red WiFi

### El firewall sigue bloqueando
1. Desactiva temporalmente el firewall para probar:
   ```powershell
   netsh advfirewall set allprofiles state off
   ```
2. Prueba la conexión
3. Si funciona, reactiva el firewall y configura la regla correctamente:
   ```powershell
   netsh advfirewall set allprofiles state on
   ```

## Notas Importantes

⚠️ **Mismo WiFi**: El dispositivo móvil y la PC deben estar en la misma red WiFi

⚠️ **IP Dinámica**: Si tu IP cambia, tendrás que actualizar la URL en Flutter

⚠️ **Emulador vs Físico**:
- **Emulador Android**: Usa `http://10.0.2.2:3001/mobile/api`
- **Dispositivo Físico**: Usa `http://TU_IP_LOCAL:3001/mobile/api`

## Timeout Aumentado

Se aumentó el timeout de 10 a 30 segundos en la app Flutter para dar más tiempo a la conexión y mejor diagnóstico.
