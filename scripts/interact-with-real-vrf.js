// Interactive Script for Real Chainlink VRF
// Step-by-step guide to interact with production Chainlink VRF
// Run with: npx hardhat run scripts/interact-with-real-vrf.js --network sepolia

const { ethers } = require("hardhat");
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to prompt user
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

// Real VRF Coordinator ABI
const VRF_COORDINATOR_ABI = [
    "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)",
    "function addConsumer(uint64 subId, address consumer) external",
    "function removeConsumer(uint64 subId, address consumer) external",
    "event RandomWordsRequested(bytes32 indexed keyHash, uint256 requestId, uint256 indexed subId, uint16 minimumRequestConfirmations, uint32 callbackGasLimit, uint32 numWords, address indexed sender)",
    "event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success)"
];

// LINK Token ABI
const LINK_TOKEN_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)"
];

// Network configurations
const NETWORKS = {
    sepolia: {
        name: "Sepolia Testnet",
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        gasLane: "30 gwei",
        chainId: 11155111,
        explorer: "https://sepolia.etherscan.io",
        faucet: "https://faucets.chain.link/sepolia"
    },
    mumbai: {
        name: "Polygon Mumbai",
        vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        gasLane: "500 gwei",
        chainId: 80001,
        explorer: "https://mumbai.polygonscan.com",
        faucet: "https://faucets.chain.link/mumbai"
    }
};

