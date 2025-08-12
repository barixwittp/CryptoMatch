# Blockchain Gaming Platform - Testing Guide

## Quick Overview
Your blockchain gaming platform is now fully operational with:
- Smart contracts deployed on local Hardhat network
- Web interface on port 5000
- API server on port 8000  
- Leaderboard service on port 3001
- Local blockchain on port 8545

## Step-by-Step Testing Instructions

### 1. Connect Your Wallet
1. Open the web application at `http://localhost:5000`
2. Install MetaMask if not already installed
3. Click "Connect Wallet" button
4. Add the local Hardhat network to MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
5. Import a test account using one of these private keys:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

### 2. Get Test USDT Tokens
Since this is a test environment, you need mock USDT tokens:
```bash
# Run this to mint test USDT to your wallet address
# Replace YOUR_ADDRESS with your MetaMask wallet address
curl -X POST http://localhost:8000/dev/mint-usdt \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_ADDRESS", "amount": "1000"}'
```

### 3. Purchase GameTokens (GT)
1. In the web interface, go to "Buy GameTokens" section
2. Enter amount (e.g., 100 USDT)
3. Click "Buy Tokens"
4. Approve the transaction in MetaMask
5. Your GT balance should update after the transaction

### 4. Create a Match
1. Go to "Create Match" section
2. Fill in:
   - Match ID: `test-match-1`
   - Player 1: Your wallet address
   - Player 2: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (test address)
   - Stake: `10` (10 GT tokens)
3. Click "Create Match"
4. Approve the transaction

### 5. Stake in the Match (as Player 1)
1. Go to "Stake in Match" section
2. Enter Match ID: `test-match-1`
3. Click "Stake"
4. Approve the GT transfer

### 6. Simulate Player 2 Staking (API Call)
```bash
# Since you only have one wallet, simulate Player 2 staking via API
curl -X POST http://localhost:8000/match/test-match-1/stake \
  -H "Content-Type: application/json"
```

### 7. Submit Match Result
1. Go to "Submit Result" section
2. Enter:
   - Match ID: `test-match-1`
   - Winner: Your wallet address (you win!)
3. Click "Submit Result"
4. The winner gets both players' stakes (20 GT total)

### 8. Check Results
1. **Balance**: Click "Refresh Balance" - you should have more GT now
2. **Match Status**: Use "Query Match" with Match ID `test-match-1`
3. **Leaderboard**: Should show your address with 1 win and GT earned
4. **Events**: Recent events section shows all transactions

## API Testing

You can also test the API directly:

```bash
# Check system health
curl http://localhost:8000/health

# Get player balance
curl http://localhost:8000/balance/YOUR_ADDRESS

# Get match details
curl http://localhost:8000/match/test-match-1

# Check leaderboard
curl http://localhost:3001/leaderboard

# Get player stats
curl http://localhost:3001/player/YOUR_ADDRESS
```

## Advanced Testing Scenarios

### Multiple Matches
1. Create several matches with different IDs
2. Test different winners
3. Watch leaderboard rankings change

### Error Handling
1. Try creating a match without enough GT balance
2. Try staking in a non-existent match
3. Try submitting results for completed matches

### Network Integration
1. Switch MetaMask networks and back
2. Test with different wallet addresses
3. Check event history persistence

## Troubleshooting

**Wallet Connection Issues:**
- Make sure MetaMask is installed and unlocked
- Verify you're on the correct network (Chain ID 1337)
- Clear browser cache if needed

**Transaction Failures:**
- Check you have enough ETH for gas fees (test accounts have 10000 ETH)
- Ensure you have sufficient GT balance for staking
- Wait for previous transactions to complete

**API Errors:**
- Check that all services are running (green status)
- Verify contract addresses match in all services
- Restart services if needed

## Expected Results

After successful testing:
- ✓ Wallet connected and balance showing
- ✓ USDT converted to GameTokens 
- ✓ Matches created and staked successfully
- ✓ Winners receiving proper payouts
- ✓ Leaderboard updating with player stats
- ✓ All transaction events logged

The platform is ready for real-world deployment when you're satisfied with testing!