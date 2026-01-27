# Problema Identificado: IP Incorrecta en Flutter

## Problema
La app Flutter está intentando conectarse a `10.3.1.134:3001`, pero esa IP **ya no existe** o **no es accesible** desde tu red actual.

## IPs Actuales Detectadas
Tu computadora tiene estas IPs activas:
- `192.168.137.1` ← **RECOMENDADA** (red local)
- `10.28.48.216` (posible red corporativa/VPN)

## Solución Aplicada
✅ Se actualizó la IP en Flutter a: `192.168.137.1`

Archivo modificado: `flutter_app/lib/services/api_service.dart`

## Verificación

### 1. Prueba desde el celular
Abre un navegador en tu celular y ve a:
```
http://192.168.137.1:3001
```

Si ves la página de login, la IP es correcta ✅

### 2. Si esa IP no funciona, prueba con la otra
Si `192.168.137.1` no funciona, cambia a `10.28.48.216`:
- Edita: `flutter_app/lib/services/api_service.dart`
- Línea 21: Cambia a `http://10.28.48.216:3001/mobile/api`

### 3. Verifica que ambos dispositivos estén en la misma red
- Tu PC y tu celular deben estar en la **misma red WiFi**
- Si usas hotspot desde tu PC, el celular debe conectarse a ese hotspot

## Comandos Útiles

### Verificar IP actual
```powershell
ipconfig | findstr IPv4
```

### Verificar que el servidor escucha
```powershell
netstat -ano | findstr ":3001"
```

### Probar conexión desde PowerShell
```powershell
Invoke-WebRequest -Uri "http://192.168.137.1:3001" -UseBasicParsing
```

## Nota Importante
Las IPs pueden cambiar si:
- Te desconectas y reconectas a WiFi
- Usas hotspot diferente
- Cambias de red

Si la IP cambia, actualiza `flutter_app/lib/services/api_service.dart` con la nueva IP.
