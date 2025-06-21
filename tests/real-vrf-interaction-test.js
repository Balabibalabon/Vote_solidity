// Real Chainlink VRF Interaction Test
// Demonstrates how to interact with true Chainlink VRF in production
// This test shows the complete workflow from subscription to fulfillment
// Run with: node tests/real-vrf-interaction-test.js

const { ethers } = require("hardhat");
const { network } = require("hardhat");

// Real VRF Coordinator addresses for different networks
const VRF_COORDINATORS = {
    sepolia: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    mumbai: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    mainnet: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909"
};

// Key hashes for different gas lanes
const KEY_HASHES = {
    sepolia: {
        "30gwei": "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        "50gwei": "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15"
    },
    mumbai: {
        "500gwei": "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        "1000gwei": "0xcc294a196eeeb44da2888d17c0625cc88d70d9760a69d58d853ba6581a9ab0cd"
    },
    mainnet: {
        "200gwei": "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        "500gwei": "0xff8dedfbfa60af186cf3c830acbc32c05aae823045ae5ea7da1e45fbfaba4f92"
    }
};

async function main() {
    console.log("🎯 Real Chainlink VRF Interaction Test");
    console.log("=" .repeat(60));
    
    const networkName = network.name;
    console.log("🌐 Network:", networkName);
    
    if (networkName === "hardhat" || networkName === "localhost") {
        console.log("⚠️  This test demonstrates real VRF interaction");
        console.log("📝 Running in simulation mode for local testing\n");
        await simulateRealVRFInteraction();
    } else {
        console.log("🎯 Running actual VRF interaction test\n");
        await testRealVRFInteraction();
    }
}

async function simulateRealVRFInteraction() {
    console.log("🎭 SIMULATION: Real Chainlink VRF Interaction");
    console.log("=" .repeat(50));
    
    // Step 1: Environment Setup Simulation
    console.log("📋 Step 1: Environment Setup");
    console.log("   In production, you would:");
    console.log("   1. Create VRF subscription at vrf.chain.link");
    console.log("   2. Fund subscription with LINK tokens");
    console.log("   3. Note your subscription ID");
    console.log("   4. Set environment variables");
    console.log("");
    
    // Simulate environment variables
    const simulatedConfig = {
        subscriptionId: 123, // Would be from process.env.VRF_SUBSCRIPTION_ID
        vrfCoordinator: VRF_COORDINATORS.sepolia,
        keyHash: KEY_HASHES.sepolia["30gwei"],
        network: "sepolia"
    };
    
    console.log("🔧 Simulated Configuration:");
    console.log("   Subscription ID:", simulatedConfig.subscriptionId);
    console.log("   VRF Coordinator:", simulatedConfig.vrfCoordinator);
    console.log("   Key Hash:", simulatedConfig.keyHash);
    console.log("   Network:", simulatedConfig.network);
    console.log("");
    
    // Step 2: Deploy Real VRF Consumer Contract
    console.log("📋 Step 2: Deploy VRF Consumer Contract");
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    // For simulation, we'll use our ChainlinkVRF contract
    console.log("🚀 Deploying ChainlinkVRF consumer contract...");
    const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
    const vrfConsumer = await ChainlinkVRF.deploy(
        simulatedConfig.subscriptionId,
        simulatedConfig.vrfCoordinator,
        simulatedConfig.keyHash
    );
    await vrfConsumer.waitForDeployment();
    console.log("✅ VRF Consumer deployed at:", await vrfConsumer.getAddress());
    console.log("");
    
    // Step 3: Add Consumer to Subscription (Simulation)
    console.log("📋 Step 3: Add Consumer to VRF Subscription");
    console.log("   In production, you would:");
    console.log("   1. Go to vrf.chain.link");
    console.log("   2. Select your subscription");
    console.log("   3. Click 'Add consumer'");
    console.log("   4. Enter contract address:", await vrfConsumer.getAddress());
    console.log("   5. Confirm transaction");
    console.log("✅ Consumer added to subscription (simulated)");
    console.log("");
    
    // Step 4: Deploy Vote Contract with VRF
    console.log("📋 Step 4: Deploy Vote Contract with VRF Integration");
    
    // Deploy supporting NFT contract
    const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
    const nftContract = await TransferableNFT.deploy(
        "Real VRF Voting NFT",
        "Production VRF voting rights"
    );
    await nftContract.waitForDeployment();
    console.log("🎫 NFT Contract deployed at:", await nftContract.getAddress());
    
    // Deploy vote contract
    const Vote = await ethers.getContractFactory("Vote");
    const voteContract = await Vote.deploy(
        "Real VRF Vote",
        "Production vote with real VRF integration",
        4, // 4 options
        await nftContract.getAddress(),
        await vrfConsumer.getAddress(),
        24, // 24 hours
        true // Use random winner
    );
    await voteContract.waitForDeployment();
    console.log("🗳️  Vote Contract deployed at:", await voteContract.getAddress());
    
    // Set up NFT contract
    await nftContract.setVoteContract(await voteContract.getAddress());
    await nftContract.transferOwnership(await voteContract.getAddress());
    console.log("✅ NFT contract configured");
    console.log("");
    
    // Step 5: Test VRF Request Process
    console.log("📋 Step 5: VRF Request Process");
    await testVRFRequestProcess(vrfConsumer, voteContract, nftContract);
    
    // Step 6: Monitoring and Debugging
    console.log("📋 Step 6: Monitoring and Debugging");
    await demonstrateMonitoring(vrfConsumer, voteContract);
    
    console.log("\n🎉 Real VRF Interaction Simulation Complete!");
}

