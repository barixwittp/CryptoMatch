This is a decentralized gaming platform built on the Ethereum Sepolia testnet. It provides a simple, secure, and transparent way for two players to stake a custom token called "GameToken" (GT) against each other in a match. The platform's components—smart contracts, a backend gateway, a simple frontend, and a real-time leaderboard—work together to provide a seamless gaming experience on the blockchain.

🚀 Key Features
Decentralized Staking: Matches are managed by an escrow smart contract that securely holds the stakes. Payouts are automated, ensuring the winner receives both players' stakes immediately after the result is submitted.

Token On-Ramp: Users can easily acquire GT tokens by exchanging a mock USDT token through a smart contract.

Simple Interface: The application features a clean, single-page web interface where users can connect their MetaMask wallet, buy tokens, create matches, and submit results.

Real-Time Leaderboard: A separate service listens to blockchain events in real-time to maintain and display a leaderboard of top players based on their winnings.

Developer-Friendly: The platform is built with Hardhat and ethers.js, providing a robust and easy-to-understand codebase for building decentralized applications.

🛠️ Getting Started
Follow these steps to set up and run the project locally.

Prerequisites
Node.js (v18+)

npm (v8+)

MetaMask browser extension

A Sepolia testnet RPC URL (e.g., from Alchemy) and a private key with some SepoliaETH for gas fees.

Installation
Clone the repository:

Bash

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
Install dependencies:

Bash

npm install
Configuration
Create a .env file in the root directory.

Bash

touch .env
Add your credentials to the .env file:

Bash

PRIVATE_KEY="your_metamask_private_key"
SEPOLIA_RPC_URL="your_sepolia_rpc_url_from_alchemy"
Deployment
Compile the smart contracts:

Bash

npx hardhat compile
Deploy the contracts to Sepolia:

Bash

npx hardhat run scripts/deploy.js --network sepolia
This will output the deployed contract addresses. Copy these addresses and add them to your .env file for the backend to use.

🌐 Usage
To use the application, you must run the backend, the leaderboard service, and the frontend.

Start the Backend API:

Bash

cd api
node server.js
The API will run on http://localhost:3000.

Start the Leaderboard Service:

Bash

cd tools
node leaderboard.js
This service will listen for blockchain events and provide the leaderboard data.

Open the Frontend:
Open the web/index.html file in your browser to interact with the application.

This video demonstrates how to document your code with GitHub Wikis.
https://www.youtube.com/watch?v=4gPJV96fvno
