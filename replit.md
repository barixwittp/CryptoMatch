# Overview

A complete blockchain gaming platform that combines smart contracts with a web interface for competitive gaming. The platform features ERC-20 token management, escrow-based match staking, and real-time leaderboard tracking. Players can purchase GameTokens (GT) using USDT, create matches with stakes, and compete in winner-takes-all scenarios where the victor receives the combined stakes of both players.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Smart Contract Layer
The platform uses three core Solidity contracts built on Ethereum:

- **GameToken (GT)**: Standard ERC-20 token with 18 decimals that serves as the platform's native currency. Only the TokenStore contract can mint new tokens, ensuring controlled supply management.
- **TokenStore**: Handles USDT-to-GameToken conversion at a 1:1 ratio. Uses secure transferFrom pattern to pull USDT from users and mints equivalent GT tokens. Includes owner-only withdrawal functionality for collected USDT.
- **PlayGame**: Manages the complete match lifecycle including creation, staking, and settlement. Implements escrow functionality where both players must stake tokens before a match begins, with winner receiving the full pot.

## Backend API Architecture
Express.js server acts as a blockchain gateway, providing REST endpoints for contract interactions:

- Token purchase operations through TokenStore contract
- Match creation and staking coordination
- Result submission and settlement processing
- Event monitoring and transaction management

The backend uses ethers.js for blockchain communication and implements proper error handling and validation. It serves as the authorized operator for match result commitments.

## Frontend Architecture
Single-page web application built with vanilla JavaScript and Bootstrap:

- Web3 wallet integration for user authentication
- Real-time balance updates and transaction monitoring
- Form-based interfaces for all platform operations
- Event log display for transaction history

The frontend communicates directly with MetaMask for wallet operations and with the backend API for complex transactions.

## Data Storage Strategy
Hybrid approach combining blockchain and traditional storage:

- **On-chain**: All critical game data including token balances, match states, and settlement records stored immutably on Ethereum
- **Off-chain**: SQLite database for leaderboard aggregation and performance statistics, updated via event listening

## Event-Driven Leaderboard System
Real-time statistics tracking through blockchain event monitoring:

- Dedicated Node.js service listens to contract events
- Maintains player statistics including wins, total winnings, and match participation
- Provides REST API for leaderboard queries
- Automatically updates when settlements occur on-chain

# External Dependencies

## Blockchain Infrastructure
- **Ethereum Networks**: Supports Hardhat local development, Sepolia testnet, and Mainnet deployments
- **Infura/RPC Providers**: For reliable blockchain connectivity and transaction broadcasting
- **Etherscan**: Contract verification and transaction monitoring

## Smart Contract Libraries
- **OpenZeppelin Contracts**: Provides secure, audited implementations for ERC-20 tokens and access control patterns
- **Hardhat Framework**: Development environment for contract compilation, testing, and deployment

## Token Integration
- **USDT (Tether)**: Primary fiat-pegged stablecoin for platform entry, supporting both mainnet and testnet versions

## Development Stack
- **Node.js/Express**: Backend API server for blockchain interaction coordination
- **ethers.js**: Primary library for smart contract communication and transaction management
- **SQLite**: Lightweight database for leaderboard and statistics storage
- **Bootstrap/Font Awesome**: Frontend UI framework and iconography

## Deployment Infrastructure
- **Environment Configuration**: dotenv for secure credential management
- **CORS Support**: Cross-origin resource sharing for frontend-backend communication
- **Web3 Wallet Support**: MetaMask integration for user wallet connectivity