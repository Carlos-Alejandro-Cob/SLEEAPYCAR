# Script completo de verificación de conexión
# Ejecuta como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION COMPLETA DE CONEXION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar servidor
Write-Host "[1] Verificando si el servidor está corriendo..." -ForegroundColor Yellow
$server = netstat -ano | Select-String ":3001.*LISTENING"
if ($server) {
    Write-Host "[OK] Servidor escuchando en puerto 3001" -ForegroundColor Green
    $server | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Extraer la IP
    if ($server -match "(\d+\.\d+\.\d+\.\d+):3001") {
        $listenIP = $matches[1]
        Write-Host "  IP escuchando: $listenIP" -ForegroundColor Cyan
        if ($listenIP -eq "0.0.0.0") {
            Write-Host "  [OK] Servidor escuchando en todas las interfaces" -ForegroundColor Green
        } else {
            Write-Host "  [ADVERTENCIA] Servidor solo escuchando en $listenIP" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[ERROR] Servidor NO está corriendo" -ForegroundColor Red
    Write-Host "  Ejecuta: npm start" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Obtener IPs locales
Write-Host "[2] Obteniendo IPs locales..." -ForegroundColor Yellow
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*"
} | Select-Object IPAddress, InterfaceAlias, PrefixOrigin

if ($ips) {
    Write-Host "[OK] IPs encontradas:" -ForegroundColor Green
    $ips | ForEach-Object { 
        $status = if ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual") { "[ACTIVA]" } else { "" }
        Write-Host "  $($_.IPAddress) - $($_.InterfaceAlias) $status" -ForegroundColor Gray
    }
    
    # IP principal (la que no es 127.x ni 169.254.x)
    $mainIP = ($ips | Where-Object {
        $_.IPAddress -like "10.*" -or 
        $_.IPAddress -like "192.168.*" -or
        $_.IPAddress -like "172.16.*" -or
        $_.IPAddress -like "172.17.*" -or
        $_.IPAddress -like "172.18.*" -or
        $_.IPAddress -like "172.19.*" -or
        $_.IPAddress -like "172.20.*" -or
        $_.IPAddress -like "172.21.*" -or
        $_.IPAddress -like "172.22.*" -or
        $_.IPAddress -like "172.23.*" -or
        $_.IPAddress -like "172.24.*" -or
        $_.IPAddress -like "172.25.*" -or
        $_.IPAddress -like "172.26.*" -or
        $_.IPAddress -like "172.27.*" -or
        $_.IPAddress -like "172.28.*" -or
        $_.IPAddress -like "172.29.*" -or
        $_.IPAddress -like "172.30.*" -or
        $_.IPAddress -like "172.31.*"
    } | Select-Object -First 1).IPAddress
    
    if (-not $mainIP) {
        $mainIP = ($ips | Select-Object -First 1).IPAddress
    }
} else {
    Write-Host "[ERROR] No se encontraron IPs" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Verificar IP en Flutter
Write-Host "[3] Verificando IP configurada en Flutter..." -ForegroundColor Yellow
$flutterFile = "flutter_app\lib\services\api_service.dart"
if (Test-Path $flutterFile) {
    $content = Get-Content $flutterFile -Raw
    if ($content -match "baseUrl\s*=\s*['`"](http://[^'`"]+)['`"]") {
        $flutterIP = $matches[1]
        Write-Host "  IP en Flutter: $flutterIP" -ForegroundColor Cyan
        
        # Extraer solo la IP
        if ($flutterIP -match "http://([^:]+):") {
            $flutterIPOnly = $matches[1]
            Write-Host "  IP extraída: $flutterIPOnly" -ForegroundColor Cyan
            
            if ($flutterIPOnly -eq $mainIP) {
                Write-Host "  [OK] IP coincide con la IP local" -ForegroundColor Green
            } else {
                Write-Host "  [ERROR] IP NO coincide!" -ForegroundColor Red
                Write-Host "    IP local: $mainIP" -ForegroundColor Yellow
                Write-Host "    IP Flutter: $flutterIPOnly" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "  SOLUCION: Actualiza flutter_app\lib\services\api_service.dart" -ForegroundColor Cyan
                Write-Host "    Cambia a: http://$mainIP:3001/mobile/api" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "  [ADVERTENCIA] No se pudo leer la URL de Flutter" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] No se encontró el archivo de Flutter" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar firewall
Write-Host "[4] Verificando reglas de firewall..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*3001*" -or 
    $_.DisplayName -like "*APYCAR*"
}

if ($firewallRules) {
    Write-Host "  Reglas encontradas:" -ForegroundColor Green
    $firewallRules | ForEach-Object {
        $status = if ($_.Enabled) { "HABILITADA" } else { "DESHABILITADA" }
        $color = if ($_.Enabled) { "Green" } else { "Red" }
        Write-Host "    $($_.DisplayName): $status" -ForegroundColor $color
    }
} else {
    Write-Host "  [ADVERTENCIA] No hay reglas de firewall para el puerto 3001" -ForegroundColor Yellow
}
Write-Host ""

# 5. Probar conexión local
Write-Host "[5] Probando conexión local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  [OK] Servidor responde en localhost" -ForegroundColor Green
    Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "  [ERROR] Servidor NO responde en localhost" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# 6. Probar conexión desde IP local
Write-Host "[6] Probando conexión desde IP local ($mainIP)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$mainIP:3001" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  [OK] Servidor responde en $mainIP" -ForegroundColor Green
    Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "  [ERROR] Servidor NO responde en $mainIP" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Esto indica un problema de firewall o red" -ForegroundColor Yellow
}
Write-Host ""

# 7. Probar endpoint de login directamente
Write-Host "[7] Probando endpoint de login..." -ForegroundColor Yellow
try {
    $body = "nombre_usuario=erick&password=test"
    $response = Invoke-WebRequest -Uri "http://localhost:3001/mobile/api/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    Write-Host "  [OK] Endpoint de login responde" -ForegroundColor Green
    Write-Host "    Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "  [INFO] Endpoint de login:" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        Write-Host "    Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
        Write-Host "    (Es normal si las credenciales son incorrectas)" -ForegroundColor Gray
    } else {
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN Y RECOMENDACIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IP Local detectada: $mainIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifica en tu celular:" -ForegroundColor White
Write-Host "  1. Abre un navegador" -ForegroundColor White
Write-Host "  2. Ve a: http://$mainIP:3001" -ForegroundColor Cyan
Write-Host "  3. Si ves la página de login = Funciona" -ForegroundColor Green
Write-Host "  4. Si no carga = Problema de firewall/red" -ForegroundColor Red
Write-Host ""
Write-Host "Si no funciona, ejecuta:" -ForegroundColor Yellow
Write-Host "  netsh advfirewall firewall add rule name=`"APYCAR Backend Port 3001`" dir=in action=allow protocol=TCP localport=3001" -ForegroundColor Cyan
Write-Host ""
pause
