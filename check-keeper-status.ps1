#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check Azure Container Instance Status and Logs
.DESCRIPTION
    Verifies keeper container is running and displays recent logs
#>

param(
    [string]$ResourceGroup = "rg-hack",
    [string]$ContainerName = "cg-hack-keeper"
)

Write-Host "`n🔍 Checking Keeper Container Status...`n" -ForegroundColor Cyan

# Check if logged in
try {
    az account show | Out-Null
} catch {
    Write-Host "❌ Not logged in to Azure. Run: az login" -ForegroundColor Red
    exit 1
}

# Get container status
Write-Host "📊 Container Status:" -ForegroundColor Yellow
az container show `
    --resource-group $ResourceGroup `
    --name $ContainerName `
    --query "{Name:name, State:instanceView.state, RestartCount:containers[0].instanceView.restartCount, CurrentState:containers[0].instanceView.currentState.state, ExitCode:containers[0].instanceView.currentState.exitCode}" `
    --output table

Write-Host "`n📝 Recent Logs (last 50 lines):" -ForegroundColor Yellow
az container logs `
    --resource-group $ResourceGroup `
    --name $ContainerName

Write-Host "`n🔧 Environment Variables:" -ForegroundColor Yellow
az container show `
    --resource-group $ResourceGroup `
    --name $ContainerName `
    --query "containers[0].environmentVariables" `
    --output json

Write-Host "`n💡 Troubleshooting Tips:" -ForegroundColor Cyan
Write-Host "  • If State=Waiting: Check logs for errors"
Write-Host "  • If PRIVATE_KEY shows null: This is normal (secure env var)"
Write-Host "  • Check GitHub Secrets are set:"
Write-Host "    - KEEPER_PRIVATE_KEY"
Write-Host "    - CONTRACT_ADDRESS = 0x78790628A84F05023913A1EECc0B476d5cFa12c0"
Write-Host "  • Restart container: az container restart -g $ResourceGroup -n $ContainerName"
Write-Host ""
