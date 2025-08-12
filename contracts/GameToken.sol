// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameToken
 * @dev ERC-20 token for the gaming platform with mint functionality restricted to TokenStore
 */
contract GameToken is ERC20, Ownable {
    address public tokenStore;
    
    event Minted(address indexed to, uint256 amount);
    
    modifier onlyTokenStore() {
        require(msg.sender == tokenStore, "GameToken: caller is not TokenStore");
        _;
    }
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}
    
    /**
     * @dev Set the TokenStore address (can only be called once by owner)
     * @param _tokenStore Address of the TokenStore contract
     */
    function setTokenStore(address _tokenStore) external onlyOwner {
        require(tokenStore == address(0), "GameToken: TokenStore already set");
        require(_tokenStore != address(0), "GameToken: invalid TokenStore address");
        tokenStore = _tokenStore;
    }
    
    /**
     * @dev Mint tokens to specified address (only callable by TokenStore)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyTokenStore {
        require(to != address(0), "GameToken: mint to zero address");
        require(amount > 0, "GameToken: mint amount must be positive");
        
        _mint(to, amount);
        emit Minted(to, amount);
    }
}
