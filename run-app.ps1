# GST Billing App - Quick Start Script
# This script will help you run the app on your Android emulator

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "GST Billing App - Quick Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we're in the right directory
$currentDir = Get-Location
Write-Host "[1/5] Checking directory..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✓ In correct directory: $currentDir" -ForegroundColor Green
} else {
    Write-Host "✗ Error: Not in project directory!" -ForegroundColor Red
    Write-Host "Please run this script from: C:\Users\sanal\Downloads\dev\cursor_projects\gst_billing" -ForegroundColor Red
    exit 1
}

# Step 2: Check Node.js
Write-Host ""
Write-Host "[2/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Node.js not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Check if node_modules exists
Write-Host ""
Write-Host "[3/5] Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Error installing dependencies!" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Check emulator
Write-Host ""
Write-Host "[4/5] Checking Android emulator..." -ForegroundColor Yellow
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $adbPath) {
    $devices = & $adbPath devices | Select-String "device$"
    if ($devices) {
        Write-Host "✓ Android emulator detected:" -ForegroundColor Green
        & $adbPath devices
    } else {
        Write-Host "⚠ No emulator detected!" -ForegroundColor Yellow
        Write-Host "Please start your Android emulator from Android Studio" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Press any key after starting the emulator..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
} else {
    Write-Host "⚠ ADB not found. Android SDK may not be properly installed." -ForegroundColor Yellow
}

# Step 5: Kill any existing Metro bundler
Write-Host ""
Write-Host "[5/5] Cleaning up old processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠ Stopping existing Metro bundler..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✓ Cleaned up" -ForegroundColor Green
} else {
    Write-Host "✓ No cleanup needed" -ForegroundColor Green
}

# Start the app
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Starting GST Billing App..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app will:" -ForegroundColor White
Write-Host "  1. Start Metro bundler (JavaScript bundler)" -ForegroundColor White
Write-Host "  2. Build the Android app" -ForegroundColor White
Write-Host "  3. Install on your emulator" -ForegroundColor White
Write-Host "  4. Open automatically" -ForegroundColor White
Write-Host ""
Write-Host "This may take 2-3 minutes on first run..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the bundler when done testing" -ForegroundColor Cyan
Write-Host ""

# Run the app
npm run android

