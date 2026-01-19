# Solucionar Firewall para APYCAR Backend
# Ejecuta este script como Administrador en PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SOLUCIONAR FIREWALL - PUERTO 3001" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse como ADMINISTRADOR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta PowerShell como Administrador y luego ejecuta:" -ForegroundColor Yellow
    Write-Host "  .\solucionar_firewall.ps1" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Verificar si el servidor está corriendo
Write-Host "[PASO 1] Verificando si el servidor está corriendo..." -ForegroundColor Yellow
$serverRunning = netstat -ano | Select-String ":3001"
if (-not $serverRunning) {
    Write-Host "[ADVERTENCIA] El servidor NO está escuchando en el puerto 3001" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, inicia el servidor primero ejecutando:" -ForegroundColor Yellow
    Write-Host "  npm start" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
} else {
    Write-Host "[OK] El servidor está corriendo en el puerto 3001" -ForegroundColor Green
    Write-Host ""
}

# Obtener IP local
Write-Host "[PASO 2] Obteniendo tu IP local..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress
if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object -First 1).IPAddress
}
Write-Host "[OK] IP local detectada: $ip" -ForegroundColor Green
Write-Host ""

# Eliminar regla existente si existe
Write-Host "[PASO 3] Configurando regla de firewall..." -ForegroundColor Yellow
$existingRule = Get-NetFirewallRule -Name "APYCAR Backend Port 3001" -ErrorAction SilentlyContinue
if ($existingRule) {
    Remove-NetFirewallRule -Name "APYCAR Backend Port 3001" -ErrorAction SilentlyContinue
    Write-Host "Regla anterior eliminada" -ForegroundColor Gray
}

# Crear nueva regla de firewall
try {
    New-NetFirewallRule -DisplayName "APYCAR Backend Port 3001" -Name "APYCAR Backend Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Regla de firewall creada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo crear la regla de firewall: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta con el comando manual:" -ForegroundColor Yellow
    Write-Host "netsh advfirewall firewall add rule name=`"APYCAR Backend Port 3001`" dir=in action=allow protocol=TCP localport=3001" -ForegroundColor Cyan
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tu servidor está configurado para aceptar conexiones desde dispositivos móviles." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Actualiza la URL en tu app Flutter con esta IP:" -ForegroundColor Yellow
Write-Host "  http://$ip:3001/mobile/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivo a editar: flutter_app\lib\services\api_service.dart" -ForegroundColor Gray
Write-Host "Busca la línea: static const String baseUrl = ..." -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRUEBA RAPIDA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abre un navegador en tu celular (mismo WiFi que esta PC)" -ForegroundColor White
Write-Host "2. Ve a: http://$ip:3001" -ForegroundColor Cyan
Write-Host "3. Si ves la página de login, ¡todo funciona!" -ForegroundColor Green
Write-Host ""
pause
