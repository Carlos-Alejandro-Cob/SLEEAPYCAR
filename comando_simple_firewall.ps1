# COMANDO SIMPLE PARA PERMITIR PUERTO 3001
# Ejecuta este script como Administrador o copia y pega estos comandos

Write-Host "Ejecutando comandos de firewall..." -ForegroundColor Yellow

# Método 1: PowerShell nativo
try {
    # Eliminar reglas existentes
    Remove-NetFirewallRule -Name "APYCAR Backend Port 3001" -ErrorAction SilentlyContinue
    Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*APYCAR*"} | Remove-NetFirewallRule -ErrorAction SilentlyContinue
    
    # Crear nueva regla
    New-NetFirewallRule -DisplayName "APYCAR Backend Port 3001" -Name "APYCAR Backend Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Domain,Private,Public -Enabled True
    
    Write-Host "[OK] Regla creada con PowerShell" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Falló método PowerShell: $_" -ForegroundColor Red
    Write-Host "Intentando con netsh..." -ForegroundColor Yellow
    
    # Método 2: netsh (más compatible)
    netsh advfirewall firewall delete rule name="APYCAR Backend Port 3001" 2>$null
    netsh advfirewall firewall add rule name="APYCAR Backend Port 3001" dir=in action=allow protocol=TCP localport=3001
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Regla creada con netsh" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] También falló netsh" -ForegroundColor Red
    }
}

# Verificar
Write-Host ""
Write-Host "Verificando reglas..." -ForegroundColor Yellow
$rules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3001*" -or $_.DisplayName -like "*APYCAR*"}
if ($rules) {
    $rules | Format-Table DisplayName, Enabled, Direction -AutoSize
} else {
    Write-Host "No se encontraron reglas (puede que se haya creado pero con otro nombre)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verificando que el puerto esté abierto..." -ForegroundColor Yellow
netstat -ano | Select-String ":3001.*LISTENING"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Si aún no funciona, prueba desactivar temporalmente el firewall:" -ForegroundColor Yellow
Write-Host "Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para reactivarlo después:" -ForegroundColor Gray
Write-Host "Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True" -ForegroundColor Gray
Write-Host ""

pause
