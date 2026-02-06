@echo off
echo ========================================
echo TEST DE CONEXION AL SERVIDOR
echo ========================================
echo.
echo Verificando que el servidor este escuchando...
netstat -ano | findstr :3001
echo.
echo ========================================
echo INSTRUCCIONES PARA PROBAR DESDE EL CELULAR:
echo ========================================
echo 1. Abre un navegador en tu celular
echo 2. Ve a: http://10.3.1.134:3001
echo 3. Si ves la pagina de login, la conexion funciona
echo 4. Si no carga, el firewall esta bloqueando
echo.
echo ========================================
echo SOLUCION RAPIDA - DESACTIVAR FIREWALL TEMPORALMENTE:
echo ========================================
echo Ejecuta como Administrador:
echo netsh advfirewall set allprofiles state off
echo.
echo Para reactivarlo:
echo netsh advfirewall set allprofiles state on
echo.
pause
