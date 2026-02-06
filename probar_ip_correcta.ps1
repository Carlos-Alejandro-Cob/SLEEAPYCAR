# Probar cuál IP funciona desde la red local
Write-Host "Probando conexiones..." -ForegroundColor Cyan
Write-Host ""

# IPs detectadas
$ips = @("192.168.137.1", "10.28.48.216")

foreach ($ip in $ips) {
    Write-Host "Probando $ip:3001..." -ForegroundColor Yellow
    
    # Test TCP
    $tcpTest = Test-NetConnection -ComputerName $ip -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($tcpTest) {
        Write-Host "  [OK] Puerto 3001 accesible via TCP" -ForegroundColor Green
    } else {
        Write-Host "  [FALLO] Puerto 3001 NO accesible via TCP" -ForegroundColor Red
    }
    
    # Test HTTP
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:3001" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "  [OK] HTTP responde (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "  → USA ESTA IP EN FLUTTER: $ip" -ForegroundColor Cyan
    } catch {
        Write-Host "  [FALLO] HTTP no responde: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Si ninguna IP funcionó, el firewall está bloqueando." -ForegroundColor Yellow
Write-Host "Ejecuta como Administrador:" -ForegroundColor Yellow
Write-Host "  netsh advfirewall firewall add rule name=`"APYCAR Backend Port 3001`" dir=in action=allow protocol=TCP localport=3001" -ForegroundColor Cyan
