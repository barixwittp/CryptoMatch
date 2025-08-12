// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlayGame
 * @dev Escrow system for game matches with stake and payout functionality
 */
contract PlayGame is Ownable, ReentrancyGuard {
    IERC20 public immutable gameToken;
    address public operator; // Backend address authorized to commit results
    uint256 public constant MATCH_TIMEOUT = 24 hours;
    
    enum MatchStatus { CREATED, STAKED, SETTLED, REFUNDED }
    
    struct Match {
        bytes32 matchId;
        address player1;
        address player2;
        uint256 stake;
        bool p1Staked;
        bool p2Staked;
        uint256 startTime;
        MatchStatus status;
        address winner;
    }
    
    mapping(bytes32 => Match) public matches;
    
    event MatchCreated(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 stake);
    event Staked(bytes32 indexed matchId, address indexed player, uint256 amount);
    event Settled(bytes32 indexed matchId, address indexed winner, uint256 payout);
    event Refunded(bytes32 indexed matchId, address indexed player, uint256 amount);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);
    
    modifier onlyOperator() {
        require(msg.sender == operator, "PlayGame: caller is not operator");
        _;
    }
    
    modifier matchExists(bytes32 matchId) {
        require(matches[matchId].player1 != address(0), "PlayGame: match does not exist");
        _;
    }
    
    constructor(address _gameToken, address _operator) Ownable(msg.sender) {
        require(_gameToken != address(0), "PlayGame: invalid GameToken address");
        require(_operator != address(0), "PlayGame: invalid operator address");
        
        gameToken = IERC20(_gameToken);
        operator = _operator;
    }
    
    /**
     * @dev Set operator address (owner only)
     * @param _operator New operator address
     */
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "PlayGame: invalid operator address");
        
        address oldOperator = operator;
        operator = _operator;
        
        emit OperatorUpdated(oldOperator, _operator);
    }
    
    /**
     * @dev Create a new match (owner or operator only)
     * @param matchId Unique identifier for the match
     * @param p1 Player 1 address
     * @param p2 Player 2 address
     * @param stakeAmount Stake amount required from each player
     */
    function createMatch(bytes32 matchId, address p1, address p2, uint256 stakeAmount) external {
        require(msg.sender == owner() || msg.sender == operator, "PlayGame: unauthorized");
        require(matchId != bytes32(0), "PlayGame: invalid match ID");
        require(p1 != address(0) && p2 != address(0), "PlayGame: invalid player addresses");
        require(p1 != p2, "PlayGame: players cannot be the same");
        require(stakeAmount > 0, "PlayGame: stake must be positive");
        require(matches[matchId].player1 == address(0), "PlayGame: match already exists");
        
        matches[matchId] = Match({
            matchId: matchId,
            player1: p1,
            player2: p2,
            stake: stakeAmount,
            p1Staked: false,
            p2Staked: false,
            startTime: 0,
            status: MatchStatus.CREATED,
            winner: address(0)
        });
        
        emit MatchCreated(matchId, p1, p2, stakeAmount);
    }
    
    /**
     * @dev Stake tokens for a match
     * @param matchId Match identifier
     */
    function stake(bytes32 matchId) external nonReentrant matchExists(matchId) {
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.CREATED, "PlayGame: match not in CREATED status");
        require(msg.sender == matchData.player1 || msg.sender == matchData.player2, "PlayGame: not a player in this match");
        
        bool isPlayer1 = (msg.sender == matchData.player1);
        require((isPlayer1 && !matchData.p1Staked) || (!isPlayer1 && !matchData.p2Staked), "PlayGame: already staked");
        
        // Check balance and allowance
        require(gameToken.balanceOf(msg.sender) >= matchData.stake, "PlayGame: insufficient GT balance");
        require(gameToken.allowance(msg.sender, address(this)) >= matchData.stake, "PlayGame: insufficient GT allowance");
        
        // Transfer stake to escrow
        bool success = gameToken.transferFrom(msg.sender, address(this), matchData.stake);
        require(success, "PlayGame: GT transfer failed");
        
        // Update staking status
        if (isPlayer1) {
            matchData.p1Staked = true;
        } else {
            matchData.p2Staked = true;
        }
        
        // Check if both players have staked
        if (matchData.p1Staked && matchData.p2Staked) {
            matchData.status = MatchStatus.STAKED;
            matchData.startTime = block.timestamp;
        }
        
        emit Staked(matchId, msg.sender, matchData.stake);
    }
    
    /**
     * @dev Commit match result (operator only)
     * @param matchId Match identifier
     * @param winner Address of the winning player
     */
    function commitResult(bytes32 matchId, address winner) external onlyOperator nonReentrant matchExists(matchId) {
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.STAKED, "PlayGame: match not in STAKED status");
        require(winner == matchData.player1 || winner == matchData.player2, "PlayGame: invalid winner");
        
        uint256 payout = matchData.stake * 2;
        
        // Update match status
        matchData.status = MatchStatus.SETTLED;
        matchData.winner = winner;
        
        // Transfer payout to winner
        bool success = gameToken.transfer(winner, payout);
        require(success, "PlayGame: GT transfer failed");
        
        emit Settled(matchId, winner, payout);
    }
    
    /**
     * @dev Refund stakes after timeout
     * @param matchId Match identifier
     */
    function refund(bytes32 matchId) external nonReentrant matchExists(matchId) {
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.STAKED, "PlayGame: match not in STAKED status");
        require(block.timestamp >= matchData.startTime + MATCH_TIMEOUT, "PlayGame: timeout not reached");
        
        matchData.status = MatchStatus.REFUNDED;
        
        // Refund both players
        if (matchData.p1Staked) {
            bool success1 = gameToken.transfer(matchData.player1, matchData.stake);
            require(success1, "PlayGame: GT transfer to p1 failed");
            emit Refunded(matchId, matchData.player1, matchData.stake);
        }
        
        if (matchData.p2Staked) {
            bool success2 = gameToken.transfer(matchData.player2, matchData.stake);
            require(success2, "PlayGame: GT transfer to p2 failed");
            emit Refunded(matchId, matchData.player2, matchData.stake);
        }
    }
    
    /**
     * @dev Get match details
     * @param matchId Match identifier
     */
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }
}
