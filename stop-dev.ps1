#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop All Development Services
.DESCRIPTION
    Stops keeper bot and frontend UI background jobs
#>

$ErrorActionPreference = "Stop"

Write-Host "`n🛑 Stopping FlareOptimize Development Environment...`n" -ForegroundColor Yellow

# Find all jobs related to dev environment
$keeperJobs = Get-Job | Where-Object { $_.Command -like "*keeper*" -or $_.Command -like "*npm run dev*" }
$frontendJobs = Get-Job | Where-Object { $_.Command -like "*src*" -or $_.Command -like "*npm run dev*" }

$allJobs = Get-Job | Where-Object { 
    $_.Command -like "*keeper*" -or 
    $_.Command -like "*src*" -or 
    $_.Command -like "*npm run dev*" 
}

if ($allJobs.Count -eq 0) {
    Write-Host "ℹ️  No running jobs found" -ForegroundColor Blue
    Write-Host "`nTip: If services are running in other terminals, close those terminals manually.`n" -ForegroundColor DarkGray
    exit 0
}

Write-Host "Found $($allJobs.Count) background job(s):`n" -ForegroundColor Cyan

foreach ($job in $allJobs) {
    Write-Host "  • Job $($job.Id): $($job.State)" -ForegroundColor White
}

Write-Host ""

# Stop all jobs
foreach ($job in $allJobs) {
    try {
        Write-Host "Stopping Job $($job.Id)... " -NoNewline
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force -ErrorAction SilentlyContinue
        Write-Host "✅" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  (already stopped)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ All services stopped`n" -ForegroundColor Green
