@echo off
chcp 65001 >nul
echo ========================================
echo SOLUCIONADOR DE CONEXION MOVIL
echo ========================================
echo.
echo Este script resolverá los problemas de conexión entre tu app móvil
echo y el servidor backend.
echo.
echo.

REM Verificar si está ejecutándose como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este script debe ejecutarse como ADMINISTRADOR
    echo.
    echo Por favor:
    echo 1. Cierra esta ventana
    echo 2. Haz clic derecho en este archivo
    echo 3. Selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [PASO 1] Verificando si el servidor está corriendo...
netstat -ano | findstr :3001 >nul
if %errorLevel% neq 0 (
    echo [ADVERTENCIA] El servidor NO está escuchando en el puerto 3001
    echo.
    echo Por favor, inicia el servidor primero ejecutando:
    echo   npm start
    echo   O
    echo   node app.js
    echo.
    pause
    exit /b 1
) else (
    echo [OK] El servidor está corriendo en el puerto 3001
    echo.
)

echo [PASO 2] Obteniendo tu IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo [OK] IP local detectada: !IP!
    goto :ip_found
)
:ip_found

echo.
echo [PASO 3] Configurando regla de firewall para permitir conexiones entrantes...
echo.

REM Eliminar regla existente si existe
netsh advfirewall firewall delete rule name="APYCAR Backend Port 3001" >nul 2>&1

REM Crear nueva regla para permitir TCP en puerto 3001
netsh advfirewall firewall add rule name="APYCAR Backend Port 3001" dir=in action=allow protocol=TCP localport=3001

if %errorLevel% equ 0 (
    echo [OK] Regla de firewall creada exitosamente
) else (
    echo [ERROR] No se pudo crear la regla de firewall
    echo.
    pause
    exit /b 1
)

echo.
echo [PASO 4] Verificando que la regla esté activa...
netsh advfirewall firewall show rule name="APYCAR Backend Port 3001" | findstr "Habilitado.*Sí" >nul
if %errorLevel% equ 0 (
    echo [OK] Regla de firewall está habilitada
) else (
    echo [ADVERTENCIA] La regla puede no estar habilitada correctamente
)

echo.
echo ========================================
echo CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Tu servidor está configurado para aceptar conexiones desde dispositivos móviles.
echo.
echo IMPORTANTE: Actualiza la URL en tu app Flutter con esta IP:
echo   http://%IP%:3001/mobile/api
echo.
echo Archivo a editar: flutter_app\lib\services\api_service.dart
echo Busca la línea: static const String baseUrl = ...
echo.
echo ========================================
echo PRUEBA RAPIDA
echo ========================================
echo.
echo 1. Abre un navegador en tu celular (mismo WiFi que esta PC)
echo 2. Ve a: http://%IP%:3001
echo 3. Si ves la página de login, ¡todo funciona!
echo.
echo ========================================
echo.
pause
