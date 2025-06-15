// Vote System Deployment Script
// Run with: npx hardhat run deploy.js --network sepolia

const { ethers, network } = require("hardhat");
require("dotenv").config();

async function validateEnvironment() {
    console.log("🔍 Validating environment...");
    console.log("   Network:", network.name);
    
    if (network.name === "sepolia" || network.name === "mumbai") {
        if (!process.env.INFURA_PROJECT_ID) {
            throw new Error("❌ INFURA_PROJECT_ID not set in .env file");
        }
        if (!process.env.PRIVATE_KEY) {
            throw new Error("❌ PRIVATE_KEY not set in .env file");
        }
        console.log("✅ Environment variables validated");
    } else {
        console.log("✅ Using local network - no env vars needed");
    }
}

async function main() {
    console.log("🚀 Starting Vote System Deployment...\n");
    
    // Validate environment first
    await validateEnvironment();
    
    const [deployer] = await ethers.getSigners();
    
    if (!deployer) {
        throw new Error("❌ No deployer account available. Check your network configuration and private key.");
    }
    
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    // Check if we have enough balance for deployment
    const balance = await deployer.provider.getBalance(deployer.address);
    if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️  WARNING: Low balance. You may need more ETH for deployment.");
    }

    // Step 1: Deploy Chainlink Integration (Mock for testing)
    console.log("⛓️  Deploying Chainlink Integration...");
    const ChainlinkIntegration = await ethers.getContractFactory("ChainlinkIntegration");
    
    const chainlinkIntegration = await ChainlinkIntegration.deploy();
    await chainlinkIntegration.waitForDeployment();
    console.log("✅ ChainlinkIntegration deployed to:", await chainlinkIntegration.getAddress());

    // Step 2: Deploy NFT contracts
    console.log("\n🎨 Deploying NFT contracts...");
    
    // Deploy TransferableNFT
    const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
    const transferableNFT = await TransferableNFT.deploy(
        "Test Vote",
        "Winner NFT Reward"
    );
    await transferableNFT.waitForDeployment();
    console.log("✅ TransferableNFT deployed to:", await transferableNFT.getAddress());
    
    // Deploy SoulboundNFT
    const SoulboundNFT = await ethers.getContractFactory("SoulboundNFT");
    const soulboundNFT = await SoulboundNFT.deploy(
        "Test Vote",
        "Voting Rights Token"
    );
    await soulboundNFT.waitForDeployment();
    console.log("✅ SoulboundNFT deployed to:", await soulboundNFT.getAddress());

    // Step 3: Deploy Vote Factory
    console.log("\n🏭 Deploying Vote Factory...");
    const VoteFactory = await ethers.getContractFactory("VoteFactory");
    const voteFactory = await VoteFactory.deploy();
    await voteFactory.waitForDeployment();
    console.log("✅ VoteFactory deployed to:", await voteFactory.getAddress());

    // Step 4: Create a test vote
    console.log("\n🗳️  Creating test vote...");
    const createTx = await voteFactory.createVote(
        "Best Blockchain Platform",
        "Vote for your favorite blockchain platform",
        3 // 3 options: Option 1, Option 2, Option 3
    );
    await createTx.wait();
    
    const voteList = await voteFactory.getVoteList();
    const testVoteAddress = voteList[voteList.length - 1];
    console.log("✅ Test vote created at:", testVoteAddress);

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("📋 Contract Addresses:");
    console.log("   ChainlinkIntegration:", await chainlinkIntegration.getAddress());
    console.log("   TransferableNFT:     ", await transferableNFT.getAddress());
    console.log("   SoulboundNFT:        ", await soulboundNFT.getAddress());
    console.log("   VoteFactory:         ", await voteFactory.getAddress());
    console.log("   Test Vote:           ", testVoteAddress);
    
    if (network.name === "sepolia") {
        console.log("\n🔗 Sepolia Testnet Links:");
        console.log("   Etherscan:", `https://sepolia.etherscan.io/address/${await voteFactory.getAddress()}`);
        console.log("   Get Sepolia ETH:", "https://sepoliafaucet.com/");
    }
    
    console.log("\n📝 Next Steps:");
    console.log("   1. Test voting functionality");
    console.log("   2. Verify contracts on Etherscan (optional)");
    console.log("   3. Set up frontend integration");
    
    return {
        chainlinkIntegration: await chainlinkIntegration.getAddress(),
        transferableNFT: await transferableNFT.getAddress(),
        soulboundNFT: await soulboundNFT.getAddress(),
        voteFactory: await voteFactory.getAddress(),
        testVote: testVoteAddress
    };
}

// Deploy and handle errors
main()
    .then((addresses) => {
        console.log("\n✅ Deployment successful!");
        console.log("📄 Save these addresses for testing:", addresses);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error.message);
        
        if (error.message.includes("INFURA_PROJECT_ID") || error.message.includes("PRIVATE_KEY")) {
            console.log("\n🔧 Setup Instructions:");
            console.log("   1. Copy env.example to .env");
            console.log("   2. Fill in your INFURA_PROJECT_ID and PRIVATE_KEY");
            console.log("   3. Get Infura ID from: https://infura.io/");
            console.log("   4. Export private key from MetaMask (Settings > Security & Privacy > Export Private Key)");
            console.log("   5. Get Sepolia ETH from: https://sepoliafaucet.com/");
        }
        
        process.exit(1);
    }); 