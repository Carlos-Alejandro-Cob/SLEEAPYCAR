# Solución Rápida - Error de Timeout en App Móvil

## Ejecuta estos comandos en PowerShell como ADMINISTRADOR

### Paso 1: Abrir PowerShell como Administrador
- Clic derecho en el menú Inicio
- Selecciona "Windows PowerShell (Administrador)" o "Terminal (Administrador)"

### Paso 2: Ejecutar estos comandos (copia y pega uno por uno):

```powershell
# Eliminar reglas existentes
netsh advfirewall firewall delete rule name="APYCAR Backend Port 3001"

# Crear nueva regla de entrada
netsh advfirewall firewall add rule name="APYCAR Backend Port 3001" dir=in action=allow protocol=TCP localport=3001

# Crear también regla de salida (por si acaso)
netsh advfirewall firewall add rule name="APYCAR Backend Port 3001 OUT" dir=out action=allow protocol=TCP localport=3001

# Verificar que se crearon
netsh advfirewall firewall show rule name="APYCAR Backend Port 3001"
```

### Paso 3: Verificar que el servidor esté corriendo
```powershell
    netstat -ano | findstr ":3001"
```

Deberías ver algo como:
```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
```

### Paso 4: Si todavía no funciona, desactiva temporalmente el firewall

⚠️ **SOLO PARA PRUEBAS - Reactiva después**

```powershell
# Desactivar firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Prueba la app móvil

# IMPORTANTE: Reactivar firewall después
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

### Paso 5: Verificar tu IP local

```powershell
ipconfig | findstr IPv4
```

Asegúrate de que en Flutter uses esa IP:
- Archivo: `flutter_app\lib\services\api_service.dart`
- Línea 21: `static const String baseUrl = 'http://TU_IP:3001/mobile/api';`

## Si NADA funciona

### Verificar que no haya otro firewall/antivirus bloqueando
1. Windows Defender
2. Antivirus de terceros (Norton, McAfee, etc.)
3. Firewall del router

### Prueba desde el celular
1. Abre un navegador en tu celular
2. Ve a: `http://TU_IP:3001`
3. Si NO carga, el problema es el firewall/red
4. Si SÍ carga, el problema está en la app Flutter

### Comando alternativo más agresivo (si nada más funciona)

```powershell
# Permitir Node.js completamente
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```
