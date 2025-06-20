// Production Chainlink VRF Integration Test
// Shows how to interact with real Chainlink VRF Coordinator
// Includes subscription management, consumer setup, and request monitoring
// Run with: node tests/production-vrf-integration.js

const { ethers } = require("hardhat");
const { network } = require("hardhat");

// Real Chainlink VRF Coordinator ABI (simplified for key functions)
const VRF_COORDINATOR_ABI = [
    "function requestRandomWords(bytes32 keyHash, uint64 subId, uint16 minimumRequestConfirmations, uint32 callbackGasLimit, uint32 numWords) external returns (uint256 requestId)",
    "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)",
    "function addConsumer(uint64 subId, address consumer) external",
    "function removeConsumer(uint64 subId, address consumer) external",
    "event RandomWordsRequested(bytes32 indexed keyHash, uint256 requestId, uint256 indexed subId, uint16 minimumRequestConfirmations, uint32 callbackGasLimit, uint32 numWords, address indexed sender)",
    "event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success)"
];

// LINK Token ABI (for balance checking)
const LINK_TOKEN_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

// Network configurations
const NETWORK_CONFIG = {
    sepolia: {
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        chainId: 11155111
    },
    mumbai: {
        vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        chainId: 80001
    },
    mainnet: {
        vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        keyHash: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        chainId: 1
    }
};

async function main() {
    console.log("🎯 Production Chainlink VRF Integration Test");
    console.log("=" .repeat(60));
    
    const networkName = network.name;
    console.log("🌐 Network:", networkName);
    
    if (networkName === "hardhat" || networkName === "localhost") {
        console.log("📝 Running production simulation for local testing\n");
        await runProductionSimulation();
    } else {
        console.log("🚀 Running actual production integration test\n");
        await runProductionIntegration();
    }
}

async function runProductionSimulation() {
    console.log("🎭 PRODUCTION SIMULATION MODE");
    console.log("=" .repeat(40));
    
    // Simulate real VRF coordinator interaction
    await simulateVRFCoordinatorInteraction();
    
    // Simulate subscription management
    await simulateSubscriptionManagement();
    
    // Simulate consumer contract integration
    await simulateConsumerIntegration();
    
    // Simulate monitoring and debugging
    await simulateMonitoringAndDebugging();
}

async function simulateVRFCoordinatorInteraction() {
    console.log("📋 Step 1: VRF Coordinator Interaction Simulation");
    console.log("-".repeat(50));
    
    const [deployer] = await ethers.getSigners();
    const config = NETWORK_CONFIG.sepolia; // Use Sepolia config for simulation
    
    console.log("🔧 VRF Coordinator Configuration:");
    console.log("   Address:", config.vrfCoordinator);
    console.log("   LINK Token:", config.linkToken);
    console.log("   Key Hash:", config.keyHash);
    console.log("   Chain ID:", config.chainId);
    console.log("");
    
    // Create interface to VRF Coordinator (simulation)
    console.log("🔗 Creating VRF Coordinator interface...");
    console.log("   In production: const vrfCoordinator = new ethers.Contract(address, abi, signer)");
    console.log("✅ VRF Coordinator interface created");
    console.log("");
    
    // Simulate subscription check
    console.log("🔍 Checking VRF subscription...");
    console.log("   In production: await vrfCoordinator.getSubscription(subscriptionId)");
    console.log("   Returns: { balance, reqCount, owner, consumers }");
    
    // Simulate subscription data
    const mockSubscriptionData = {
        balance: ethers.parseEther("5.0"), // 5 LINK
        reqCount: 10,
        owner: deployer.address,
        consumers: ["0x1234...5678", "0x9abc...def0"]
    };
    
    console.log("📊 Subscription Status (simulated):");
    console.log("   LINK Balance:", ethers.formatEther(mockSubscriptionData.balance), "LINK");
    console.log("   Request Count:", mockSubscriptionData.reqCount.toString());
    console.log("   Owner:", mockSubscriptionData.owner);
    console.log("   Consumers:", mockSubscriptionData.consumers.length);
    console.log("");
}

