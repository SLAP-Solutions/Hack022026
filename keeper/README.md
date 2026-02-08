#  Payment Keeper - Automated Execution Service

Autonomous bot that monitors and executes trigger-based payments when price conditions are met.

## 🚀 Deployment Options

### Local Development
Run keeper on your machine for testing:
```powershell
.\start-dev.ps1  # From repo root
# or
cd keeper && npm run dev
```

---

##  What It Does

- **Monitors** all pending payments in the ClaimsPayments contract
- **Checks** FTSO price feeds every 15 seconds
- **Executes** payments automatically when stop loss or take profit triggers hit
- **Retries** failed executions (up to 3 attempts)
- **Logs** all activity with timestamps and transaction hashes

##  Architecture

```
Keeper Service (Node.js) 
     polls every 15s
Contract.getTotalPayments()
     for each payment
Check: executed? expired? trigger hit?
     if trigger hit
Contract.executeClaimPayment(id)
     transaction sent
Payment executed 
```

##  Setup

### 1. Install Dependencies

```bash
cd keeper
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set your keeper wallet private key:

```env
KEEPER_PRIVATE_KEY="your_private_key_here"
RPC_URL="https://coston2-api.flare.network/ext/C/rpc"
CONTRACT_ADDRESS="0xYourContractAddressHere"  # Optional for local dev
POLL_INTERVAL=15000
GAS_LIMIT=500000
```

** Important:**
- Use a dedicated keeper wallet (not your main wallet)
- Keeper wallet needs C2FLR for gas (get from faucet)
- Anyone can run a keeper (permissionless)
- `CONTRACT_ADDRESS` is optional locally (auto-reads from deployment.json)
- For production/Azure, `CONTRACT_ADDRESS` must be set via environment variable

### 3. Get Testnet Tokens

The keeper wallet needs C2FLR for gas fees:

```
https://faucet.flare.network/coston2
```

Minimum recommended: 1 C2FLR

##  Running the Keeper

### Development Mode (auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Expected Output

```

         Payment Keeper - Automated Execution Service          
           Flare Coston2 Testnet - ETH Oxford 2026            


  Configuration:
   RPC: https://coston2-api.flare.network/ext/C/rpc
   Contract: 0xD6659ea0fe07A6E2Fe458954609b0d2D926CA314
   Keeper Address: 0xaCaEF733908EE41cdB527dF9C82BB9F910934915
   Poll Interval: 15000 ms

 Keeper Balance: 99.65 C2FLR

 Starting keeper loop...



[7/2/2026, 12:35:00]  Scanning for executable payments...
    Total payments: 5
    2 pending payment(s) - triggers not yet hit.

[7/2/2026, 12:35:15]  Scanning for executable payments...
    Total payments: 5

    Payment 3: TRIGGER HIT!
      USD Amount: $0.32
      Stop Loss: $2007.04
      Current: $2006.50 
      Take Profit: $2009.05
      Trigger: STOP LOSS
       Executing payment...
       Transaction sent: 0xabc123...
       EXECUTED! Block: 26978650
       https://coston2-explorer.flare.network/tx/0xabc123...
```

##  Testing

Quick test to verify keeper setup:

```bash
npm run test
```

This connects to the contract and shows current payment status.

##  Production Deployment Options

### Option 1: Local Server (Simple)

```bash
# Run in tmux/screen session
npm start
```

### Option 2: Docker (Recommended)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### Option 3: Azure Container Instance

```bash
az container create \
  --resource-group hackathon \
  --name payment-keeper \
  --image your-registry/keeper:latest \
  --restart-policy Always \
  --environment-variables \
    RPC_URL="https://coston2-api.flare.network/ext/C/rpc" \
  --secure-environment-variables \
    KEEPER_PRIVATE_KEY="your_key"
```

### Option 4: PM2 Process Manager

```bash
npm install -g pm2
pm2 start npm --name "payment-keeper" -- start
pm2 startup
pm2 save
```

##  Security Considerations

###  What's Secure:
- **Permissionless execution**: Anyone can run keeper
- **On-chain validation**: Contract checks all conditions
- **Nonce protection**: Payment IDs prevent replay
- **Funds escrowed**: Collateral locked in advance
- **No trust needed**: All logic enforced by contract

###  Keeper Responsibilities:
- Keep enough gas balance
- Monitor for errors
- Ensure uptime (or run multiple keepers)

###  Best Practices:
- Use dedicated keeper wallet (not your main wallet)
- Rotate keys periodically
- Monitor keeper balance alerts
- Run multiple keepers for redundancy
- Set up error notifications

##  Monitoring

Monitor keeper health:

```bash
# Check keeper logs
tail -f keeper.log

# Check keeper balance
curl -X POST https://coston2-api.flare.network/ext/C/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["KEEPER_ADDRESS","latest"],"id":1}'
```

##  Troubleshooting

### Keeper won't start
- Check `.env` file exists and has KEEPER_PRIVATE_KEY
- Verify contract is deployed (check `src/lib/contract/deployment.json`)
- Ensure dependencies installed (`npm install`)

### No payments executing
- Verify keeper has gas balance
- Check trigger conditions (use `npm run test`)
- Look for errors in keeper output

### Transaction failed
- Check gas limit (increase in `.env`)
- Verify payment hasn't expired
- Ensure payment hasn't already been executed

##  Scalability

### Multiple Keepers (Recommended)
Run multiple keeper instances for redundancy. The contract prevents double-execution:
- First keeper to execute wins
- Other keepers' transactions will revert (payment already executed)
- No coordination needed between keepers

### Rate Limiting
Adjust `POLL_INTERVAL` in `.env`:
- Faster (5-10s): More responsive, higher gas usage
- Slower (30-60s): Lower gas, delayed execution

##  Integration with Frontend

The frontend automatically shows when keeper is enabled:
- Badge: "Auto-execute enabled"
- Status: "Keeper monitoring"
- Last check timestamp

No frontend changes needed - keeper works independently!

##  Notes

- Keeper is **permissionless** - anyone can run one
- Multiple keepers can run simultaneously (first wins)
- Keeper earns no fees (community service)
- For production: add monitoring, alerts, and redundancy

##  Hackathon Demo

For the ETH Oxford demo:

1. Start keeper: `npm run dev`
2. Create payment in UI with tight triggers (1%)
3. Show keeper logs detecting and executing
4. Show transaction on block explorer
5. Show payment marked as executed in UI

Perfect! 
