<div align="center">

# 🎮 CRYPTOMATCH 

*Empowering Trustless Gaming Through Blockchain Innovation*

[![Last Commit](https://img.shields.io/github/last-commit/barixwittp/CryptoMatch?color=brightgreen)](https://github.com/barixwittp/CryptoMatch/commits/main)
[![GitHub language count](https://img.shields.io/github/languages/count/barixwittp/CryptoMatch)](https://github.com/barixwittp/CryptoMatch)
![JavaScript %](https://img.shields.io/github/languages/top/barixwittp/CryptoMatch?color=yellow)
![Repo Size](https://img.shields.io/github/repo-size/barixwittp/CryptoMatch)
![License](https://img.shields.io/github/license/barixwittp/CryptoMatch)

---

### Built with

<a href="https://expressjs.com/" target="_blank"><img src="https://img.shields.io/badge/express.js-black?style=for-the-badge&logo=express&color=grey" alt="Express.js" /></a>
<a href="https://www.json.org/json-en.html" target="_blank"><img src="https://img.shields.io/badge/JSON-5E5C5C?style=for-the-badge&logo=json&logoColor=white" alt="JSON" /></a>
<a href="https://www.markdownguide.org/" target="_blank"><img src="https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white" alt="Markdown" /></a>
<a href="https://www.npmjs.com/" target="_blank"><img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm" /></a>
<a href="https://dotenv.org/" target="_blank"><img src="https://img.shields.io/badge/.env-C62601?style=for-the-badge&logo=.env&logoColor=white" alt=".env" /></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank"><img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" /></a>
<a href="https://www.python.org/" target="_blank"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
<a href="https://ethers.io/" target="_blank"><img src="https://img.shields.io/badge/Ethers.js-blue?style=for-the-badge&logo=ethers&logoColor=white" alt="Ethers.js" /></a>

</div>

---

## 📑 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview
CryptoMatch is a **decentralized gaming platform** that operates on the **Ethereum Sepolia testnet**. It provides a secure and transparent way for two players to engage in matches by staking a custom ERC-20 token, the **GameToken (GT)**. The entire system is designed to be trustless, meaning the game's core logic and transactions are handled automatically by smart contracts, eliminating the need for a central authority.

This repository contains all the necessary components to run the platform, including the smart contracts written in Solidity, a backend API built with Express.js and Ethers.js, a modern web-based frontend, and a separate service for maintaining a real-time leaderboard.

---

## 🚀 Key Features

* **Trustless Escrow System**: Matches are governed by a smart contract (`PlayGame.sol`) that acts as an escrow. It securely holds the staked tokens from both players until a match result is submitted. The winner is then automatically paid out the entire pot, ensuring fairness and security.

* **In-Game Currency**: The platform uses its own ERC-20 token, `GameToken (GT)`, as the in-game currency for all stakes and payouts. This token's minting is controlled by a separate `TokenStore` contract, making the tokenomics transparent and predictable.

* **Seamless On-Ramp**: Players can easily acquire `GameToken`s by swapping a mock USDT token through the `TokenStore` contract. This provides a clear and functional path for new players to get started on the platform.

* **Real-Time Leaderboard**: A dedicated backend service listens for blockchain events, specifically the `Settled` event from the `PlayGame` contract. It processes this data and updates a local database to maintain a dynamic leaderboard that ranks players based on their performance, such as total GT won and number of matches played.

* **Intuitive Web Interface**: The frontend is a clean and simple web application that allows players to perform all key actions. Users can connect their MetaMask wallet, view their GT balance, create matches for other players to join, and report results, all with clear feedback and toast notifications.

---

## ⚙️ Getting Started

### Prerequisites
To get this project up and running locally, you'll need the following installed:
* **Node.js (v18+)**: The runtime environment for the backend and frontend services.
* **npm**: Node's package manager, used for installing dependencies.
* **MetaMask**: A browser extension to connect to the Ethereum network and manage your wallet.
* **Sepolia ETH**: Testnet Ether to cover gas fees for transactions. You can get this from a public faucet.

### Installation
Follow these simple steps to set up the project:

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/barixwittp/CryptoMatch.git](https://github.com/barixwittp/CryptoMatch.git)
    cd CryptoMatch
    ```

2.  **Install all dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory and populate it with your configuration. You will need a Sepolia RPC URL and a private key for the "operator" wallet, which will be used by the backend to submit results.
    ```env
    SEPOLIA_RPC_URL="YOUR_SEPOLIA_RPC_URL"
    PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
    GAME_TOKEN_ADDRESS=""
    TOKEN_STORE_ADDRESS=""
    PLAY_GAME_ADDRESS=""
    ```
    Note: The contract addresses will be filled in automatically after the deployment step.

4.  **Deploy contracts**:
    First, start a local Hardhat development node:
    ```bash
    npx hardhat node
    ```
    Then, in a new terminal, deploy the contracts to the local network:
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
    This script will deploy the contracts and save their addresses to `deployed-addresses.json`. Copy these addresses into your `.env` file.

5.  **Start the services**:
    You'll need to run three separate services in different terminal windows:
    * **Backend API**:
        ```bash
        node api/server.js
        ```
    * **Leaderboard Service**:
        ```bash
        node tools/leaderboard.js
        ```
    * **Frontend Proxy Server**:
        ```bash
        python3 web/proxy.py
        ```
    The frontend will now be accessible at `http://localhost:5000`.

---

## 📁 Project Structure

* `api/`: The Express.js backend API.
    * `server.js`: The main file for the API. It connects to the blockchain and exposes endpoints for all game-related actions, such as purchasing tokens and submitting results.

* `contracts/`: Solidity smart contracts.
    * `GameToken.sol`: The ERC-20 token for the platform.
    * `MockUSDT.sol`: A simple mock USDT token for testing purchases.
    * `PlayGame.sol`: The core escrow contract for managing matches.
    * `TokenStore.sol`: The contract for converting mock USDT to GameTokens.

* `scripts/`: Hardhat deployment scripts.
    * `deploy.js`: Deploys all contracts and outputs their addresses.

* `tools/`: Helper services.
    * `leaderboard.db`: The SQLite database that stores leaderboard data.
    * `leaderboard.js`: A service that listens for blockchain events and updates the leaderboard database in real-time.

* `web/`: Frontend files.
    * `index.html`: The main user interface.
    * `app.js`: The client-side logic for connecting the UI to the backend API.
    * `style.css`: Custom styling for the application.
    * `proxy.py`: A Python script to serve the frontend and proxy API calls to handle CORS issues.

---