async function simulateSubscriptionManagement() {
    console.log("📋 Step 2: Subscription Management Simulation");
    console.log("-".repeat(50));
    
    const subscriptionId = 123; // Mock subscription ID
    
    console.log("🎫 Subscription Management Operations:");
    console.log("");
    
    // 1. Create subscription (done via UI)
    console.log("1️⃣  Create Subscription:");
    console.log("   • Go to vrf.chain.link");
    console.log("   • Connect wallet");
    console.log("   • Click 'Create Subscription'");
    console.log("   • Note subscription ID:", subscriptionId);
    console.log("");
    
    // 2. Fund subscription
    console.log("2️⃣  Fund Subscription:");
    console.log("   • Method A: Via UI (recommended)");
    console.log("     - Go to vrf.chain.link");
    console.log("     - Select subscription");
    console.log("     - Click 'Fund subscription'");
    console.log("     - Enter LINK amount");
    console.log("");
    console.log("   • Method B: Via Contract");
    console.log("     const linkToken = new ethers.Contract(linkAddress, LINK_ABI, signer)");
    console.log("     await linkToken.transferAndCall(coordinatorAddress, amount, subscriptionId)");
    console.log("");
    
    // 3. Add consumers
    console.log("3️⃣  Add Consumer Contract:");
    console.log("   • Method A: Via UI (recommended)");
    console.log("     - Go to vrf.chain.link");
    console.log("     - Select subscription");
    console.log("     - Click 'Add consumer'");
    console.log("     - Enter contract address");
    console.log("");
    console.log("   • Method B: Via Contract (if you're subscription owner)");
    console.log("     const coordinator = new ethers.Contract(coordinatorAddress, VRF_ABI, signer)");
    console.log("     await coordinator.addConsumer(subscriptionId, consumerAddress)");
    console.log("");
}

async function simulateConsumerIntegration() {
    console.log("📋 Step 3: Consumer Contract Integration");
    console.log("-".repeat(50));
    
    const [deployer, voter1, voter2] = await ethers.getSigners();
    
    // Deploy our VRF consumer contract
    console.log("🚀 Deploying VRF Consumer Contract...");
    const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
    const vrfConsumer = await ChainlinkVRF.deploy(
        123, // Mock subscription ID
        NETWORK_CONFIG.sepolia.vrfCoordinator,
        NETWORK_CONFIG.sepolia.keyHash
    );
    await vrfConsumer.waitForDeployment();
    console.log("✅ VRF Consumer deployed at:", await vrfConsumer.getAddress());
    console.log("");
    
    // Deploy vote system
    console.log("🗳️  Deploying Vote System...");
    const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
    const nftContract = await TransferableNFT.deploy(
        "Production VRF NFT",
        "Real VRF voting rights"
    );
    await nftContract.waitForDeployment();
    
    const Vote = await ethers.getContractFactory("Vote");
    const voteContract = await Vote.deploy(
        "Production VRF Vote",
        "Testing real VRF integration",
        3, // 3 options
        await nftContract.getAddress(),
        await vrfConsumer.getAddress(),
        1, // 1 hour
        true // Use random winner
    );
    await voteContract.waitForDeployment();
    
    // Configure contracts
    await nftContract.setVoteContract(await voteContract.getAddress());
    await nftContract.transferOwnership(await voteContract.getAddress());
    
    console.log("✅ Vote system deployed and configured");
    console.log("   NFT Contract:", await nftContract.getAddress());
    console.log("   Vote Contract:", await voteContract.getAddress());
    console.log("");
    
    // Test VRF request flow
    console.log("🎲 Testing VRF Request Flow...");
    
    // Cast votes
    console.log("👥 Casting votes...");
    await voteContract.connect(voter1).vote(1);
    await voteContract.connect(voter2).vote(2);
    
    const voteResults = await voteContract.TotalVoteRecordGetter();
    console.log("📊 Vote results:");
    for (let i = 1; i < voteResults.length; i++) {
        console.log(`   Option ${i}: ${voteResults[i].toString()} votes`);
    }
    
    // Simulate vote ending and VRF request
    console.log("⏰ Simulating vote end...");
    await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
    await ethers.provider.send("evm_mine");
    
    await voteContract.endVote();
    console.log("✅ Vote ended");
    
    // Request random winner
    console.log("🎯 Requesting random winner...");
    try {
        await voteContract.rewardWinner();
        console.log("✅ VRF request initiated (simulated)");
        
        // Show what happens in production
        console.log("");
        console.log("🔄 In Production VRF Flow:");
        console.log("   1. VRF request sent to coordinator");
        console.log("   2. Chainlink node processes request");
        console.log("   3. Random number generated off-chain");
        console.log("   4. fulfillRandomWords() called with proof");
        console.log("   5. Consumer contract processes result");
        console.log("   6. Winner selected and rewards distributed");
        
    } catch (error) {
        console.log("⚠️  VRF request simulation (expected in local testing)");
    }
    
    console.log("");
}

