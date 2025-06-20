// Simple VRF Deployment Script
// Deploys VRF consumer contract to your chosen network
// Run with: npx hardhat run scripts/simple-vrf-deploy.js --network sepolia

const { ethers } = require("hardhat");

// Network configurations
const NETWORKS = {
    sepolia: {
        name: "Sepolia Testnet",
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        explorer: "https://sepolia.etherscan.io"
    },
    mumbai: {
        name: "Polygon Mumbai",
        vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        explorer: "https://mumbai.polygonscan.com"
    }
};

async function main() {
    console.log("🚀 Simple VRF Consumer Deployment");
    console.log("=" .repeat(50));
    
    const networkName = hre.network.name;
    const config = NETWORKS[networkName];
    
    if (!config) {
        console.log("❌ Unsupported network:", networkName);
        console.log("💡 Supported networks: sepolia, mumbai");
        console.log("💡 Usage: npx hardhat run scripts/simple-vrf-deploy.js --network sepolia");
        return;
    }
    
    console.log("🌐 Network:", config.name);
    console.log("🔗 VRF Coordinator:", config.vrfCoordinator);
    
    // Get signer
    const [deployer] = await ethers.getSigners();
    let deployerAddress;
    
    try {
        // Try different ways to get address (compatibility with different ethers versions)
        deployerAddress = deployer.address || await deployer.getAddress();
    } catch (error) {
        console.log("❌ Could not get deployer address:", error.message);
        console.log("💡 Make sure you have PRIVATE_KEY set in your environment");
        return;
    }
    
    console.log("👤 Deployer:", deployerAddress);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployerAddress);
    console.log("💰 ETH Balance:", ethers.formatEther(balance));
    
    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
        console.log("❌ Insufficient ETH balance for deployment");
        console.log("💡 Get testnet ETH from a faucet");
        return;
    }
    
    // Get subscription ID from user
    console.log("\n📋 VRF Subscription Setup");
    console.log("From your VRF dashboard, I can see you have these subscriptions:");
    console.log("• Subscription ID: 110773...7948");
    console.log("• Subscription ID: 667202...6590");
    console.log("");
    
    // For this example, let's use the first subscription ID
    // In a real scenario, you'd input this or pass as parameter
    const subscriptionId = 1107737948; // Using the first subscription ID (shortened)
    
    console.log("📝 Using Subscription ID:", subscriptionId);
    console.log("⚠️  Make sure this subscription is funded with LINK tokens!");
    console.log("");
    
    // Deploy VRF Consumer
    console.log("🚀 Deploying ChainlinkVRF consumer contract...");
    
    try {
        const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
        const vrfConsumer = await ChainlinkVRF.deploy(
            subscriptionId,
            config.vrfCoordinator,
            config.keyHash
        );
        
        console.log("⏳ Waiting for deployment...");
        await vrfConsumer.waitForDeployment();
        
        const contractAddress = await vrfConsumer.getAddress();
        
        console.log("\n✅ VRF Consumer deployed successfully!");
        console.log("📝 Contract Address:", contractAddress);
        console.log("🔗 View on Explorer:", `${config.explorer}/address/${contractAddress}`);
        
        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const deployedSubId = await vrfConsumer.getSubscriptionId();
        const deployedKeyHash = await vrfConsumer.getKeyHash();
        
        console.log("✅ Subscription ID:", deployedSubId.toString());
        console.log("✅ Key Hash:", deployedKeyHash);
        
        // Next steps
        console.log("\n📋 Next Steps:");
        console.log("1. 🪙 Fund your subscription with LINK tokens");
        console.log("   • Go to: https://vrf.chain.link/");
        console.log("   • Select subscription:", subscriptionId);
        console.log("   • Click 'Fund subscription'");
        console.log("   • Add 5-10 LINK tokens");
        console.log("");
        console.log("2. ➕ Add consumer to subscription");
        console.log("   • In VRF dashboard, click 'Add consumer'");
        console.log("   • Enter contract address:", contractAddress);
        console.log("   • Confirm transaction");
        console.log("");
        console.log("3. 🧪 Test VRF request");
        console.log("   • Use Hardhat console:");
        console.log("   • npx hardhat console --network", networkName);
        console.log("   • const vrf = await ethers.getContractAt('ChainlinkVRF', '" + contractAddress + "')");
        console.log("   • await vrf.requestRandomWords()");
        
        // Save deployment info
        const deploymentInfo = {
            network: config.name,
            contractAddress: contractAddress,
            subscriptionId: subscriptionId,
            vrfCoordinator: config.vrfCoordinator,
            keyHash: config.keyHash,
            deployer: deployerAddress,
            deployedAt: new Date().toISOString(),
            explorerUrl: `${config.explorer}/address/${contractAddress}`
        };
        
        console.log("\n💾 Deployment Summary:");
        console.log(JSON.stringify(deploymentInfo, null, 2));
        
    } catch (error) {
        console.log("❌ Deployment failed:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Need more ETH for gas fees");
        } else if (error.message.includes("nonce")) {
            console.log("💡 Try again in a few seconds");
        }
    }
}

// Error handling
main()
    .then(() => {
        console.log("\n🎉 Deployment script completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Script failed:", error.message);
        process.exit(1);
    }); 