@echo off
echo ========================================
echo OBTENER IP PARA CONFIGURAR FLUTTER
echo ========================================
echo.
echo Buscando direcciones IPv4 activas...
echo.
ipconfig | findstr /i "IPv4"
echo.
echo ========================================
echo INSTRUCCIONES:
echo ========================================
echo 1. Busca la IP que empiece con 192.168.43.x o 192.168.137.x
echo 2. Copia esa IP
echo 3. Actualiza la URL en: flutter_app\lib\services\api_service.dart
echo 4. Cambia la linea que dice: static const String baseUrl = ...
echo 5. Usa: http://TU_IP_AQUI:3001/mobile/api
echo.
echo Ejemplo: http://192.168.43.100:3001/mobile/api
echo.
pause
