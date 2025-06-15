// Vote System Deployment Script
// Run with: node deploy.js

const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting Vote System Deployment...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    // Step 1: Deploy Chainlink Integration (Mock for testing)
    console.log("⛓️  Deploying Chainlink Integration...");
    const ChainlinkIntegration = await ethers.getContractFactory("ChainlinkIntegration");
    
    // Mock Chainlink parameters for testing (replace with real values for mainnet)
    const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Sepolia VRF Coordinator
    const subscriptionId = 1; // Replace with your Chainlink VRF subscription ID
    const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // 30 gwei Key Hash
    
    const chainlinkIntegration = await ChainlinkIntegration.deploy(
        vrfCoordinator,
        subscriptionId,
        keyHash
    );
    await chainlinkIntegration.waitForDeployment();
    console.log("✅ ChainlinkIntegration deployed to:", await chainlinkIntegration.getAddress());

    // Step 2: Deploy Vote Factory
    console.log("\n🏭 Deploying Vote Factory...");
    const VoteFactory = await ethers.getContractFactory("VoteFactory");
    const voteFactory = await VoteFactory.deploy();
    await voteFactory.waitForDeployment();
    console.log("✅ VoteFactory deployed to:", await voteFactory.getAddress());

    // Step 3: Connect Factory to Chainlink
    console.log("\n🔗 Connecting Factory to Chainlink...");
    await voteFactory.setChainlinkIntegration(await chainlinkIntegration.getAddress());
    console.log("✅ Chainlink integration set");

    // Step 4: Create a test vote
    console.log("\n🗳️  Creating test vote...");
    const createTx = await voteFactory.createVoteWithChainlink(
        "Best Blockchain Platform",
        "Vote for your favorite blockchain platform",
        3, // 3 options: Option 1, Option 2, Option 3
        24, // 24 hours duration
        false, // Use highest vote winner (not random)
        { value: ethers.parseEther("0.01") } // Small amount for testing
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
    console.log("   VoteFactory:        ", await voteFactory.getAddress());
    console.log("   Test Vote:          ", testVoteAddress);
    console.log("\n📝 Next Steps:");
    console.log("   1. Fund Chainlink subscription with LINK tokens");
    console.log("   2. Add ChainlinkIntegration as consumer to VRF subscription");
    console.log("   3. Test voting functionality");
    console.log("   4. Monitor Chainlink automation");
    
    return {
        chainlinkIntegration: await chainlinkIntegration.getAddress(),
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
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 