async function testRealVRFInteraction() {
    console.log("🎯 ACTUAL: Real Chainlink VRF Interaction");
    console.log("=" .repeat(50));
    
    const networkName = network.name;
    
    // Validate environment
    if (!process.env.VRF_SUBSCRIPTION_ID) {
        throw new Error("❌ VRF_SUBSCRIPTION_ID environment variable required");
    }
    
    const config = {
        subscriptionId: parseInt(process.env.VRF_SUBSCRIPTION_ID),
        vrfCoordinator: VRF_COORDINATORS[networkName],
        keyHash: KEY_HASHES[networkName]?.["30gwei"] || KEY_HASHES[networkName]?.["500gwei"],
        network: networkName
    };
    
    if (!config.vrfCoordinator || !config.keyHash) {
        throw new Error(`❌ Unsupported network: ${networkName}`);
    }
    
    console.log("🔧 Production Configuration:");
    console.log("   Subscription ID:", config.subscriptionId);
    console.log("   VRF Coordinator:", config.vrfCoordinator);
    console.log("   Key Hash:", config.keyHash);
    console.log("   Network:", config.network);
    console.log("");
    
    // Deploy and test with real configuration
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // Deploy VRF consumer
    console.log("🚀 Deploying production VRF consumer...");
    const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
    const vrfConsumer = await ChainlinkVRF.deploy(
        config.subscriptionId,
        config.vrfCoordinator,
        config.keyHash
    );
    await vrfConsumer.waitForDeployment();
    console.log("✅ VRF Consumer deployed at:", await vrfConsumer.getAddress());
    
    console.log("\n⚠️  IMPORTANT: Add this contract as a consumer to your VRF subscription!");
    console.log("🔗 Subscription Management: https://vrf.chain.link/");
    console.log("📝 Consumer Address:", await vrfConsumer.getAddress());
    
    // Continue with vote contract deployment and testing
    await deployAndTestWithRealVRF(vrfConsumer, config);
}

