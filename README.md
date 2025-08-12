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

