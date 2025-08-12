# 🎮 Decentralized Gaming Platform (Ethereum Sepolia)

A **decentralized gaming platform** built on the **Ethereum Sepolia testnet** that enables two players to stake a custom ERC-20 token called **GameToken (GT)** against each other in matches.  

The system includes:
- **Smart Contracts** for token minting, escrow, and match handling
- **Backend API** for interaction with the blockchain
- **Frontend UI** for players
- **Real-Time Leaderboard** service

---

## 🚀 Key Features

- **🛡 Decentralized Staking**  
  Matches are managed by an **escrow smart contract** that securely holds both players’ stakes.  
  Automated payouts ensure the winner instantly receives both stakes when the result is submitted.

- **💱 Token On-Ramp**  
  Acquire **GT tokens** by exchanging mock **USDT** through a dedicated smart contract.

- **🖥 Simple Interface**  
  - Connect your MetaMask wallet  
  - Buy tokens  
  - Create matches & stake tokens  
  - Submit results

- **📊 Real-Time Leaderboard**  
  A separate service listens to blockchain events to maintain a **leaderboard of top players**.

- **👨‍💻 Developer-Friendly**  
  Built with **Hardhat** + **ethers.js** for an easy-to-understand, extendable codebase.

---

## 🛠 Getting Started

### **Prerequisites**
Ensure you have the following installed:

| Tool | Version | Link |
|------|---------|------|
| Node.js | v18+ | [Download](https://nodejs.org/) |
| npm | v8+ | Included with Node.js |
| MetaMask | Latest | [Install](https://metamask.io/) |
| Sepolia ETH | - | [Get from faucet](https://sepoliafaucet.com/) |

You will also need:
- A **Sepolia RPC URL** from [Alchemy](https://www.alchemy.com/), [Infura](https://infura.io/), or QuickNode
- Your **MetaMask private key** with Sepolia ETH

---

## 📦 Installation

Clone the repository:
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

⚙️ Configuration
Create a .env file in the root directory:

bash
Copy
Edit
touch .env
Add your credentials:

env
Copy
Edit
PRIVATE_KEY="your_metamask_private_key"
SEPOLIA_RPC_URL="your_sepolia_rpc_url_from_alchemy"
🚢 Deployment
1️⃣ Compile Smart Contracts
bash
Copy
Edit
npx hardhat compile
2️⃣ Deploy to Sepolia
bash
Copy
Edit
npx hardhat run scripts/deploy.js --network sepolia
When deployed, you will see contract addresses in the console.
Add them to your .env:

env
Copy
Edit
TOKENSTORE_ADDRESS=0xYourTokenStoreAddress
PLAYGAME_ADDRESS=0xYourPlayGameAddress
GAME_TOKEN_ADDRESS=0xYourGameTokenAddress
USDT_ADDRESS=0xYourMockUSDTAddress
🌐 Usage
1️⃣ Start Backend API
bash
Copy
Edit
cd api
node index.js
Runs at: http://localhost:3000

2️⃣ Start Leaderboard Service
bash
Copy
Edit
node tools/leaderboard.js
Runs at: http://localhost:4001/leaderboard

3️⃣ Open Frontend
Open web/index.html in your browser and connect MetaMask.

🔄 Workflow
Connect MetaMask to Sepolia network

Acquire Sepolia ETH & mock USDT

Approve TokenStore contract to spend USDT

Buy GameToken (GT)

Create a match & stake GT

Submit results to receive winnings

View the updated leaderboard
