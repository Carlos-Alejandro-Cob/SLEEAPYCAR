# Diagnóstico Completo de Conexión Móvil
# Ejecuta como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTICO DE CONEXION MOVIL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse como ADMINISTRADOR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta PowerShell como Administrador:" -ForegroundColor Yellow
    Write-Host "  Start-Process powershell -Verb RunAs" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

Write-Host "[PASO 1] Verificando si el servidor está corriendo..." -ForegroundColor Yellow
$serverRunning = netstat -ano | Select-String ":3001.*LISTENING"
if ($serverRunning) {
    Write-Host "[OK] El servidor está escuchando en el puerto 3001" -ForegroundColor Green
    $serverRunning | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "[ERROR] El servidor NO está corriendo en el puerto 3001" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, inicia el servidor:" -ForegroundColor Yellow
    Write-Host "  npm start" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}
Write-Host ""

Write-Host "[PASO 2] Obteniendo IPs locales..." -ForegroundColor Yellow
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object IPAddress, InterfaceAlias
if ($ips) {
    Write-Host "[OK] IPs encontradas:" -ForegroundColor Green
    $ips | ForEach-Object { 
        Write-Host "  $($_.IPAddress) - $($_.InterfaceAlias)" -ForegroundColor Gray
    }
    $mainIP = ($ips | Where-Object {$_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress
    if (-not $mainIP) {
        $mainIP = ($ips | Select-Object -First 1).IPAddress
    }
    Write-Host ""
    Write-Host "IP principal detectada: $mainIP" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] No se encontraron IPs locales" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

Write-Host "[PASO 3] Verificando reglas de firewall existentes..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3001*" -or $_.DisplayName -like "*APYCAR*"}
if ($firewallRules) {
    Write-Host "[OK] Reglas de firewall encontradas:" -ForegroundColor Green
    $firewallRules | ForEach-Object {
        $status = if ($_.Enabled) { "HABILITADA" } else { "DESHABILITADA" }
        $color = if ($_.Enabled) { "Green" } else { "Red" }
        Write-Host "  $($_.DisplayName): $status" -ForegroundColor $color
        Write-Host "    Dirección: $($_.Direction)" -ForegroundColor Gray
        Write-Host "    Acción: $($_.Action)" -ForegroundColor Gray
    }
} else {
    Write-Host "[ADVERTENCIA] No se encontraron reglas de firewall para el puerto 3001" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[PASO 4] Verificando filtros de puerto específicos..." -ForegroundColor Yellow
$portFilters = Get-NetFirewallPortFilter | Where-Object {$_.LocalPort -eq 3001}
$portRules = Get-NetFirewallRule | Get-NetFirewallPortFilter | Where-Object {$_.LocalPort -eq 3001}
if ($portRules) {
    Write-Host "[OK] Se encontraron filtros para el puerto 3001" -ForegroundColor Green
} else {
    Write-Host "[PROBLEMA] No hay filtros de firewall permitiendo el puerto 3001" -ForegroundColor Red
}
Write-Host ""

Write-Host "[PASO 5] Verificando estado del firewall..." -ForegroundColor Yellow
$firewallProfiles = Get-NetFirewallProfile
$firewallProfiles | ForEach-Object {
    $status = if ($_.Enabled) { "ACTIVO" } else { "INACTIVO" }
    $color = if ($_.Enabled) { "Yellow" } else { "Green" }
    Write-Host "  Perfil $($_.Name): $status" -ForegroundColor $color
}
Write-Host ""

Write-Host "[PASO 6] Creando/Eliminando y recreando regla de firewall..." -ForegroundColor Yellow
try {
    # Eliminar reglas existentes
    Remove-NetFirewallRule -Name "APYCAR Backend Port 3001" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "APYCAR Backend Port 3001" -ErrorAction SilentlyContinue
    Write-Host "  Reglas anteriores eliminadas" -ForegroundColor Gray
    
    # Crear nueva regla más permisiva
    New-NetFirewallRule `
        -DisplayName "APYCAR Backend Port 3001" `
        -Name "APYCAR Backend Port 3001" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3001 `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Permite conexiones entrantes al backend APYCAR en puerto 3001" `
        -Enabled True | Out-Null
    
    Write-Host "[OK] Regla de firewall creada exitosamente" -ForegroundColor Green
    
    # Verificar que se creó correctamente
    $newRule = Get-NetFirewallRule -Name "APYCAR Backend Port 3001" -ErrorAction SilentlyContinue
    if ($newRule -and $newRule.Enabled) {
        Write-Host "[OK] Regla verificada y habilitada" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] La regla no se habilitó correctamente" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] No se pudo crear la regla: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta manualmente:" -ForegroundColor Yellow
    Write-Host "netsh advfirewall firewall add rule name=`"APYCAR Backend Port 3001`" dir=in action=allow protocol=TCP localport=3001" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "[PASO 7] Verificando que el servidor escuche en todas las interfaces..." -ForegroundColor Yellow
$listening = netstat -ano | Select-String ":3001.*LISTENING"
$listeningOnAll = $listening | Where-Object {$_ -like "*0.0.0.0:3001*" -or $_ -like "*:::3001*"}
if ($listeningOnAll) {
    Write-Host "[OK] El servidor está escuchando en todas las interfaces (0.0.0.0)" -ForegroundColor Green
} else {
    Write-Host "[ADVERTENCIA] El servidor puede no estar escuchando en todas las interfaces" -ForegroundColor Yellow
    Write-Host "  Verifica que en app.js tengas: app.listen(port, '0.0.0.0', ...)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[PASO 8] Prueba de conectividad local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] El servidor responde en localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] El servidor no responde en localhost:3001" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[PASO 9] Prueba de conectividad desde IP local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$mainIP:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] El servidor responde en $mainIP:3001" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] El servidor no responde en $mainIP:3001" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Esto puede indicar:" -ForegroundColor Yellow
    Write-Host "  1. El firewall todavía está bloqueando" -ForegroundColor Yellow
    Write-Host "  2. El servidor no está escuchando en todas las interfaces" -ForegroundColor Yellow
    Write-Host "  3. Hay un problema de red" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN Y SIGUIENTE PASO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verifica que la IP en Flutter sea: $mainIP" -ForegroundColor White
Write-Host "   Archivo: flutter_app\lib\services\api_service.dart" -ForegroundColor Gray
Write-Host "   URL: http://$mainIP:3001/mobile/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Prueba desde tu celular (mismo WiFi):" -ForegroundColor White
Write-Host "   http://$mainIP:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Si sigue sin funcionar, desactiva temporalmente el firewall:" -ForegroundColor Yellow
Write-Host "   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False" -ForegroundColor Cyan
Write-Host "   (Para reactivarlo: Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Verifica que ambos dispositivos estén en la misma red WiFi" -ForegroundColor White
Write-Host ""

pause
