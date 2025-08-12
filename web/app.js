class GamePlatform {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.apiBaseUrl = 'http://localhost:8000';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLeaderboard();
        this.startEventRefresh();
    }

    setupEventListeners() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('refreshBalance').addEventListener('click', () => this.updateBalance());

        // Forms
        document.getElementById('buyTokensForm').addEventListener('submit', (e) => this.handleBuyTokens(e));
        document.getElementById('createMatchForm').addEventListener('submit', (e) => this.handleCreateMatch(e));
        document.getElementById('stakeMatchForm').addEventListener('submit', (e) => this.handleStakeMatch(e));
        document.getElementById('submitResultForm').addEventListener('submit', (e) => this.handleSubmitResult(e));
        document.getElementById('queryMatchForm').addEventListener('submit', (e) => this.handleQueryMatch(e));

        // Refresh buttons
        document.getElementById('refreshEvents').addEventListener('click', () => this.loadRecentEvents());
        document.getElementById('refreshLeaderboard').addEventListener('click', () => this.loadLeaderboard());
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                this.account = accounts[0];
                
                document.getElementById('walletStatus').textContent = 'Connected';
                document.getElementById('walletStatus').className = 'badge bg-success';
                document.getElementById('walletAddress').textContent = this.account;
                document.getElementById('walletInfo').style.display = 'block';
                document.getElementById('connectWallet').style.display = 'none';

                await this.updateBalance();
                this.showToast('Success', 'Wallet connected successfully!', 'success');

            } else {
                this.showToast('Error', 'Please install MetaMask or another Web3 wallet', 'error');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showToast('Error', 'Failed to connect wallet: ' + error.message, 'error');
        }
    }

    async updateBalance() {
        if (!this.account) return;

        try {
            const response = await fetch(`http://localhost:8000/balance/${this.account}`);
            if (!response.ok) {
                console.warn('Balance service unavailable');
                document.getElementById('gtBalance').textContent = '0.0000';
                return;
            }
            
            const data = await response.json();
            document.getElementById('gtBalance').textContent = parseFloat(data.balance).toFixed(4);
        } catch (error) {
            console.warn('Balance update error:', error);
            document.getElementById('gtBalance').textContent = '0.0000';
        }
    }

    async handleBuyTokens(event) {
        event.preventDefault();
        
        const amount = document.getElementById('usdtAmount').value;
        if (!amount || parseFloat(amount) <= 0) {
            this.showToast('Error', 'Please enter a valid USDT amount', 'error');
            return;
        }

        try {
            this.showLoading('buyTokensForm', true);
            
            const response = await fetch(`${this.apiBaseUrl}/purchase?amount=${amount}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Success', 
                    `Purchase successful! Received ${data.gtReceived} GT tokens. TX: ${data.transactionHash}`, 
                    'success');
                await this.updateBalance();
                document.getElementById('usdtAmount').value = '';
            } else {
                this.showToast('Error', data.error || 'Purchase failed', 'error');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            this.showToast('Error', 'Purchase failed: ' + error.message, 'error');
        } finally {
            this.showLoading('buyTokensForm', false);
        }
    }

    async handleCreateMatch(event) {
        event.preventDefault();
        
        const matchId = document.getElementById('matchId').value;
        const player1 = document.getElementById('player1').value;
        const player2 = document.getElementById('player2').value;
        const stake = document.getElementById('stakeAmount').value;

        if (!matchId || !player1 || !player2 || !stake) {
            this.showToast('Error', 'Please fill all fields', 'error');
            return;
        }

        try {
            this.showLoading('createMatchForm', true);

            const response = await fetch(`${this.apiBaseUrl}/match/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, player1, player2, stake })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Success', 
                    `Match created successfully! Players can now stake. TX: ${data.transactionHash}`, 
                    'success');
                document.getElementById('createMatchForm').reset();
            } else {
                this.showToast('Error', data.error || 'Match creation failed', 'error');
            }
        } catch (error) {
            console.error('Match creation error:', error);
            this.showToast('Error', 'Match creation failed: ' + error.message, 'error');
        } finally {
            this.showLoading('createMatchForm', false);
        }
    }

    async handleStakeMatch(event) {
        event.preventDefault();
        
        const matchId = document.getElementById('stakeMatchId').value;
        
        if (!matchId) {
            this.showToast('Error', 'Please enter match ID', 'error');
            return;
        }

        this.showToast('Info', 'Staking requires direct blockchain interaction. Please use MetaMask to call the stake() function on the PlayGame contract.', 'info');
    }

    async handleSubmitResult(event) {
        event.preventDefault();
        
        const matchId = document.getElementById('resultMatchId').value;
        const winner = document.getElementById('winner').value;

        if (!matchId || !winner) {
            this.showToast('Error', 'Please fill all fields', 'error');
            return;
        }

        try {
            this.showLoading('submitResultForm', true);

            const response = await fetch(`${this.apiBaseUrl}/match/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, winner })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Success', 
                    `Result submitted successfully! Payout: ${data.payout} GT. TX: ${data.transactionHash}`, 
                    'success');
                document.getElementById('submitResultForm').reset();
                await this.loadLeaderboard(); // Refresh leaderboard
            } else {
                this.showToast('Error', data.error || 'Result submission failed', 'error');
            }
        } catch (error) {
            console.error('Result submission error:', error);
            this.showToast('Error', 'Result submission failed: ' + error.message, 'error');
        } finally {
            this.showLoading('submitResultForm', false);
        }
    }

    async handleQueryMatch(event) {
        event.preventDefault();
        
        const matchId = document.getElementById('queryMatchId').value;
        
        if (!matchId) {
            this.showToast('Error', 'Please enter match ID', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/match/${matchId}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                this.showToast('Error', 'Match query failed', 'error');
                document.getElementById('matchDetails').style.display = 'none';
                return;
            }
            
            const data = await response.json();

            if (response.ok) {
                this.displayMatchDetails(data);
            } else {
                this.showToast('Error', data.error || 'Match query failed', 'error');
                document.getElementById('matchDetails').style.display = 'none';
            }
        } catch (error) {
            console.error('Match query error:', error);
            this.showToast('Error', 'Match query failed: ' + error.message, 'error');
        }
    }

    displayMatchDetails(match) {
        document.getElementById('matchStatus').textContent = match.status;
        document.getElementById('matchPlayer1').textContent = match.player1;
        document.getElementById('matchPlayer2').textContent = match.player2;
        document.getElementById('matchStake').textContent = match.stake;
        document.getElementById('matchP1Staked').textContent = match.p1Staked ? 'Yes' : 'No';
        document.getElementById('matchP2Staked').textContent = match.p2Staked ? 'Yes' : 'No';
        document.getElementById('matchWinner').textContent = match.winner || 'TBD';
        
        document.getElementById('matchDetails').style.display = 'block';
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('http://localhost:3001/leaderboard', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('Leaderboard service unavailable');
                document.getElementById('leaderboardList').innerHTML = 
                    '<p class="text-muted">No players yet - play some matches to see the leaderboard!</p>';
                return;
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
                document.getElementById('leaderboardList').innerHTML = 
                    '<p class="text-muted">No players yet</p>';
                return;
            }

            let html = '<div class="table-responsive"><table class="table table-striped">';
            html += '<thead><tr><th>Rank</th><th>Player</th><th>Wins</th><th>GT Won</th><th>Matches</th></tr></thead><tbody>';
            
            data.forEach((player, index) => {
                html += `<tr>
                    <td><span class="badge bg-primary">#${index + 1}</span></td>
                    <td><code>${player.address.substring(0, 10)}...</code></td>
                    <td>${player.wins}</td>
                    <td>${parseFloat(player.totalGTWon).toFixed(2)}</td>
                    <td>${player.matchesPlayed}</td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
            document.getElementById('leaderboardList').innerHTML = html;

        } catch (error) {
            console.warn('Leaderboard loading error:', error);
            document.getElementById('leaderboardList').innerHTML = 
                '<p class="text-muted">Leaderboard will appear after matches are played</p>';
        }
    }

    async loadRecentEvents() {
        // This would ideally query blockchain events or an event API
        // For now, just show a placeholder
        document.getElementById('eventsList').innerHTML = 
            '<p class="text-muted">Event monitoring not implemented yet</p>';
    }

    startEventRefresh() {
        // Refresh balance and leaderboard periodically
        setInterval(() => {
            if (this.account) {
                this.updateBalance();
            }
            this.loadLeaderboard();
        }, 30000); // Every 30 seconds
    }

    showLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            submitBtn.disabled = false;
            // Restore original button text based on form
            const originalTexts = {
                'buyTokensForm': '<i class="fas fa-shopping-cart"></i> Buy GT Tokens',
                'createMatchForm': '<i class="fas fa-plus"></i> Create Match',
                'stakeMatchForm': '<i class="fas fa-coins"></i> Stake GT',
                'submitResultForm': '<i class="fas fa-crown"></i> Submit Result'
            };
            submitBtn.innerHTML = originalTexts[formId] || 'Submit';
        }
    }

    showToast(title, message, type = 'info') {
        const toast = document.getElementById('liveToast');
        const toastTitle = document.getElementById('toastTitle');
        const toastBody = document.getElementById('toastBody');

        toastTitle.textContent = title;
        toastBody.textContent = message;

        // Set toast color based on type
        toast.className = `toast show bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} text-white`;

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Auto-hide after delay based on type
        const delay = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            bsToast.hide();
        }, delay);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GamePlatform();
});
