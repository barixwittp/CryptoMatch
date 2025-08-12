const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy Mock USDT for testing
  console.log("\nDeploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", mockUSDTAddress);
  const GT_PER_USDT = ethers.parseEther("1"); // 1 USDT = 1 GT

  // Deploy GameToken
  console.log("\nDeploying GameToken...");
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy("GameToken", "GT");
  await gameToken.waitForDeployment();
  const gameTokenAddress = await gameToken.getAddress();
  console.log("GameToken deployed to:", gameTokenAddress);

  // Deploy TokenStore
  console.log("\nDeploying TokenStore...");
  const TokenStore = await ethers.getContractFactory("TokenStore");
  const tokenStore = await TokenStore.deploy(mockUSDTAddress, gameTokenAddress, GT_PER_USDT);
  await tokenStore.waitForDeployment();
  const tokenStoreAddress = await tokenStore.getAddress();
  console.log("TokenStore deployed to:", tokenStoreAddress);

  // Set TokenStore address in GameToken
  console.log("\nSetting TokenStore in GameToken...");
  await gameToken.setTokenStore(tokenStoreAddress);
  console.log("TokenStore address set in GameToken");

  // Deploy PlayGame
  console.log("\nDeploying PlayGame...");
  const PlayGame = await ethers.getContractFactory("PlayGame");
  const playGame = await PlayGame.deploy(gameTokenAddress, deployer.address);
  await playGame.waitForDeployment();
  const playGameAddress = await playGame.getAddress();
  console.log("PlayGame deployed to:", playGameAddress);

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("GameToken:", gameTokenAddress);
  console.log("TokenStore:", tokenStoreAddress);
  console.log("PlayGame:", playGameAddress);
  console.log("USDT Address:", mockUSDTAddress);
  console.log("Exchange Rate:", "1 USDT = 1 GT");
  console.log("Operator (PlayGame):", deployer.address);

  // Save addresses to a file
  const fs = require("fs");
  const addresses = {
    gameToken: gameTokenAddress,
    tokenStore: tokenStoreAddress,
    playGame: playGameAddress,
    usdt: mockUSDTAddress,
    operator: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\nContract addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
