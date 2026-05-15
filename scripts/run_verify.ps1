$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root "scripts\verify_output.txt"

function Write-Log($msg) {
  Add-Content -Path $log -Value $msg
  Write-Host $msg
}

Remove-Item -Path $log -ErrorAction SilentlyContinue

Write-Log "Starting trust-score-service..."
$trust = Start-Process -FilePath "python" -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","8003" -WorkingDirectory (Join-Path $root "trust-score-service") -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Log "Starting gateway..."
$gateway = Start-Process -FilePath "python" -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","8000" -WorkingDirectory (Join-Path $root "gateway") -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Log "Running verify_integration.py..."
python (Join-Path $root "scripts\verify_integration.py") 2>&1 | ForEach-Object { Write-Log $_ }

Write-Log "Stopping processes..."
Stop-Process -Id $trust.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $gateway.Id -Force -ErrorAction SilentlyContinue