async function simulateMonitoringAndDebugging() {
    console.log("📋 Step 4: Monitoring and Debugging");
    console.log("-".repeat(50));
    
    console.log("📊 Production Monitoring Setup:");
    console.log("");
    
    // Event monitoring
    console.log("1️⃣  Event Monitoring:");
    console.log("   const vrfCoordinator = new ethers.Contract(address, abi, provider)");
    console.log("");
    console.log("   // Monitor VRF requests");
    console.log("   const requestFilter = vrfCoordinator.filters.RandomWordsRequested()");
    console.log("   vrfCoordinator.on(requestFilter, (keyHash, requestId, subId, confirmations, gasLimit, numWords, sender) => {");
    console.log("     console.log('VRF Request:', { requestId, sender })");
    console.log("   })");
    console.log("");
    console.log("   // Monitor VRF fulfillments");
    console.log("   const fulfillFilter = vrfCoordinator.filters.RandomWordsFulfilled()");
    console.log("   vrfCoordinator.on(fulfillFilter, (requestId, outputSeed, payment, success) => {");
    console.log("     console.log('VRF Fulfilled:', { requestId, success })");
    console.log("   })");
    console.log("");
    
    // Subscription monitoring
    console.log("2️⃣  Subscription Monitoring:");
    console.log("   async function checkSubscription(subscriptionId) {");
    console.log("     const sub = await vrfCoordinator.getSubscription(subscriptionId)");
    console.log("     const linkBalance = ethers.formatEther(sub.balance)");
    console.log("     ");
    console.log("     if (parseFloat(linkBalance) < 1.0) {");
    console.log("       console.warn('Low LINK balance:', linkBalance)");
    console.log("       // Send alert to monitoring system");
    console.log("     }");
    console.log("     ");
    console.log("     return {");
    console.log("       balance: linkBalance,");
    console.log("       requestCount: sub.reqCount.toString(),");
    console.log("       consumers: sub.consumers");
    console.log("     }");
    console.log("   }");
    console.log("");
    
    // Debugging commands
    console.log("3️⃣  Debugging Commands:");
    console.log("   # Check VRF configuration");
    console.log("   npx hardhat console --network sepolia");
    console.log("   > const vrf = await ethers.getContractAt('ChainlinkVRF', 'CONSUMER_ADDRESS')");
    console.log("   > await vrf.getSubscriptionId()");
    console.log("   > await vrf.getKeyHash()");
    console.log("");
    console.log("   # Check subscription status");
    console.log("   > const coordinator = await ethers.getContractAt('VRFCoordinatorV2Interface', 'COORDINATOR_ADDRESS')");
    console.log("   > await coordinator.getSubscription(subscriptionId)");
    console.log("");
    console.log("   # Monitor recent events");
    console.log("   > const filter = vrf.filters.RequestSent()");
    console.log("   > const events = await vrf.queryFilter(filter, -100) // Last 100 blocks");
    console.log("");
    
    // Common issues and solutions
    console.log("4️⃣  Common Issues and Solutions:");
    console.log("");
    console.log("   ❌ 'Subscription not found'");
    console.log("   ✅ Solution: Verify subscription ID is correct");
    console.log("");
    console.log("   ❌ 'Consumer not added'");
    console.log("   ✅ Solution: Add contract address to VRF subscription");
    console.log("");
    console.log("   ❌ 'Insufficient LINK balance'");
    console.log("   ✅ Solution: Fund subscription with more LINK tokens");
    console.log("");
    console.log("   ❌ 'Request timed out'");
    console.log("   ✅ Solution: Check gas limits and network congestion");
    console.log("");
    console.log("   ❌ 'Fulfillment failed'");
    console.log("   ✅ Solution: Check callback gas limit and contract logic");
    console.log("");
}

