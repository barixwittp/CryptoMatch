const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const GAME_TOKEN_ADDRESS = process.env.GAME_TOKEN_ADDRESS || '';
const TOKEN_STORE_ADDRESS = process.env.TOKEN_STORE_ADDRESS || '';
const PLAY_GAME_ADDRESS = process.env.PLAY_GAME_ADDRESS || '';

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract ABIs (simplified for demo)
const gameTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const tokenStoreABI = [
  "function buy(uint256 usdtAmount) external",
  "function gtPerUsdt() view returns (uint256)",
  "event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut)"
];

const playGameABI = [
  "function createMatch(bytes32 matchId, address p1, address p2, uint256 stake) external",
  "function stake(bytes32 matchId) external",
  "function commitResult(bytes32 matchId, address winner) external",
  "function getMatch(bytes32 matchId) view returns (tuple(bytes32 matchId, address player1, address player2, uint256 stake, bool p1Staked, bool p2Staked, uint256 startTime, uint8 status, address winner))",
  "event MatchCreated(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 stake)",
  "event Staked(bytes32 indexed matchId, address indexed player, uint256 amount)",
  "event Settled(bytes32 indexed matchId, address indexed winner, uint256 payout)"
];

// Initialize contracts
const gameToken = new ethers.Contract(GAME_TOKEN_ADDRESS, gameTokenABI, wallet);
const tokenStore = new ethers.Contract(TOKEN_STORE_ADDRESS, tokenStoreABI, wallet);
const playGame = new ethers.Contract(PLAY_GAME_ADDRESS, playGameABI, wallet);

// Routes

/**
 * GET /purchase - Buy GameTokens with USDT
 * Query params: amount (USDT amount in 6 decimals)
 */
app.get('/purchase', async (req, res) => {
  try {
    const { amount } = req.query;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount parameter is required' });
    }

    const usdtAmount = ethers.parseUnits(amount.toString(), 6); // USDT has 6 decimals
    
    // Call TokenStore.buy()
    const tx = await tokenStore.buy(usdtAmount);
    const receipt = await tx.wait();
    
    // Parse events to get purchase details
    const purchaseEvent = receipt.events?.find(e => e.event === 'Purchase');
    let gtOut = '0';
    if (purchaseEvent) {
      gtOut = ethers.formatEther(purchaseEvent.args.gtOut);
    }

    res.json({
      success: true,
      transactionHash: tx.hash,
      usdtAmount: amount,
      gtReceived: gtOut,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ 
      error: 'Purchase failed', 
      message: error.message 
    });
  }
});

/**
 * POST /match/start - Create match and coordinate staking
 * Body: { matchId, player1, player2, stake }
 */
app.post('/match/start', async (req, res) => {
  try {
    const { matchId, player1, player2, stake } = req.body;

    if (!matchId || !player1 || !player2 || !stake) {
      return res.status(400).json({ error: 'All fields required: matchId, player1, player2, stake' });
    }

    // Convert matchId to bytes32
    const matchIdBytes = ethers.encodeBytes32String(matchId);
    const stakeAmount = ethers.parseEther(stake.toString());

    // Create match
    const tx = await playGame.createMatch(matchIdBytes, player1, player2, stakeAmount);
    const receipt = await tx.wait();

    // Parse events
    const matchCreatedEvent = receipt.events?.find(e => e.event === 'MatchCreated');

    res.json({
      success: true,
      transactionHash: tx.hash,
      matchId: matchId,
      matchIdBytes: matchIdBytes,
      player1,
      player2,
      stake: stake,
      gasUsed: receipt.gasUsed.toString(),
      message: 'Match created successfully. Players can now stake their tokens.'
    });

  } catch (error) {
    console.error('Match creation error:', error);
    res.status(500).json({ 
      error: 'Match creation failed', 
      message: error.message 
    });
  }
});

/**
 * POST /match/result - Submit match result
 * Body: { matchId, winner }
 */
