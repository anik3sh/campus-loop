# Campus Loop — Start All Services
# Run from the campus-loop directory: .\start.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        CAMPUS LOOP - Starting        ║" -ForegroundColor Green  
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Check .env file
$envPath = Join-Path $PSScriptRoot "server\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "gsk_placeholder") {
        Write-Host "⚠️  WARNING: GROQ_API_KEY is not configured." -ForegroundColor Yellow
        Write-Host "   AI features will show a fallback message." -ForegroundColor Yellow
        Write-Host "   Get a free key at: https://console.groq.com/keys" -ForegroundColor Yellow
        Write-Host "   Then edit: server\.env" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "✅ GROQ API key detected" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No .env file found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item "$PSScriptRoot\server\.env.example" $envPath
}

Write-Host "🚀 Starting backend on http://localhost:5000 ..." -ForegroundColor Cyan
$server = Start-Process -FilePath "node" `
    -ArgumentList "node_modules/tsx/dist/cli.mjs", "src/index.ts" `
    -WorkingDirectory "$PSScriptRoot\server" `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "🌐 Starting frontend on http://localhost:5173 ..." -ForegroundColor Cyan
$client = Start-Process -FilePath "cmd" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory "$PSScriptRoot\client" `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Campus Loop is running!" -ForegroundColor Green
Write-Host ""
Write-Host "   App:    http://localhost:5173" -ForegroundColor White
Write-Host "   API:    http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "   Demo login: aryan@student.in / pass123" -ForegroundColor Gray
Write-Host "   Admin:      admin@campusloop.in / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C or close this window to stop..." -ForegroundColor Gray

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

# Wait for Ctrl+C
try {
    Wait-Process -Id $server.Id
} finally {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $client.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped." -ForegroundColor Gray
}
