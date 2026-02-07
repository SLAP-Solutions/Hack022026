# Price-Optimized Insurance Payment System

## ETH Oxford 2026 Hackathon - Flare FTSO Main Track

A blockchain-based payment system that allows insurance companies to optimize claim payouts by executing payments when market prices hit target conditions, using Flare''s FTSO (Flare Time Series Oracle) for real-time price data.

---

## The Problem (Insurtech Context)

Insurance companies holding cryptocurrency reserves face a challenge:
- They need to pay claims in USD-equivalent amounts
- Crypto prices are volatile
- Paying at the wrong time means overpaying or taking unnecessary losses
- Manual monitoring of prices is inefficient

**Example:**
- Claim: Pay $1,000 USD equivalent in FLR
- Current price: $0.03/FLR  Need 33,333 FLR
- If price drops to $0.02/FLR  Need 50,000 FLR (66% more!)
- If price rises to $0.05/FLR  Need only 20,000 FLR (40% savings!)

---

## Our Solution

### USD-Denominated Payments with Trigger-Based Execution

**Core Innovation:**
1. **Insurance company specifies payment in USD** (e.g., $1,000)
2. **Sets price triggers** (stop loss / take profit)
3. **Locks collateral** (over-collateralized for safety)
4. **System auto-executes** when price conditions are met
5. **Refunds unused collateral** to payer

### How It Works

```

 STEP 1: PAYMENT CREATION                                    

 Insurer:                                                    
   Wants to pay: $1,000 USD                                
   Current price: $0.03/FLR                                
   Sets stop loss: $0.025/FLR (exit if price drops)       
   Sets take profit: $0.05/FLR (capitalize on increase)   
                                                             
 Contract calculates collateral needed:                      
   Worst case: $1,000 / $0.025 = 40,000 FLR               
   Safety buffer: 40,000  1.5 = 60,000 FLR (150% ratio)  
                                                             
 Insurer locks: 60,000 FLR in smart contract                



 STEP 2: MONITORING (Automated Keeper Bot)                      

 Keeper polls every 15 seconds:                                
   Queries FTSO for current FLR/USD price                     
   Checks if price  stop loss OR price  take profit        
   If triggered  executes payment automatically               



 STEP 3: EXECUTION (Price Hits $0.05/FLR - Take Profit!)    

 Contract:                                                   
  1. Queries FTSO: Current price = $0.05/FLR               
  2. Validates: $0.05  $0.05 take profit                 
  3. Calculates: $1,000 / $0.05 = 20,000 FLR needed        
  4. Transfers: 20,000 FLR  Recipient                      
  5. Refunds: 40,000 FLR  Insurer (40% savings!)          
                                                             
 Result:                                                     
   Recipient receives: $1,000 worth of FLR               
   Insurer saved: 40,000 FLR ($2,000 at $0.05)            
   Total locked: 60,000 FLR                                
   Total spent: 20,000 FLR                                 
   Refunded: 40,000 FLR                                    

```

---

## Key Benefits

### For Insurance Companies:
-  **USD-denominated claims** (predictable budgeting)
-  **Automated execution** (no manual monitoring)
-  **Price protection** (stop loss prevents runaway losses)
-  **Cost optimization** (take profit captures savings)
-  **Transparent & auditable** (blockchain immutability)

### Technical Advantages:
-  **Permissionless execution** (anyone can trigger valid payments)
-  **Over-collateralized** (guarantees funds availability)
-  **Real-time oracle pricing** (FTSO updates every ~1.8 seconds)
-  **Automatic refunds** (unused collateral returned)
-  **No user action needed** (fully automated after creation)

---

## How This Uses Flare FTSO

**Flare Time Series Oracle (FTSO) v2** provides:
- Real-time price feeds every ~1.8 seconds
- Decentralized price data from 100+ data providers
- Free to query (no oracle fees unlike Chainlink)
- Native to Flare blockchain

**Our Integration:**
```solidity
// Query FTSO at payment execution time
IFtsoV2 ftsoV2 = IFtsoV2(0x3d893C53D9e8056135C26C8c638B76C8b60Df726);
(uint256 currentPrice, int8 decimals, uint64 timestamp) = ftsoV2.getFeedById(feedId);

// Calculate exact FLR amount needed for USD payment
uint256 flrAmount = (usdAmount * 1e18 * 10**uint8(decimals)) / (currentPrice * 100);

// Transfer calculated amount to recipient
recipient.transfer(flrAmount);

// Refund excess collateral to payer
payer.transfer(lockedCollateral - flrAmount);
```

---

## Real-World Example

### Scenario: Insurance company processes 10 claims/day

**Traditional approach (fixed crypto amounts):**
- Lock exact crypto amount at creation time
- No price optimization
- Overpayments when price increases
- Shortfalls when price decreases

**Our approach (USD-denominated with triggers):**
- Claim #1: Price $0.03  $0.05 = **40% savings** 
- Claim #2: Price $0.03  $0.025 = **Stop loss triggered** (limits losses) 
- Claim #3: Price stable  Normal execution 

**Annual savings potential:** Significant optimization on volatile assets

---

## Architecture

### Smart Contract (`ClaimPayments.sol`)
- USD-denominated payment storage
- FTSO integration for live pricing
- Collateral management & refund logic
- Trigger validation (stop loss / take profit)
- Permissionless execution function

### Keeper Service (Node.js)
- Polls contract every 15 seconds
- Queries FTSO for current prices
- Automatically executes payments when triggers hit
- Deploys to Azure Container Instances

### Frontend (Next.js)
- Connect MetaMask wallet
- Create USD-denominated payments
- Set stop loss / take profit triggers
- View pending & executed payments
- Real-time price monitoring
- Transaction history from blockchain

---

## DeFi Pattern: Over-Collateralized Escrow

This follows the **industry-standard DeFi pattern** used by:
- **MakerDAO** (collateralized stablecoin minting)
- **Aave** (over-collateralized lending)
- **Compound** (collateral-backed borrowing)
- **Synthetix** (synthetic asset collateral)

**Security Model:**
1. Funds locked in smart contract at creation (escrow)
2. Over-collateralization ensures payment can always execute
3. Oracle price queried at execution time (not creation time)
4. Contract validates all conditions before execution
5. Unused collateral automatically refunded

---

## Technology Stack

- **Blockchain:** Flare Coston2 Testnet (Mainnet ready)
- **Smart Contracts:** Solidity 0.8.25 + Hardhat
- **Oracle:** Flare FTSO v2 (native real-time price feeds)
- **Frontend:** Next.js + React + TypeScript + ethers.js
- **Automation:** Node.js keeper service
- **Deployment:** Azure Container Instances

---

## Project Commands

### Deploy Contract
```shell
cd hardhat
npx hardhat run scripts/deploy.ts --network coston2
```

### Run Tests
```shell
npx hardhat test
```

### Start Frontend
```shell
cd src
npm run dev
```

### Start Keeper Bot
```shell
cd keeper
npm start
```

---

## Hackathon Submission

**Track:** Main Track (requires FTSO usage)   
**Innovation:** USD-denominated payments with dynamic crypto calculation  
**Real-World Use Case:** Insurance claim optimization  
**Technical Quality:** Production-ready DeFi pattern  

**Built for ETH Oxford 2026 by insurtech developers exploring Web3 solutions.**