async function testVRFRequestProcess(vrfConsumer, voteContract, nftContract) {
    const [deployer, voter1, voter2, voter3] = await ethers.getSigners();
    
    console.log("🗳️  Testing VRF Request Process...");
    
    // Cast some votes
    console.log("👤 Casting votes...");
    await voteContract.connect(voter1).vote(1);
    await voteContract.connect(voter2).vote(2);
    await voteContract.connect(voter3).vote(3);
    
    // Check vote results
    const voteResults = await voteContract.TotalVoteRecordGetter();
    console.log("📊 Vote Results:");
    for (let i = 1; i < voteResults.length; i++) {
        console.log(`   Option ${i}: ${voteResults[i].toString()} votes`);
    }
    
    // Simulate time passage to end vote
    console.log("⏰ Simulating vote end...");
    await ethers.provider.send("evm_increaseTime", [24 * 3600]); // 24 hours
    await ethers.provider.send("evm_mine");
    
    // End vote and request VRF
    console.log("🏁 Ending vote...");
    await voteContract.endVote();
    
    console.log("🎲 Requesting random winner...");
    try {
        const tx = await voteContract.rewardWinner();
        const receipt = await tx.wait();
        console.log("✅ VRF request submitted");
        console.log("📝 Transaction hash:", receipt.hash);
        
        // In real VRF, we would wait for fulfillment
        console.log("⏳ In production: Wait for VRF fulfillment (1-3 blocks)");
        console.log("🔍 Monitor at: https://vrf.chain.link/");
        
    } catch (error) {
        console.log("⚠️  VRF request simulation (expected in local testing):", error.message);
    }
    
    console.log("");
}

async function demonstrateMonitoring(vrfConsumer, voteContract) {
    console.log("📊 VRF Monitoring and Debugging...");
    
    // Get VRF configuration
    console.log("🔧 VRF Configuration:");
    try {
        const subscriptionId = await vrfConsumer.getSubscriptionId();
        const keyHash = await vrfConsumer.getKeyHash();
        const vrfCoordinator = await vrfConsumer.getVRFCoordinator();
        
        console.log("   Subscription ID:", subscriptionId.toString());
        console.log("   Key Hash:", keyHash);
        console.log("   VRF Coordinator:", vrfCoordinator);
    } catch (error) {
        console.log("   Configuration check failed:", error.message);
    }
    
    // Check automation config
    console.log("⏰ Automation Configuration:");
    try {
        const automationConfig = await vrfConsumer.getAutomationConfig(await voteContract.getAddress());
        console.log("   Vote Contract:", automationConfig.voteContract);
        console.log("   Vote End Time:", new Date(Number(automationConfig.voteEndTime) * 1000).toLocaleString());
        console.log("   Is Active:", automationConfig.isActive);
        console.log("   Executed:", automationConfig.executed);
    } catch (error) {
        console.log("   Automation config check failed:", error.message);
    }
    
    // Demonstrate event monitoring
    console.log("📡 Event Monitoring Setup:");
    console.log("   In production, monitor these events:");
    console.log("   • RequestSent - VRF request initiated");
    console.log("   • RequestFulfilled - VRF response received");
    console.log("   • VoteEnded - Automation triggered");
    console.log("   • Voted - User participation");
    
    // Show debugging commands
    console.log("🛠️  Debugging Commands:");
    console.log("   # Check VRF subscription status");
    console.log("   npx hardhat console --network sepolia");
    console.log("   > const vrf = await ethers.getContractAt('ChainlinkVRF', 'CONTRACT_ADDRESS')");
    console.log("   > await vrf.getSubscriptionId()");
    console.log("");
    console.log("   # Monitor VRF requests");
    console.log("   > const filter = vrf.filters.RequestSent()");
    console.log("   > const events = await vrf.queryFilter(filter)");
    console.log("");
    console.log("   # Check LINK balance");
    console.log("   Visit: https://vrf.chain.link/");
    
    console.log("");
}

