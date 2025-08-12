// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing (6 decimals like real USDT)
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether", "USDT") {
        // Mint initial supply to deployer (1 million USDT)
        _mint(msg.sender, 1000000 * 10**6); // 6 decimals
    }
    
    function decimals() public pure override returns (uint8) {
        return 6; // USDT has 6 decimals
    }
    
    // Allow anyone to mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}