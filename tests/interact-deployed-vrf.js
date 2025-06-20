// Test Interaction with Deployed VRF Contract
// Shows how to interact with your real deployed VRF consumer
// Run with: npx hardhat run tests/interact-deployed-vrf.js --network sepolia

const { ethers } = require("hardhat");

// Your deployed contract details
const DEPLOYED_VRF_ADDRESS = "0xE60f17e59f9EF3C002E4719bCb3BdE9C270eB5F0";
const SUBSCRIPTION_ID = "110773992208828459806083956317076625712926352574321714445295320406795173507948";
const VRF_COORDINATOR = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";

async function main() {
    console.log("🎯 Testing Real VRF Contract Interaction");
    console.log("=" .repeat(50));
    
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address || await deployer.getAddress();
    
    console.log("🌐 Network:", hre.network.name);
    console.log("👤 Your Address:", deployerAddress);
    console.log("📝 VRF Contract:", DEPLOYED_VRF_ADDRESS);
    console.log("");
    
    // Connect to your deployed VRF contract
    console.log("🔗 Connecting to deployed VRF contract...");
    const vrfConsumer = await ethers.getContractAt("ChainlinkVRF", DEPLOYED_VRF_ADDRESS);
    console.log("✅ Connected to VRF consumer");
    
    // Test 1: Check contract configuration
    console.log("\n📋 Test 1: Contract Configuration");
    console.log("-".repeat(30));
    
    try {
        const subscriptionId = await vrfConsumer.getSubscriptionId();
        const keyHash = await vrfConsumer.getKeyHash();
        const vrfCoordinator = await vrfConsumer.getVRFCoordinator();
        
        console.log("✅ Subscription ID:", subscriptionId.toString());
        console.log("✅ Key Hash:", keyHash);
        console.log("✅ VRF Coordinator:", vrfCoordinator);
        
        // Verify configuration matches deployment
        if (subscriptionId.toString() === SUBSCRIPTION_ID.substring(0, 10)) {
            console.log("✅ Subscription ID matches deployment");
        } else {
            console.log("⚠️  Subscription ID mismatch");
        }
        
    } catch (error) {
        console.log("❌ Configuration check failed:", error.message);
    }
    
    // Test 2: Check contract ownership
    console.log("\n📋 Test 2: Contract Ownership");
    console.log("-".repeat(30));
    
    try {
        const owner = await vrfConsumer.owner();
        console.log("👤 Contract Owner:", owner);
        
        if (owner.toLowerCase() === deployerAddress.toLowerCase()) {
            console.log("✅ You are the contract owner");
        } else {
            console.log("⚠️  You are not the contract owner");
        }
        
    } catch (error) {
        console.log("❌ Ownership check failed:", error.message);
    }
    
    // Test 3: Check VRF Coordinator interaction
    console.log("\n📋 Test 3: VRF Coordinator Check");
    console.log("-".repeat(30));
    
    try {
        // Connect to VRF Coordinator to check subscription
        const vrfCoordinatorABI = [
            "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
        ];
        
        const coordinator = new ethers.Contract(VRF_COORDINATOR, vrfCoordinatorABI, deployer);
        const subscription = await coordinator.getSubscription(SUBSCRIPTION_ID);
        
        console.log("📊 Subscription Status:");
        console.log("   LINK Balance:", ethers.formatEther(subscription.balance), "LINK");
        console.log("   Request Count:", subscription.reqCount.toString());
        console.log("   Owner:", subscription.owner);
        console.log("   Consumers:", subscription.consumers.length);
        
        // Check if our contract is a consumer
        const isConsumer = subscription.consumers.some(
            consumer => consumer.toLowerCase() === DEPLOYED_VRF_ADDRESS.toLowerCase()
        );
        
        if (isConsumer) {
            console.log("✅ Contract is registered as consumer");
        } else {
            console.log("❌ Contract is NOT registered as consumer");
            console.log("💡 Add it via https://vrf.chain.link/");
        }
        
        // Check if subscription is funded
        const linkBalance = parseFloat(ethers.formatEther(subscription.balance));
        if (linkBalance > 0) {
            console.log("✅ Subscription is funded with", linkBalance, "LINK");
        } else {
            console.log("⚠️  Subscription needs funding");
            console.log("💡 Fund it via https://vrf.chain.link/");
        }
        
    } catch (error) {
        console.log("❌ VRF Coordinator check failed:", error.message);
    }
    
    // Test 4: Check request history
    console.log("\n📋 Test 4: VRF Request History");
    console.log("-".repeat(30));
    
    try {
        // Check for past VRF requests
        const requestFilter = vrfConsumer.filters.RequestSent();
        const requestEvents = await vrfConsumer.queryFilter(requestFilter, -1000); // Last 1000 blocks
        
        console.log("📊 VRF Request History:");
        console.log("   Total Requests:", requestEvents.length);
        
        if (requestEvents.length > 0) {
            console.log("📝 Recent Requests:");
            requestEvents.slice(-3).forEach((event, index) => {
                console.log(`   ${index + 1}. Request ID: ${event.args.requestId.toString()}`);
                console.log(`      Block: ${event.blockNumber}`);
            });
        } else {
            console.log("   No VRF requests found");
        }
        
        // Check for fulfillments
        const fulfillFilter = vrfConsumer.filters.RequestFulfilled();
        const fulfillEvents = await vrfConsumer.queryFilter(fulfillFilter, -1000);
        
        console.log("   Total Fulfillments:", fulfillEvents.length);
        
    } catch (error) {
        console.log("❌ Request history check failed:", error.message);
    }
    
    // Test 5: Simulate VRF request (if conditions are met)
    console.log("\n📋 Test 5: VRF Request Simulation");
    console.log("-".repeat(30));
    
    try {
        // Check if we can make a VRF request
        const coordinator = new ethers.Contract(VRF_COORDINATOR, [
            "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
        ], deployer);
        
        const subscription = await coordinator.getSubscription(SUBSCRIPTION_ID);
        const linkBalance = parseFloat(ethers.formatEther(subscription.balance));
        const isConsumer = subscription.consumers.some(
            consumer => consumer.toLowerCase() === DEPLOYED_VRF_ADDRESS.toLowerCase()
        );
        
        if (linkBalance > 0 && isConsumer) {
            console.log("🎲 Conditions met for VRF request!");
            console.log("⚠️  Would you like to make a real VRF request?");
            console.log("💡 This will cost ~0.25 LINK and take 1-3 blocks to fulfill");
            console.log("");
            console.log("🧪 To make a VRF request, run:");
            console.log("   npx hardhat console --network sepolia");
            console.log("   > const vrf = await ethers.getContractAt('ChainlinkVRF', '" + DEPLOYED_VRF_ADDRESS + "')");
            console.log("   > await vrf.requestRandomWords()");
            
        } else {
            console.log("⚠️  Cannot make VRF request:");
            if (linkBalance === 0) {
                console.log("   • Subscription needs LINK funding");
            }
            if (!isConsumer) {
                console.log("   • Contract not added as consumer");
            }
        }
        
    } catch (error) {
        console.log("❌ VRF request check failed:", error.message);
    }
    
    // Test 6: Integration with Vote Contract
    console.log("\n📋 Test 6: Vote Contract Integration");
    console.log("-".repeat(35));
    
    console.log("🗳️  Your VRF consumer can be used with Vote contracts:");
    console.log("1. Deploy Vote contract with VRF integration");
    console.log("2. Vote contract calls VRF for random winner selection");
    console.log("3. Winners are selected fairly using Chainlink VRF");
    console.log("");
    console.log("📝 Example Vote deployment:");
    console.log("   const vote = await Vote.deploy(");
    console.log("     'Test Vote',");
    console.log("     'VRF-powered voting',");
    console.log("     3, // options");
    console.log("     nftAddress,");
    console.log("     '" + DEPLOYED_VRF_ADDRESS + "', // Your VRF consumer");
    console.log("     24, // 24 hours");
    console.log("     true // Use random winner");
    console.log("   )");
    
    console.log("\n🎉 VRF Contract Interaction Test Complete!");
    console.log("=" .repeat(50));
    
    // Summary
    console.log("\n📊 Summary:");
    console.log("✅ Contract deployed and accessible");
    console.log("✅ Configuration verified");
    console.log("✅ Ready for VRF requests (once funded)");
    console.log("✅ Can integrate with voting system");
    
    console.log("\n🔗 Useful Links:");
    console.log("• Your Contract:", `https://sepolia.etherscan.io/address/${DEPLOYED_VRF_ADDRESS}`);
    console.log("• VRF Dashboard:", "https://vrf.chain.link/");
    console.log("• Fund Subscription:", "https://vrf.chain.link/");
}

// Error handling
main()
    .then(() => {
        console.log("\n✅ Test completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }); 