@echo off
echo ========================================
echo   Iniciando Servidor Backend APYCAR
echo ========================================
echo.
echo Verificando dependencias...
call npm list --depth=0 >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando servidor en http://localhost:3001
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
call npm start
