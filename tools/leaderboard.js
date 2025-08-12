const { ethers } = require('ethers');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
require('dotenv').config();

class LeaderboardService {
    constructor() {
        this.provider = null;
        this.playGameContract = null;
        this.db = null;
        this.app = express();
        this.port = 3001;

        this.init();
    }

    async init() {
        // Setup database
        await this.setupDatabase();
        
        // Setup blockchain connection
        await this.setupBlockchain();
        
        // Setup Express server
        this.setupServer();
        
        // Start event listening
        this.startEventListener();
        
        // Start server
        this.startServer();
    }

    async setupDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database('./leaderboard.db', (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database');
            });

            // Create tables
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS player_stats (
                    address TEXT PRIMARY KEY,
                    wins INTEGER DEFAULT 0,
                    losses INTEGER DEFAULT 0,
                    matches_played INTEGER DEFAULT 0,
                    total_gt_won REAL DEFAULT 0.0,
                    total_gt_lost REAL DEFAULT 0.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(createTableQuery, (err) => {
                if (err) {
                    console.error('Table creation error:', err);
                    reject(err);
                } else {
                    console.log('Player stats table ready');
                    resolve();
                }
            });
        });
    }

    async setupBlockchain() {
        try {
            const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
            const playGameAddress = process.env.PLAY_GAME_ADDRESS || '';

            if (!playGameAddress) {
                console.warn('PLAY_GAME_ADDRESS not set, event listening disabled');
                return;
            }

            this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
            
            // PlayGame contract ABI for events
            const playGameABI = [
                "event MatchCreated(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 stake)",
                "event Staked(bytes32 indexed matchId, address indexed player, uint256 amount)",
                "event Settled(bytes32 indexed matchId, address indexed winner, uint256 payout)",
                "event Refunded(bytes32 indexed matchId, address indexed player, uint256 amount)",
                "function getMatch(bytes32 matchId) view returns (tuple(bytes32 matchId, address player1, address player2, uint256 stake, bool p1Staked, bool p2Staked, uint256 startTime, uint8 status, address winner))"
            ];

            this.playGameContract = new ethers.Contract(playGameAddress, playGameABI, this.provider);
            console.log('Blockchain connection established');
            console.log('PlayGame contract:', playGameAddress);

        } catch (error) {
            console.error('Blockchain setup error:', error);
        }
    }

    setupServer() {
        this.app.use(cors());
        this.app.use(express.json());

        // Get leaderboard endpoint
        this.app.get('/leaderboard', (req, res) => {
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;

            const query = `
                SELECT 
                    address,
                    wins,
                    losses,
                    matches_played,
                    total_gt_won,
                    total_gt_lost,
                    ROUND(CAST(wins AS REAL) / NULLIF(matches_played, 0) * 100, 1) as win_rate
                FROM player_stats 
                WHERE matches_played > 0
                ORDER BY total_gt_won DESC, wins DESC
                LIMIT ? OFFSET ?
            `;

            this.db.all(query, [limit, offset], (err, rows) => {
                if (err) {
                    console.error('Database query error:', err);
                    res.status(500).json({ error: 'Database query failed' });
                } else {
                    res.json(rows);
                }
            });
        });

        // Get player stats endpoint
        this.app.get('/player/:address', (req, res) => {
            const { address } = req.params;

            if (!ethers.isAddress(address)) {
                return res.status(400).json({ error: 'Invalid address' });
            }

            const query = `
                SELECT * FROM player_stats WHERE address = ? COLLATE NOCASE
            `;

            this.db.get(query, [address.toLowerCase()], (err, row) => {
                if (err) {
                    console.error('Database query error:', err);
                    res.status(500).json({ error: 'Database query failed' });
                } else if (!row) {
                    res.json({
                        address: address.toLowerCase(),
                        wins: 0,
                        losses: 0,
                        matches_played: 0,
                        total_gt_won: 0.0,
                        total_gt_lost: 0.0,
                        win_rate: 0
                    });
                } else {
                    res.json({
                        ...row,
                        win_rate: row.matches_played > 0 ? 
                            Math.round((row.wins / row.matches_played) * 100 * 10) / 10 : 0
                    });
                }
            });
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'leaderboard',
                database: this.db ? 'connected' : 'disconnected',
                blockchain: this.provider ? 'connected' : 'disconnected',
                listening: this.playGameContract ? 'enabled' : 'disabled'
            });
        });

        // Stats endpoint
        this.app.get('/stats', (req, res) => {
            const queries = {
                totalPlayers: 'SELECT COUNT(*) as count FROM player_stats WHERE matches_played > 0',
                totalMatches: 'SELECT SUM(matches_played) / 2 as count FROM player_stats',
                totalGTTransferred: 'SELECT SUM(total_gt_won + total_gt_lost) as total FROM player_stats'
            };

            Promise.all([
                new Promise((resolve, reject) => {
                    this.db.get(queries.totalPlayers, (err, row) => {
                        if (err) reject(err);
                        else resolve(row.count || 0);
                    });
                }),
                new Promise((resolve, reject) => {
                    this.db.get(queries.totalMatches, (err, row) => {
                        if (err) reject(err);
                        else resolve(row.count || 0);
                    });
                }),
                new Promise((resolve, reject) => {
                    this.db.get(queries.totalGTTransferred, (err, row) => {
                        if (err) reject(err);
                        else resolve(row.total || 0);
                    });
                })
            ]).then(([totalPlayers, totalMatches, totalGTTransferred]) => {
                res.json({
                    totalPlayers,
                    totalMatches: Math.floor(totalMatches),
                    totalGTTransferred: parseFloat(totalGTTransferred).toFixed(2)
                });
            }).catch(err => {
                console.error('Stats query error:', err);
                res.status(500).json({ error: 'Stats query failed' });
            });
        });
    }

    startEventListener() {
        if (!this.playGameContract) {
            console.log('Event listening disabled - no contract connection');
            return;
        }

        console.log('Starting event listener...');

        // Listen for Settled events
        this.playGameContract.on('Settled', async (matchId, winner, payout, event) => {
            try {
                console.log('Settled event detected:', {
                    matchId: matchId,
                    winner: winner,
                    payout: ethers.formatEther(payout)
                });

                // Get match details to find loser
                const matchData = await this.playGameContract.getMatch(matchId);
                const loser = matchData.player1.toLowerCase() === winner.toLowerCase() ? 
                    matchData.player2 : matchData.player1;
                
                const stakeAmount = parseFloat(ethers.formatEther(matchData.stake));
                const payoutAmount = parseFloat(ethers.formatEther(payout));

                // Update winner stats
                await this.updatePlayerStats(
                    winner.toLowerCase(),
                    1,  // wins
                    0,  // losses
                    1,  // matches played
                    payoutAmount,  // GT won
                    0   // GT lost
                );

                // Update loser stats
                await this.updatePlayerStats(
                    loser.toLowerCase(),
                    0,  // wins
                    1,  // losses
                    1,  // matches played
                    0,  // GT won
                    stakeAmount  // GT lost
                );

                console.log(`Updated stats for match ${matchId}: Winner ${winner}, Loser ${loser}`);

            } catch (error) {
                console.error('Error processing Settled event:', error);
            }
        });

        // Listen for Refunded events
        this.playGameContract.on('Refunded', async (matchId, player, amount, event) => {
            try {
                console.log('Refunded event detected:', {
                    matchId: matchId,
                    player: player,
                    amount: ethers.formatEther(amount)
                });

                // For refunded matches, we don't update win/loss stats
                // Just log the event for now
                
            } catch (error) {
                console.error('Error processing Refunded event:', error);
            }
        });

        console.log('Event listener started successfully');
    }

    async updatePlayerStats(address, wins, losses, matchesPlayed, gtWon, gtLost) {
        return new Promise((resolve, reject) => {
            const upsertQuery = `
                INSERT INTO player_stats (address, wins, losses, matches_played, total_gt_won, total_gt_lost, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(address) DO UPDATE SET
                    wins = wins + ?,
                    losses = losses + ?,
                    matches_played = matches_played + ?,
                    total_gt_won = total_gt_won + ?,
                    total_gt_lost = total_gt_lost + ?,
                    updated_at = CURRENT_TIMESTAMP
            `;

            this.db.run(upsertQuery, [
                address, wins, losses, matchesPlayed, gtWon, gtLost,
                wins, losses, matchesPlayed, gtWon, gtLost
            ], function(err) {
                if (err) {
                    console.error('Database update error:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    startServer() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`Leaderboard service running on http://0.0.0.0:${this.port}`);
            console.log('Available endpoints:');
            console.log('- GET /leaderboard - Top players by GT won');
            console.log('- GET /player/:address - Individual player stats');
            console.log('- GET /stats - Platform statistics');
            console.log('- GET /health - Service health check');
        });
    }
}

// Start the service
new LeaderboardService();
