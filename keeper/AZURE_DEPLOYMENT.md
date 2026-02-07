#  Azure Deployment Guide

## What Gets Deployed

When you deploy the keeper to Azure, you're running:
- **Docker container** with Node.js + keeper code
- **Always-on** (restarts if it crashes)
- **Polls blockchain** every 15 seconds
- **Executes payments** when triggers hit
- **Costs ~$1.50/month** (~$0.05/day)

---

## Prerequisites

### 1. Install Azure CLI

**Windows:**
```powershell
winget install -e --id Microsoft.Azure.CLI
```

Or download from: https://aka.ms/installazurecliwindows

**Verify installation:**
```powershell
az version
```

### 2. Login to Azure

```powershell
az login
```

This opens your browser to authenticate.

### 3. Create Keeper Wallet (if you haven't)

**Option A:** Use existing test wallet
- Already configured in `keeper\.env`
- Address: `0xaCaEF733908EE41cdB527dF9C82BB9F910934915`

**Option B:** Create new dedicated keeper wallet
1. Create new MetaMask account
2. Export private key
3. Get testnet tokens: https://faucet.flare.network/coston2
4. Update `.env` file

---

## Deployment Steps

### Quick Deploy (PowerShell)

1. **Edit the deployment script:**

```powershell
notepad deploy-azure-aci.ps1
```

**Change these lines:**
```powershell
$REGISTRY_NAME = "yourname12345acr"  # Make this unique!
$KEEPER_PRIVATE_KEY = "your_actual_private_key_here"
```

2. **Run deployment:**

```powershell
.\deploy-azure-aci.ps1
```

This will:
-  Create Azure resource group
-  Create container registry
-  Build Docker image
-  Deploy container instance
-  Start keeper automatically

**Total time:** ~5-7 minutes

---

## Verify Deployment

### Check if Keeper is Running

```powershell
az container show `
    --resource-group hackathon-rg `
    --name payment-keeper `
    --query '{Status:instanceView.state, RestartCount:containers[0].instanceView.restartCount}'
```

Expected output:
```
Status         RestartCount
-----------    ------------
Running        0
```

### View Live Logs

```powershell
az container logs `
    --resource-group hackathon-rg `
    --name payment-keeper `
    --follow
```

You should see:
```

         Payment Keeper - Automated Execution Service          
           Flare Coston2 Testnet - ETH Oxford 2026            


  Configuration:
   Contract: 0xD6659ea0fe07A6E2Fe458954609b0d2D926CA314
   Keeper Address: 0xaCaEF733908EE41cdB527dF9C82BB9F910934915

 Starting keeper loop...

[timestamp]  Scanning for executable payments...
```

---

## Management Commands

### View Logs (Last 200 lines)
```powershell
az container logs `
    --resource-group hackathon-rg `
    --name payment-keeper `
    --tail 200
```

### Restart Keeper
```powershell
az container restart `
    --resource-group hackathon-rg `
    --name payment-keeper
```

### Stop Keeper
```powershell
az container stop `
    --resource-group hackathon-rg `
    --name payment-keeper
```

### Start Keeper
```powershell
az container start `
    --resource-group hackathon-rg `
    --name payment-keeper
```

### Delete Keeper (cleanup)
```powershell
az container delete `
    --resource-group hackathon-rg `
    --name payment-keeper `
    --yes
```

### Delete Everything (full cleanup)
```powershell
az group delete `
    --name hackathon-rg `
    --yes
```

---

## Updating the Keeper

If you make changes to the keeper code:

### 1. Rebuild and redeploy:

```powershell
# Rebuild image
az acr build `
    --registry youruniqueacr `
    --image payment-keeper:latest `
    --file Dockerfile `
    .

# Restart container to pull new image
az container restart `
    --resource-group hackathon-rg `
    --name payment-keeper
```

### 2. Or just run the deployment script again:

```powershell
.\deploy-azure-aci.ps1
```

---

## Cost Management

### View Current Costs

```powershell
az consumption usage list `
    --start-date 2026-02-01 `
    --end-date 2026-02-28 `
    --query "[?contains(instanceName,'payment-keeper')]"