async function main() {
    console.log("🎯 Interactive Real Chainlink VRF Setup");
    console.log("=" .repeat(50));
    
    const network = hre.network.name;
    const config = NETWORKS[network];
    
    if (!config) {
        console.log("❌ Unsupported network:", network);
        console.log("💡 Supported networks: sepolia, mumbai");
        process.exit(1);
    }
    
    console.log("🌐 Network:", config.name);
    console.log("🔗 VRF Coordinator:", config.vrfCoordinator);
    console.log("🪙 LINK Token:", config.linkToken);
    console.log("");
    
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("👤 Your address:", deployerAddress);
    console.log("💰 ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(deployerAddress)));
    
    // Check LINK balance
    await checkLINKBalance(deployerAddress, config);
    
    console.log("\n📋 What would you like to do?");
    console.log("1. Check VRF subscription status");
    console.log("2. Deploy VRF consumer contract");
    console.log("3. Add consumer to subscription");
    console.log("4. Test VRF request");
    console.log("5. Monitor VRF events");
    console.log("6. Full setup walkthrough");
    console.log("7. Exit");
    
    const choice = await prompt("\nEnter your choice (1-7): ");
    
    switch(choice) {
        case "1":
            await checkSubscription(config);
            break;
        case "2":
            await deployVRFConsumer(config);
            break;
        case "3":
            await addConsumerToSubscription(config);
            break;
        case "4":
            await testVRFRequest(config);
            break;
        case "5":
            await monitorVRFEvents(config);
            break;
        case "6":
            await fullSetupWalkthrough(config);
            break;
        case "7":
            console.log("👋 Goodbye!");
            break;
        default:
            console.log("❌ Invalid choice");
    }
    
    rl.close();
}

async function checkLINKBalance(address, config) {
    try {
        const linkToken = new ethers.Contract(config.linkToken, LINK_TOKEN_ABI, ethers.provider);
        const balance = await linkToken.balanceOf(address);
        const formattedBalance = ethers.formatEther(balance);
        
        console.log("🪙 LINK Balance:", formattedBalance, "LINK");
        
        if (parseFloat(formattedBalance) < 1.0) {
            console.log("⚠️  Low LINK balance! Get testnet LINK from:", config.faucet);
        }
    } catch (error) {
        console.log("⚠️  Could not check LINK balance:", error.message);
    }
}

async function checkSubscription(config) {
    console.log("\n🔍 Checking VRF Subscription");
    console.log("-".repeat(30));
    
    const subscriptionId = await prompt("Enter your VRF subscription ID: ");
    
    if (!subscriptionId || subscriptionId === "") {
        console.log("❌ No subscription ID provided");
        console.log("💡 Create one at: https://vrf.chain.link/");
        return;
    }
    
    try {
        const [deployer] = await ethers.getSigners();
        const vrfCoordinator = new ethers.Contract(config.vrfCoordinator, VRF_COORDINATOR_ABI, deployer);
        
        console.log("🔗 Connecting to VRF Coordinator...");
        const subscription = await vrfCoordinator.getSubscription(parseInt(subscriptionId));
        
        console.log("\n📊 Subscription Details:");
        console.log("   ID:", subscriptionId);
        console.log("   LINK Balance:", ethers.formatEther(subscription.balance), "LINK");
        console.log("   Request Count:", subscription.reqCount.toString());
        console.log("   Owner:", subscription.owner);
        console.log("   Consumers:", subscription.consumers.length);
        
        if (subscription.consumers.length > 0) {
            console.log("\n📋 Consumer Contracts:");
            subscription.consumers.forEach((consumer, index) => {
                console.log(`   ${index + 1}. ${consumer}`);
            });
        }
        
        // Check balance warnings
        const linkBalance = parseFloat(ethers.formatEther(subscription.balance));
        if (linkBalance < 1.0) {
            console.log("\n⚠️  WARNING: Low LINK balance!");
            console.log("💡 Fund your subscription at: https://vrf.chain.link/");
        } else if (linkBalance < 5.0) {
            console.log("\n💡 Consider adding more LINK for multiple requests");
        } else {
            console.log("\n✅ Subscription looks good!");
        }
        
    } catch (error) {
        console.log("❌ Failed to check subscription:", error.message);
        
        if (error.message.includes("revert")) {
            console.log("💡 Possible issues:");
            console.log("   • Subscription ID doesn't exist");
            console.log("   • Wrong network");
            console.log("   • Create subscription at: https://vrf.chain.link/");
        }
    }
}

async function deployVRFConsumer(config) {
    console.log("\n🚀 Deploying VRF Consumer Contract");
    console.log("-".repeat(40));
    
    const subscriptionId = await prompt("Enter your VRF subscription ID: ");
    
    if (!subscriptionId || subscriptionId === "") {
        console.log("❌ Subscription ID required");
        return;
    }
    
    try {
        console.log("📦 Deploying ChainlinkVRF contract...");
        console.log("   Subscription ID:", subscriptionId);
        console.log("   VRF Coordinator:", config.vrfCoordinator);
        console.log("   Key Hash:", config.keyHash);
        console.log("   Gas Lane:", config.gasLane);
        
        const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
        const vrfConsumer = await ChainlinkVRF.deploy(
            parseInt(subscriptionId),
            config.vrfCoordinator,
            config.keyHash
        );
        
        console.log("⏳ Waiting for deployment...");
        await vrfConsumer.waitForDeployment();
        
        const contractAddress = await vrfConsumer.getAddress();
        console.log("\n✅ VRF Consumer deployed successfully!");
        console.log("📝 Contract Address:", contractAddress);
        console.log("🔗 View on Explorer:", `${config.explorer}/address/${contractAddress}`);
        
        console.log("\n📋 Next Steps:");
        console.log("1. Add this contract as a consumer to your VRF subscription");
        console.log("2. Go to: https://vrf.chain.link/");
        console.log("3. Select your subscription");
        console.log("4. Click 'Add consumer'");
        console.log("5. Enter contract address:", contractAddress);
        
        // Save deployment info
        const deploymentInfo = {
            network: config.name,
            contractAddress: contractAddress,
            subscriptionId: subscriptionId,
            vrfCoordinator: config.vrfCoordinator,
            keyHash: config.keyHash,
            deployedAt: new Date().toISOString()
        };
        
        console.log("\n💾 Deployment Info:");
        console.log(JSON.stringify(deploymentInfo, null, 2));
        
    } catch (error) {
        console.log("❌ Deployment failed:", error.message);
    }
}

async function addConsumerToSubscription(config) {
    console.log("\n➕ Adding Consumer to VRF Subscription");
    console.log("-".repeat(40));
    
    const subscriptionId = await prompt("Enter your VRF subscription ID: ");
    const consumerAddress = await prompt("Enter consumer contract address: ");
    
    if (!subscriptionId || !consumerAddress) {
        console.log("❌ Both subscription ID and consumer address required");
        return;
    }
    
    try {
        const [deployer] = await ethers.getSigners();
        const vrfCoordinator = new ethers.Contract(config.vrfCoordinator, VRF_COORDINATOR_ABI, deployer);
        
        // First check if we're the subscription owner
        console.log("🔍 Checking subscription ownership...");
        const subscription = await vrfCoordinator.getSubscription(parseInt(subscriptionId));
        
        const deployerAddress = await deployer.getAddress();
        if (subscription.owner.toLowerCase() !== deployerAddress.toLowerCase()) {
            console.log("❌ You are not the owner of this subscription");
            console.log("👤 Subscription owner:", subscription.owner);
            console.log("👤 Your address:", deployerAddress);
            console.log("💡 Use the VRF UI instead: https://vrf.chain.link/");
            return;
        }
        
        // Check if consumer is already added
        const isAlreadyConsumer = subscription.consumers.some(
            consumer => consumer.toLowerCase() === consumerAddress.toLowerCase()
        );
        
        if (isAlreadyConsumer) {
            console.log("✅ Consumer is already added to subscription");
            return;
        }
        
        console.log("➕ Adding consumer to subscription...");
        const tx = await vrfCoordinator.addConsumer(parseInt(subscriptionId), consumerAddress);
        
        console.log("⏳ Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Consumer added successfully!");
        console.log("🔗 Transaction:", `${config.explorer}/tx/${receipt.hash}`);
        
    } catch (error) {
        console.log("❌ Failed to add consumer:", error.message);
        
        if (error.message.includes("OnlySubOwner")) {
            console.log("💡 You must be the subscription owner to add consumers");
            console.log("💡 Use the VRF UI instead: https://vrf.chain.link/");
        }
    }
}

async function testVRFRequest(config) {
    console.log("\n🎲 Testing VRF Request");
    console.log("-".repeat(25));
    
    const contractAddress = await prompt("Enter your VRF consumer contract address: ");
    
    if (!contractAddress) {
        console.log("❌ Contract address required");
        return;
    }
    
    try {
        const [deployer] = await ethers.getSigners();
        const vrfConsumer = await ethers.getContractAt("ChainlinkVRF", contractAddress, deployer);
        
        console.log("🔍 Checking contract configuration...");
        const subscriptionId = await vrfConsumer.getSubscriptionId();
        const keyHash = await vrfConsumer.getKeyHash();
        
        console.log("📋 Contract Configuration:");
        console.log("   Address:", contractAddress);
        console.log("   Subscription ID:", subscriptionId.toString());
        console.log("   Key Hash:", keyHash);
        
        // Check if contract is added as consumer
        const vrfCoordinator = new ethers.Contract(config.vrfCoordinator, VRF_COORDINATOR_ABI, deployer);
        const subscription = await vrfCoordinator.getSubscription(subscriptionId);
        
        const isConsumer = subscription.consumers.some(
            consumer => consumer.toLowerCase() === contractAddress.toLowerCase()
        );
        
        if (!isConsumer) {
            console.log("❌ Contract is not added as a consumer to the subscription");
            console.log("💡 Add it first using option 3 or via https://vrf.chain.link/");
            return;
        }
        
        console.log("✅ Contract is properly configured as consumer");
        
        // Request random words
        console.log("\n🎯 Requesting random words...");
        const tx = await vrfConsumer.requestRandomWords();
        
        console.log("⏳ Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ VRF request submitted successfully!");
        console.log("🔗 Transaction:", `${config.explorer}/tx/${receipt.hash}`);
        
        // Extract request ID from events
        const requestSentEvent = receipt.logs.find(log => {
            try {
                const parsed = vrfConsumer.interface.parseLog(log);
                return parsed.name === 'RequestSent';
            } catch {
                return false;
            }
        });
        
        if (requestSentEvent) {
            const parsed = vrfConsumer.interface.parseLog(requestSentEvent);
            console.log("🎫 Request ID:", parsed.args.requestId.toString());
        }
        
        console.log("\n⏳ VRF Fulfillment Process:");
        console.log("1. ✅ Request sent to Chainlink VRF");
        console.log("2. ⏳ Chainlink node processing...");
        console.log("3. ⏳ Waiting for random number generation...");
        console.log("4. ⏳ Fulfillment transaction pending...");
        console.log("\n💡 This usually takes 1-3 blocks (30-90 seconds)");
        console.log("🔍 Monitor at: https://vrf.chain.link/");
        
        // Ask if user wants to wait and check for fulfillment
        const waitForFulfillment = await prompt("\nWait and check for fulfillment? (y/n): ");
        
        if (waitForFulfillment.toLowerCase() === 'y') {
            await waitForVRFFulfillment(vrfConsumer, config);
        }
        
    } catch (error) {
        console.log("❌ VRF request failed:", error.message);
        
        if (error.message.includes("InsufficientBalance")) {
            console.log("💡 Subscription needs more LINK tokens");
        } else if (error.message.includes("InvalidConsumer")) {
            console.log("💡 Contract not added as consumer to subscription");
        }
    }
}

async function waitForVRFFulfillment(vrfConsumer, config) {
    console.log("\n⏳ Waiting for VRF fulfillment...");
    
    const maxWaitTime = 300; // 5 minutes
    const checkInterval = 10; // 10 seconds
    let elapsed = 0;
    
    while (elapsed < maxWaitTime) {
        try {
            // Check if we have any fulfilled requests
            const filter = vrfConsumer.filters.RequestFulfilled();
            const events = await vrfConsumer.queryFilter(filter, -10); // Last 10 blocks
            
            if (events.length > 0) {
                const latestEvent = events[events.length - 1];
                console.log("✅ VRF request fulfilled!");
                console.log("🎲 Random words received");
                console.log("🔗 Fulfillment tx:", `${config.explorer}/tx/${latestEvent.transactionHash}`);
                return;
            }
            
            process.stdout.write(`\r⏳ Waiting... ${elapsed}s elapsed`);
            await new Promise(resolve => setTimeout(resolve, checkInterval * 1000));
            elapsed += checkInterval;
            
        } catch (error) {
            console.log("\n⚠️  Error checking fulfillment:", error.message);
            break;
        }
    }
    
    console.log("\n⏰ Timeout reached. VRF fulfillment may still be pending.");
    console.log("🔍 Check manually at: https://vrf.chain.link/");
}

async function monitorVRFEvents(config) {
    console.log("\n📡 Monitoring VRF Events");
    console.log("-".repeat(25));
    
    const contractAddress = await prompt("Enter VRF consumer contract address (or press Enter for coordinator events): ");
    
    try {
        const [deployer] = await ethers.getSigners();
        
        if (contractAddress && contractAddress !== "") {
            // Monitor specific consumer contract
            console.log("🔍 Monitoring consumer contract:", contractAddress);
            const vrfConsumer = await ethers.getContractAt("ChainlinkVRF", contractAddress, deployer);
            
            console.log("📡 Setting up event listeners...");
            
            vrfConsumer.on("RequestSent", (requestId, numWords) => {
                console.log(`\n🎯 VRF Request Sent:`);
                console.log(`   Request ID: ${requestId.toString()}`);
                console.log(`   Words Requested: ${numWords}`);
                console.log(`   Time: ${new Date().toLocaleString()}`);
            });
            
            vrfConsumer.on("RequestFulfilled", (requestId, randomWords) => {
                console.log(`\n✅ VRF Request Fulfilled:`);
                console.log(`   Request ID: ${requestId.toString()}`);
                console.log(`   Random Words: ${randomWords.map(w => w.toString()).join(', ')}`);
                console.log(`   Time: ${new Date().toLocaleString()}`);
            });
            
        } else {
            // Monitor VRF Coordinator
            console.log("🔍 Monitoring VRF Coordinator:", config.vrfCoordinator);
            const vrfCoordinator = new ethers.Contract(config.vrfCoordinator, VRF_COORDINATOR_ABI, deployer);
            
            console.log("📡 Setting up coordinator event listeners...");
            
            vrfCoordinator.on("RandomWordsRequested", (keyHash, requestId, subId, confirmations, gasLimit, numWords, sender) => {
                console.log(`\n🎯 VRF Request (Coordinator):`);
                console.log(`   Request ID: ${requestId.toString()}`);
                console.log(`   Subscription: ${subId.toString()}`);
                console.log(`   Sender: ${sender}`);
                console.log(`   Time: ${new Date().toLocaleString()}`);
            });
            
            vrfCoordinator.on("RandomWordsFulfilled", (requestId, outputSeed, payment, success) => {
                console.log(`\n✅ VRF Fulfilled (Coordinator):`);
                console.log(`   Request ID: ${requestId.toString()}`);
                console.log(`   Payment: ${ethers.formatEther(payment)} LINK`);
                console.log(`   Success: ${success}`);
                console.log(`   Time: ${new Date().toLocaleString()}`);
            });
        }
        
        console.log("✅ Event monitoring started");
        console.log("⏳ Listening for VRF events... (Press Ctrl+C to stop)");
        
        // Keep the script running
        await new Promise(() => {}); // Run indefinitely
        
    } catch (error) {
        console.log("❌ Failed to set up monitoring:", error.message);
    }
}

async function fullSetupWalkthrough(config) {
    console.log("\n🎯 Full VRF Setup Walkthrough");
    console.log("=" .repeat(40));
    
    console.log("This will guide you through the complete VRF setup process.\n");
    
    // Step 1: Prerequisites check
    console.log("📋 Step 1: Prerequisites Check");
    console.log("-".repeat(30));
    
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const ethBalance = await ethers.provider.getBalance(deployerAddress);
    
    console.log("✅ Network:", config.name);
    console.log("✅ Your address:", deployerAddress);
    console.log("💰 ETH balance:", ethers.formatEther(ethBalance));
    
    await checkLINKBalance(deployerAddress, config);
    
    if (parseFloat(ethers.formatEther(ethBalance)) < 0.01) {
        console.log("❌ Insufficient ETH for transactions");
        console.log("💡 Get testnet ETH from a faucet");
        return;
    }
    
    // Step 2: Subscription setup
    console.log("\n📋 Step 2: VRF Subscription Setup");
    console.log("-".repeat(35));
    
    console.log("🔗 Go to: https://vrf.chain.link/");
    console.log("1. Connect your wallet");
    console.log("2. Select network:", config.name);
    console.log("3. Click 'Create Subscription'");
    console.log("4. Fund with LINK tokens (minimum 5 LINK recommended)");
    
    const subscriptionId = await prompt("\nEnter your subscription ID: ");
    
    if (!subscriptionId) {
        console.log("❌ Subscription ID required to continue");
        return;
    }
    
    // Verify subscription
    try {
        const vrfCoordinator = new ethers.Contract(config.vrfCoordinator, VRF_COORDINATOR_ABI, deployer);
        const subscription = await vrfCoordinator.getSubscription(parseInt(subscriptionId));
        console.log("✅ Subscription verified");
        console.log("💰 LINK balance:", ethers.formatEther(subscription.balance), "LINK");
    } catch (error) {
        console.log("❌ Could not verify subscription:", error.message);
        return;
    }
    
    // Step 3: Deploy consumer contract
    console.log("\n📋 Step 3: Deploy VRF Consumer");
    console.log("-".repeat(30));
    
    const deployConsumer = await prompt("Deploy new VRF consumer contract? (y/n): ");
    
    let consumerAddress;
    if (deployConsumer.toLowerCase() === 'y') {
        try {
            console.log("🚀 Deploying VRF consumer...");
            const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
            const vrfConsumer = await ChainlinkVRF.deploy(
                parseInt(subscriptionId),
                config.vrfCoordinator,
                config.keyHash
            );
            await vrfConsumer.waitForDeployment();
            consumerAddress = await vrfConsumer.getAddress();
            console.log("✅ Consumer deployed at:", consumerAddress);
        } catch (error) {
            console.log("❌ Deployment failed:", error.message);
            return;
        }
    } else {
        consumerAddress = await prompt("Enter existing consumer contract address: ");
    }
    
    // Step 4: Add consumer to subscription
    console.log("\n📋 Step 4: Add Consumer to Subscription");
    console.log("-".repeat(40));
    
    console.log("🔗 Go to: https://vrf.chain.link/");
    console.log("1. Select your subscription");
    console.log("2. Click 'Add consumer'");
    console.log("3. Enter contract address:", consumerAddress);
    console.log("4. Confirm transaction");
    
    await prompt("\nPress Enter when consumer is added...");
    
    // Step 5: Test VRF request
    console.log("\n📋 Step 5: Test VRF Request");
    console.log("-".repeat(25));
    
    const testRequest = await prompt("Test VRF request now? (y/n): ");
    
    if (testRequest.toLowerCase() === 'y') {
        try {
            const vrfConsumer = await ethers.getContractAt("ChainlinkVRF", consumerAddress, deployer);
            
            console.log("🎲 Sending VRF request...");
            const tx = await vrfConsumer.requestRandomWords();
            await tx.wait();
            
            console.log("✅ VRF request sent successfully!");
            console.log("⏳ Waiting for fulfillment...");
            
            await waitForVRFFulfillment(vrfConsumer, config);
            
        } catch (error) {
            console.log("❌ VRF request failed:", error.message);
        }
    }
    
    // Step 6: Summary
    console.log("\n🎉 Setup Complete!");
    console.log("=" .repeat(20));
    
    console.log("📝 Summary:");
    console.log("   Network:", config.name);
    console.log("   Subscription ID:", subscriptionId);
    console.log("   Consumer Contract:", consumerAddress);
    console.log("   VRF Coordinator:", config.vrfCoordinator);
    
    console.log("\n🔗 Useful Links:");
    console.log("   VRF Management:", "https://vrf.chain.link/");
    console.log("   Block Explorer:", config.explorer);
    console.log("   LINK Faucet:", config.faucet);
    
    console.log("\n💡 Next Steps:");
    console.log("   • Monitor your subscription balance");
    console.log("   • Set up automated monitoring");
    console.log("   • Integrate VRF into your voting contracts");
    console.log("   • Test on mainnet when ready");
}

// Error handling wrapper
main()
    .then(() => {
        console.log("\n✅ Script completed successfully!");
    })
    .catch((error) => {
        console.error("\n❌ Script failed:", error.message);
        process.exit(1);
    }); 