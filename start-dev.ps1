#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start Full Development Environment
.DESCRIPTION
    Starts keeper bot and launches UI. Optionally compiles and deploys contracts.
.EXAMPLE
    .\start-dev.ps1                        # Start services only
    .\start-dev.ps1 -CompileHardhat        # Compile, deploy if changed, then start services
    .\start-dev.ps1 -CompileHardhat -Force # Force deploy and start services
#>

param(
    [switch]$CompileHardhat,
    [switch]$Force
)

Write-Host "Starting development environment..." -ForegroundColor Cyan

if ($CompileHardhat) {
    # Compile
    Write-Host "`nCompiling contract..." -ForegroundColor Yellow
    cd hardhat
    npx hardhat compile
    if ($LASTEXITCODE -ne 0) { exit 1 }
    cd ..

    # Deploy
    $contractFile = "hardhat\contracts\ClaimPayments.sol"
    $hashFile = ".contract-hash"
    $shouldDeploy = $false
    
    if ($Force) {
        $shouldDeploy = $true
    }
    elseif (-not (Test-Path $hashFile)) {
        $shouldDeploy = $true
    }
    elseif (Test-Path $contractFile) {
        $currentHash = (Get-FileHash $contractFile).Hash
        $previousHash = Get-Content $hashFile -Raw
        if ($currentHash -ne $previousHash.Trim()) {
            $shouldDeploy = $true
        }
    }
    
    if ($shouldDeploy) {
        Write-Host "`nDeploying contract..." -ForegroundColor Yellow
        cd hardhat
        npx hardhat run scripts/deploy.ts --network coston2
        if ($LASTEXITCODE -ne 0) { exit 1 }
        cd ..
        
        if (Test-Path $contractFile) {
            $currentHash = (Get-FileHash $contractFile).Hash
            Set-Content -Path $hashFile -Value $currentHash
        }
    }
    else {
        Write-Host "`nContract unchanged, skipping deploy" -ForegroundColor Green
    }
} else {
    Write-Host "`nSkipping contract compilation and deployment (use -CompileHardhat to enable)" -ForegroundColor Gray
}

# Start services in new windows
Write-Host "`nStarting keeper..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\keeper'; npm run dev"

Write-Host "Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\src'; npm run dev"

Write-Host "`nDone! Services running in separate windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