```

### Set Budget Alert

```powershell
# Create budget alert at $5/month
az consumption budget create `
    --resource-group hackathon-rg `
    --budget-name keeper-budget `
    --amount 5 `
    --time-grain Monthly
```

### Expected Costs

**Azure Container Instances Pricing:**
- CPU: 0.5 cores  $0.0000133/second = $0.96/month
- Memory: 0.5 GB  $0.0000015/second = $0.11/month
- **Total: ~$1.50/month**

*Prices as of Feb 2026, UK South region*

---

## Troubleshooting

### Container won't start

```powershell
az container show `
    --resource-group hackathon-rg `
    --name payment-keeper `
    --query 'containers[0].instanceView.events[]'
```

Common issues:
- **Invalid private key**  Check `.env` value
- **Image pull failed**  Rebuild with `az acr build`
- **Out of memory**  Increase memory in deploy script

### No payments executing

1. **Check keeper is running:**
   ```powershell
   az container logs --resource-group hackathon-rg --name payment-keeper --tail 50
   ```

2. **Check keeper balance:**
   - Keeper needs gas for transactions
   - Get more C2FLR: https://faucet.flare.network/coston2

3. **Check payment triggers:**
   ```powershell
   cd keeper
   npm run test
   ```

### Performance issues

If keeper is slow or missing payments:

1. **Reduce poll interval** (edit deploy script):
   ```powershell
   POLL_INTERVAL=10000  # 10 seconds instead of 15
   ```

2. **Increase resources**:
   ```powershell
   --cpu 1 `
   --memory 1
   ```

---

## Production Considerations

### For Mainnet Deployment:

1. **Use mainnet RPC:**
   ```
   RPC_URL="https://flare-api.flare.network/ext/C/rpc"
   ```

2. **Update contract address** in frontend

3. **Fund keeper wallet** with real FLR

4. **Enable monitoring:**
   - Azure Monitor alerts
   - Email notifications on failures
   - Balance monitoring

5. **Set up backup keepers** for redundancy

6. **Use Azure Key Vault** for private key storage

### Enhanced Security:

```powershell
# Store private key in Key Vault instead of env variable
az keyvault create `
    --name keeper-vault `
    --resource-group hackathon-rg

az keyvault secret set `
    --vault-name keeper-vault `
    --name keeper-key `
    --value "your_private_key"

# Reference in container (requires managed identity setup)
```

---

## Alternative Deployment Options

### Option 2: Azure App Service

Better for web apps, but works for keeper too:

```powershell
az webapp create `
    --resource-group hackathon-rg `
    --plan keeper-plan `
    --name payment-keeper-app `
    --deployment-container-image-name youruniqueacr.azurecr.io/payment-keeper:latest
```

**Cost:** ~$13/month (Basic tier)

### Option 3: Azure Functions (Scheduled)

Run keeper as serverless function:

```powershell
# Create function app
az functionapp create `
    --resource-group hackathon-rg `
    --name keeper-func `
    --storage-account keeperstorage `
    --consumption-plan-location uksouth
```

**Cost:** ~$0.20/month (Consumption plan)

### Option 4: Azure Container Apps

Best for production (auto-scaling):

```powershell
az containerapp create `
    --resource-group hackathon-rg `
    --name payment-keeper `
    --image youruniqueacr.azurecr.io/payment-keeper:latest
```

**Cost:** ~$15/month (always-on)

---

## Summary

### For Hackathon (Demo):
 **Azure Container Instances** - Simplest, cheapest, good enough

### For Production:
 **Azure Container Apps** - Auto-scaling, managed, production-ready

### Quick Start:
```powershell
# 1. Edit deploy script
notepad deploy-azure-aci.ps1

# 2. Run it
.\deploy-azure-aci.ps1

# 3. Watch logs
az container logs --resource-group hackathon-rg --name payment-keeper --follow

# Done! 
```

---

**Questions? Check the logs first:**
```powershell
az container logs --resource-group hackathon-rg --name payment-keeper --tail 100
```