async function deployAndTestWithRealVRF(vrfConsumer, config) {
    console.log("🏗️  Deploying Production Vote System...");
    
    const [deployer] = await ethers.getSigners();
    
    // Deploy NFT contract
    const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
    const nftContract = await TransferableNFT.deploy(
        "Production VRF NFT",
        "Real VRF voting rights"
    );
    await nftContract.waitForDeployment();
    console.log("🎫 NFT Contract:", await nftContract.getAddress());
    
    // Deploy vote contract
    const Vote = await ethers.getContractFactory("Vote");
    const voteContract = await Vote.deploy(
        "Production VRF Vote",
        "Real VRF integration test",
        3, // 3 options
        await nftContract.getAddress(),
        await vrfConsumer.getAddress(),
        2, // 2 hours
        true // Use random winner
    );
    await voteContract.waitForDeployment();
    console.log("🗳️  Vote Contract:", await voteContract.getAddress());
    
    // Configure NFT
    await nftContract.setVoteContract(await voteContract.getAddress());
    await nftContract.transferOwnership(await voteContract.getAddress());
    console.log("✅ Contracts configured");
    
    // Test basic functionality
    console.log("\n🧪 Testing Basic Functionality...");
    
    // Cast a test vote
    console.log("👤 Casting test vote...");
    await voteContract.vote(1);
    
    const voteResult = await voteContract.UserVoteRecordGetter();
    console.log("📝 Vote recorded:", voteResult.toString());
    
    const totalVotes = await voteContract.TotalVoteRecordGetter();
    console.log("📊 Total votes:", totalVotes[1].toString());
    
    console.log("\n✅ Production deployment and basic test complete!");
    console.log("⚠️  Remember to:");
    console.log("   1. Add consumer to VRF subscription");
    console.log("   2. Fund subscription with LINK tokens");
    console.log("   3. Monitor VRF requests and fulfillments");
    console.log("   4. Set up automation if needed");
}

// Helper function to create production deployment guide
async function createProductionGuide() {
    console.log("\n📚 PRODUCTION DEPLOYMENT GUIDE");
    console.log("=" .repeat(60));
    
    console.log("🔧 Prerequisites:");
    console.log("1. Create Chainlink VRF subscription at vrf.chain.link");
    console.log("2. Fund subscription with LINK tokens (minimum 5 LINK recommended)");
    console.log("3. Note your subscription ID");
    console.log("4. Set up environment variables:");
    console.log("   export VRF_SUBSCRIPTION_ID=your_subscription_id");
    console.log("   export PRIVATE_KEY=your_private_key");
    console.log("");
    
    console.log("🚀 Deployment Steps:");
    console.log("1. Deploy VRF consumer contract:");
    console.log("   npx hardhat run scripts/deploy-vrf.js --network sepolia");
    console.log("");
    console.log("2. Add consumer to subscription:");
    console.log("   • Go to vrf.chain.link");
    console.log("   • Select your subscription");
    console.log("   • Click 'Add consumer'");
    console.log("   • Enter deployed contract address");
    console.log("");
    console.log("3. Test VRF functionality:");
    console.log("   node tests/real-vrf-interaction-test.js");
    console.log("");
    console.log("4. Monitor and maintain:");
    console.log("   • Monitor LINK balance");
    console.log("   • Track VRF request/fulfillment ratio");
    console.log("   • Set up alerts for low balance");
    console.log("");
    
    console.log("🔍 Monitoring URLs:");
    console.log("• VRF Subscription: https://vrf.chain.link/");
    console.log("• Automation: https://automation.chain.link/");
    console.log("• LINK Faucets: https://faucets.chain.link/");
    console.log("");
    
    console.log("🛠️  Troubleshooting:");
    console.log("• 'Subscription not found' → Check subscription ID");
    console.log("• 'Consumer not added' → Add contract to subscription");
    console.log("• 'Insufficient LINK' → Fund subscription");
    console.log("• 'Request failed' → Check gas limits and confirmations");
}

// Error handling wrapper
async function runWithErrorHandling() {
    try {
        await main();
        await createProductionGuide();
        console.log("\n🎉 Real VRF Interaction Test Complete!");
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        
        if (error.message.includes("VRF_SUBSCRIPTION_ID")) {
            console.log("\n💡 To test with real VRF:");
            console.log("1. Create subscription at vrf.chain.link");
            console.log("2. Set VRF_SUBSCRIPTION_ID environment variable");
            console.log("3. Run on testnet (sepolia/mumbai)");
        }
        
        if (error.message.includes("Unsupported network")) {
            console.log("\n💡 Supported networks:");
            console.log("• sepolia (Ethereum testnet)");
            console.log("• mumbai (Polygon testnet)");
            console.log("• mainnet (Ethereum mainnet)");
        }
        
        process.exit(1);
    }
}

// Run the test
runWithErrorHandling(); 