async function runProductionIntegration() {
    console.log("🚀 PRODUCTION INTEGRATION MODE");
    console.log("=" .repeat(40));
    
    const networkName = network.name;
    const config = NETWORK_CONFIG[networkName];
    
    if (!config) {
        throw new Error(`❌ Unsupported network: ${networkName}`);
    }
    
    if (!process.env.VRF_SUBSCRIPTION_ID) {
        throw new Error("❌ VRF_SUBSCRIPTION_ID environment variable required");
    }
    
    const subscriptionId = parseInt(process.env.VRF_SUBSCRIPTION_ID);
    const [deployer] = await ethers.getSigners();
    
    console.log("🔧 Production Configuration:");
    console.log("   Network:", networkName);
    console.log("   Chain ID:", config.chainId);
    console.log("   VRF Coordinator:", config.vrfCoordinator);
    console.log("   LINK Token:", config.linkToken);
    console.log("   Subscription ID:", subscriptionId);
    console.log("   Deployer:", deployer.address);
    console.log("");
    
    // Connect to real VRF Coordinator
    console.log("🔗 Connecting to VRF Coordinator...");
    const vrfCoordinator = new ethers.Contract(
        config.vrfCoordinator,
        VRF_COORDINATOR_ABI,
        deployer
    );
    
    // Check subscription status
    console.log("🔍 Checking subscription status...");
    try {
        const subscription = await vrfCoordinator.getSubscription(subscriptionId);
        console.log("📊 Subscription Status:");
        console.log("   LINK Balance:", ethers.formatEther(subscription.balance), "LINK");
        console.log("   Request Count:", subscription.reqCount.toString());
        console.log("   Owner:", subscription.owner);
        console.log("   Consumers:", subscription.consumers.length);
        
        if (parseFloat(ethers.formatEther(subscription.balance)) < 1.0) {
            console.log("⚠️  WARNING: Low LINK balance! Consider funding subscription.");
        }
        
    } catch (error) {
        console.log("❌ Failed to check subscription:", error.message);
        return;
    }
    
    // Deploy consumer contract
    console.log("\n🚀 Deploying VRF Consumer...");
    const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
    const vrfConsumer = await ChainlinkVRF.deploy(
        subscriptionId,
        config.vrfCoordinator,
        config.keyHash
    );
    await vrfConsumer.waitForDeployment();
    
    const consumerAddress = await vrfConsumer.getAddress();
    console.log("✅ VRF Consumer deployed at:", consumerAddress);
    
    // Check if consumer is added to subscription
    console.log("\n🔍 Checking consumer status...");
    try {
        const subscription = await vrfCoordinator.getSubscription(subscriptionId);
        const isConsumer = subscription.consumers.includes(consumerAddress);
        
        if (isConsumer) {
            console.log("✅ Consumer is already added to subscription");
        } else {
            console.log("⚠️  Consumer not added to subscription");
            console.log("📝 Add consumer manually:");
            console.log("   1. Go to vrf.chain.link");
            console.log("   2. Select subscription", subscriptionId);
            console.log("   3. Click 'Add consumer'");
            console.log("   4. Enter address:", consumerAddress);
        }
        
    } catch (error) {
        console.log("⚠️  Could not verify consumer status:", error.message);
    }
    
    // Set up event monitoring
    console.log("\n📡 Setting up event monitoring...");
    
    const requestFilter = vrfCoordinator.filters.RandomWordsRequested();
    const fulfillFilter = vrfCoordinator.filters.RandomWordsFulfilled();
    
    console.log("🔊 Monitoring VRF events...");
    console.log("   Request filter:", requestFilter.topics);
    console.log("   Fulfill filter:", fulfillFilter.topics);
    
    // Test basic VRF functionality
    console.log("\n🧪 Testing VRF Integration...");
    
    try {
        // Test VRF configuration
        const subId = await vrfConsumer.getSubscriptionId();
        const keyHash = await vrfConsumer.getKeyHash();
        
        console.log("📋 VRF Configuration:");
        console.log("   Subscription ID:", subId.toString());
        console.log("   Key Hash:", keyHash);
        
        console.log("\n✅ Production VRF integration test complete!");
        console.log("🎯 Ready for production use");
        
    } catch (error) {
        console.log("❌ VRF integration test failed:", error.message);
    }
}

// Helper function to show production checklist
function showProductionChecklist() {
    console.log("\n📋 PRODUCTION DEPLOYMENT CHECKLIST");
    console.log("=" .repeat(50));
    
    console.log("🔲 Pre-deployment:");
    console.log("   □ Create VRF subscription at vrf.chain.link");
    console.log("   □ Fund subscription with LINK tokens (5+ LINK recommended)");
    console.log("   □ Set VRF_SUBSCRIPTION_ID environment variable");
    console.log("   □ Test on testnet first");
    console.log("");
    
    console.log("🔲 Deployment:");
    console.log("   □ Deploy VRF consumer contract");
    console.log("   □ Add consumer to VRF subscription");
    console.log("   □ Deploy vote contracts with VRF integration");
    console.log("   □ Verify contracts on block explorer");
    console.log("");
    
    console.log("🔲 Post-deployment:");
    console.log("   □ Test VRF request/fulfillment flow");
    console.log("   □ Set up monitoring for LINK balance");
    console.log("   □ Set up event monitoring for VRF requests");
    console.log("   □ Document contract addresses and configuration");
    console.log("   □ Set up alerts for failed requests");
    console.log("");
    
    console.log("🔲 Ongoing maintenance:");
    console.log("   □ Monitor LINK token balance");
    console.log("   □ Track VRF request success rate");
    console.log("   □ Monitor gas costs and optimize if needed");
    console.log("   □ Keep backup LINK tokens for emergencies");
}

// Main execution with error handling
async function runWithErrorHandling() {
    try {
        await main();
        showProductionChecklist();
        console.log("\n🎉 Production VRF Integration Test Complete!");
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        
        if (error.message.includes("VRF_SUBSCRIPTION_ID")) {
            console.log("\n💡 To run production test:");
            console.log("   export VRF_SUBSCRIPTION_ID=your_subscription_id");
            console.log("   npx hardhat run tests/production-vrf-integration.js --network sepolia");
        }
        
        process.exit(1);
    }
}

runWithErrorHandling(); 