app.post('/match/result', async (req, res) => {
  try {
    const { matchId, winner } = req.body;

    if (!matchId || !winner) {
      return res.status(400).json({ error: 'Both matchId and winner are required' });
    }

    // Convert matchId to bytes32
    const matchIdBytes = ethers.encodeBytes32String(matchId);

    // Validate winner address
    if (!ethers.isAddress(winner)) {
      return res.status(400).json({ error: 'Invalid winner address' });
    }

    // Submit result
    const tx = await playGame.commitResult(matchIdBytes, winner);
    const receipt = await tx.wait();

    // Parse events
    const settledEvent = receipt.events?.find(e => e.event === 'Settled');
    let payout = '0';
    if (settledEvent) {
      payout = ethers.formatEther(settledEvent.args.payout);
    }

    res.json({
      success: true,
      transactionHash: tx.hash,
      matchId: matchId,
      winner: winner,
      payout: payout,
      gasUsed: receipt.gasUsed.toString(),
      message: 'Match result submitted successfully'
    });

  } catch (error) {
    console.error('Result submission error:', error);
    res.status(500).json({ 
      error: 'Result submission failed', 
      message: error.message 
    });
  }
});

/**
 * GET /match/:matchId - Get match details
 */
app.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const matchIdBytes = ethers.encodeBytes32String(matchId);

    const matchData = await playGame.getMatch(matchIdBytes);

    // Convert match data to readable format
    const statusNames = ['CREATED', 'STAKED', 'SETTLED', 'REFUNDED'];
    
    res.json({
      matchId: matchId,
      player1: matchData.player1,
      player2: matchData.player2,
      stake: ethers.formatEther(matchData.stake),
      p1Staked: matchData.p1Staked,
      p2Staked: matchData.p2Staked,
      startTime: matchData.startTime.toString(),
      status: statusNames[matchData.status] || 'UNKNOWN',
      winner: matchData.winner
    });

  } catch (error) {
    console.error('Match query error:', error);
    res.status(500).json({ 
      error: 'Match query failed', 
      message: error.message 
    });
  }
});

/**
 * GET /balance/:address - Get GT balance for address
 */
app.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const balance = await gameToken.balanceOf(address);

    res.json({
      address: address,
      balance: ethers.formatEther(balance),
      balanceWei: balance.toString()
    });

  } catch (error) {
    console.error('Balance query error:', error);
    res.status(500).json({ 
      error: 'Balance query failed', 
      message: error.message 
    });
  }
});

/**
 * POST /dev/mint-usdt - Development helper to mint test USDT tokens
 * Only for testing purposes with mock USDT
 */
app.post('/dev/mint-usdt', async (req, res) => {
  try {
    const { address, amount } = req.body;

    if (!address || !amount) {
      return res.status(400).json({ error: 'Address and amount are required' });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const usdtAmount = ethers.parseUnits(amount.toString(), 6);
    
    // Get the MockUSDT contract
    const mockUSDTABI = [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address account) external view returns (uint256)"
    ];
    
    const mockUSDT = new ethers.Contract(
      '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      mockUSDTABI,
      wallet
    );

    // Mint USDT tokens
    const tx = await mockUSDT.mint(address, usdtAmount);
    const receipt = await tx.wait();

    // Get new balance
    const balance = await mockUSDT.balanceOf(address);

    res.json({
      success: true,
      message: `Minted ${amount} USDT to ${address}`,
      transactionHash: receipt.hash,
      newBalance: ethers.formatUnits(balance, 6)
    });

  } catch (error) {
    console.error('USDT mint error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    
    res.json({
      status: 'healthy',
      blockNumber: blockNumber,
      network: provider.network?.name || 'unknown',
      chainId: provider.network?.chainId || 'unknown',
      contracts: {
        gameToken: GAME_TOKEN_ADDRESS,
        tokenStore: TOKEN_STORE_ADDRESS,
        playGame: PLAY_GAME_ADDRESS
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
  console.log('Configuration:');
  console.log('- RPC URL:', RPC_URL);
  console.log('- GameToken:', GAME_TOKEN_ADDRESS);
  console.log('- TokenStore:', TOKEN_STORE_ADDRESS);
  console.log('- PlayGame:', PLAY_GAME_ADDRESS);
  console.log('- Operator:', wallet.address);
});
