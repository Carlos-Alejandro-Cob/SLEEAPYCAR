@echo off
echo ========================================
echo   APYCAR Repartidor - Ejecutar App
echo ========================================
echo.

echo Verificando dispositivos disponibles...
flutter devices
echo.

echo Selecciona una opcion:
echo 1. Ejecutar en Chrome (Web)
echo 2. Ejecutar en Windows Desktop
echo 3. Ver dispositivos disponibles
echo 4. Instalar dependencias
echo 5. Salir
echo.

set /p opcion="Ingresa el numero de opcion: "

if "%opcion%"=="1" (
    echo.
    echo Ejecutando en Chrome...
    flutter run -d chrome
) else if "%opcion%"=="2" (
    echo.
    echo Habilitando soporte Windows...
    flutter create . --platforms=windows
    echo.
    echo Ejecutando en Windows...
    flutter run -d windows
) else if "%opcion%"=="3" (
    echo.
    flutter devices
    pause
) else if "%opcion%"=="4" (
    echo.
    echo Instalando dependencias...
    flutter pub get
    pause
) else if "%opcion%"=="5" (
    exit
) else (
    echo Opcion invalida
    pause
)
