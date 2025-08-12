// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameToken.sol";

/**
 * @title TokenStore
 * @dev Handles USDT to GameToken conversion with configurable exchange rate
 */
contract TokenStore is Ownable, ReentrancyGuard {
    IERC20 public immutable usdt;
    GameToken public immutable gameToken;
    uint256 public gtPerUsdt; // GT per USDT (scaled by 1e18)
    
    event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut);
    event RateUpdated(uint256 oldRate, uint256 newRate);
    event USDTWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _usdt, address _gameToken, uint256 _gtPerUsdt) Ownable(msg.sender) {
        require(_usdt != address(0), "TokenStore: invalid USDT address");
        require(_gameToken != address(0), "TokenStore: invalid GameToken address");
        require(_gtPerUsdt > 0, "TokenStore: invalid exchange rate");
        
        usdt = IERC20(_usdt);
        gameToken = GameToken(_gameToken);
        gtPerUsdt = _gtPerUsdt;
    }
    
    /**
     * @dev Buy GameTokens with USDT
     * @param usdtAmount Amount of USDT to spend (in USDT decimals - 6)
     */
    function buy(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "TokenStore: USDT amount must be positive");
        
        // Calculate GT output (USDT has 6 decimals, GT has 18)
        uint256 gtOut = (usdtAmount * gtPerUsdt) / 1e6;
        require(gtOut > 0, "TokenStore: GT output too small");
        
        // Check and transfer USDT from buyer
        require(usdt.balanceOf(msg.sender) >= usdtAmount, "TokenStore: insufficient USDT balance");
        require(usdt.allowance(msg.sender, address(this)) >= usdtAmount, "TokenStore: insufficient USDT allowance");
        
        // CEI pattern: Effects before Interactions
        bool success = usdt.transferFrom(msg.sender, address(this), usdtAmount);
        require(success, "TokenStore: USDT transfer failed");
        
        // Mint GT to buyer
        gameToken.mint(msg.sender, gtOut);
        
        emit Purchase(msg.sender, usdtAmount, gtOut);
    }
    
    /**
     * @dev Update the exchange rate (owner only)
     * @param _gtPerUsdt New exchange rate
     */
    function updateRate(uint256 _gtPerUsdt) external onlyOwner {
        require(_gtPerUsdt > 0, "TokenStore: invalid exchange rate");
        
        uint256 oldRate = gtPerUsdt;
        gtPerUsdt = _gtPerUsdt;
        
        emit RateUpdated(oldRate, _gtPerUsdt);
    }
    
    /**
     * @dev Withdraw USDT from contract (owner only)
     * @param to Address to withdraw to
     * @param amount Amount to withdraw
     */
    function withdrawUSDT(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TokenStore: invalid recipient");
        require(amount > 0, "TokenStore: amount must be positive");
        require(usdt.balanceOf(address(this)) >= amount, "TokenStore: insufficient balance");
        
        bool success = usdt.transfer(to, amount);
        require(success, "TokenStore: USDT transfer failed");
        
        emit USDTWithdrawn(to, amount);
    }
}
