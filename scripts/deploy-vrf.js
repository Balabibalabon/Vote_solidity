// VRF Deployment Script
// Deploys Chainlink VRF integration contracts
// Run with: npx hardhat run scripts/deploy-vrf.js --network <network>

const { ethers } = require("hardhat");
const { network } = require("hardhat");

// VRF Configuration by network
const VRF_CONFIG = {
    localhost: {
        useMock: true,
        subscriptionId: 1,
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        vrfCoordinator: null // Will be deployed
    },
    sepolia: {
        useMock: false,
        subscriptionId: process.env.VRF_SUBSCRIPTION_ID || 0,
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // Sepolia 30 gwei
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625" // Sepolia VRF Coordinator
    },
    mumbai: {
        useMock: false,
        subscriptionId: process.env.VRF_SUBSCRIPTION_ID || 0,
        keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f", // Mumbai 500 gwei
        vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed" // Mumbai VRF Coordinator
    },
    mainnet: {
        useMock: false,
        subscriptionId: process.env.VRF_SUBSCRIPTION_ID || 0,
        keyHash: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef", // Mainnet 200 gwei
        vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909" // Mainnet VRF Coordinator
    }
};

async function main() {
    console.log("🎲 Starting VRF Deployment...\n");
    
    const [deployer] = await ethers.getSigners();
    const networkName = network.name;
    const config = VRF_CONFIG[networkName] || VRF_CONFIG.localhost;
    
    console.log("🌐 Network:", networkName);
    console.log("👤 Deployer:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("🔧 Use Mock VRF:", config.useMock);
    console.log("");
    
    let vrfContract;
    let mockVRFCoordinator = null;
    
    if (config.useMock) {
        console.log("🔧 Deploying Mock VRF System...");
        console.log("=" .repeat(50));
        
        // Deploy Mock VRF Coordinator
        console.log("📦 Deploying MockVRFCoordinator...");
        const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
        mockVRFCoordinator = await MockVRFCoordinator.deploy();
        await mockVRFCoordinator.waitForDeployment();
        console.log("✅ MockVRFCoordinator deployed at:", await mockVRFCoordinator.getAddress());
        
        // Deploy ChainlinkVRF with mock coordinator
        console.log("🎲 Deploying ChainlinkVRF with mock coordinator...");
        const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
        vrfContract = await ChainlinkVRF.deploy(
            config.subscriptionId,
            await mockVRFCoordinator.getAddress(),
            config.keyHash
        );
        await vrfContract.waitForDeployment();
        console.log("✅ ChainlinkVRF deployed at:", await vrfContract.getAddress());
        
        // Also deploy the simple mock integration for comparison
        console.log("🔧 Deploying simple ChainlinkIntegration...");
        const ChainlinkIntegration = await ethers.getContractFactory("ChainlinkIntegration");
        const simpleChainlink = await ChainlinkIntegration.deploy();
        await simpleChainlink.waitForDeployment();
        console.log("✅ ChainlinkIntegration deployed at:", await simpleChainlink.getAddress());
        
    } else {
        console.log("🎯 Deploying Real VRF System...");
        console.log("=" .repeat(50));
        
        // Validate configuration
        if (!config.subscriptionId || config.subscriptionId === 0) {
            throw new Error("❌ VRF_SUBSCRIPTION_ID environment variable is required for real VRF deployment");
        }
        
        console.log("📋 VRF Configuration:");
        console.log("   Subscription ID:", config.subscriptionId);
        console.log("   VRF Coordinator:", config.vrfCoordinator);
        console.log("   Key Hash:", config.keyHash);
        console.log("");
        
        // Deploy ChainlinkVRF with real coordinator
        console.log("🎲 Deploying ChainlinkVRF with real coordinator...");
        const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
        vrfContract = await ChainlinkVRF.deploy(
            config.subscriptionId,
            config.vrfCoordinator,
            config.keyHash
        );
        await vrfContract.waitForDeployment();
        console.log("✅ ChainlinkVRF deployed at:", await vrfContract.getAddress());
        
        console.log("\n⚠️  IMPORTANT: Add this contract as a consumer to your VRF subscription!");
        console.log("🔗 Subscription Management: https://vrf.chain.link/");
    }
    
    // Deploy supporting contracts for testing
    console.log("\n📦 Deploying Supporting Contracts...");
    console.log("=" .repeat(50));
    
    // Deploy TransferableNFT
    console.log("🎫 Deploying TransferableNFT...");
    const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
    const transferableNFT = await TransferableNFT.deploy(
        "VRF Voting NFT",
        "NFT for VRF-powered voting system"
    );
    await transferableNFT.waitForDeployment();
    console.log("✅ TransferableNFT deployed at:", await transferableNFT.getAddress());
    
    // Deploy SoulboundNFT
    console.log("🔒 Deploying SoulboundNFT...");
    const SoulboundNFT = await ethers.getContractFactory("SoulboundNFT");
    const soulboundNFT = await SoulboundNFT.deploy(
        "VRF Soulbound NFT",
        "Permanent VRF voting rights"
    );
    await soulboundNFT.waitForDeployment();
    console.log("✅ SoulboundNFT deployed at:", await soulboundNFT.getAddress());
    
    // Deploy sample Vote contract
    console.log("🗳️  Deploying sample Vote contract...");
    const Vote = await ethers.getContractFactory("Vote");
    const voteContract = await Vote.deploy(
        "VRF Test Vote",
        "Testing VRF integration with voting",
        4, // 4 options
        await transferableNFT.getAddress(),
        await vrfContract.getAddress(),
        24, // 24 hours
        true // Use random winner
    );
    await voteContract.waitForDeployment();
    console.log("✅ Vote contract deployed at:", await voteContract.getAddress());
    
    // Set up NFT contracts
    console.log("\n🔗 Setting up NFT contracts...");
    await transferableNFT.setVoteContract(await voteContract.getAddress());
    await transferableNFT.transferOwnership(await voteContract.getAddress());
    console.log("✅ TransferableNFT configured");
    
    // Deploy VoteFactory
    console.log("🏭 Deploying VoteFactory...");
    const VoteFactory = await ethers.getContractFactory("VoteFactory");
    const voteFactory = await VoteFactory.deploy();
    await voteFactory.waitForDeployment();
    console.log("✅ VoteFactory deployed at:", await voteFactory.getAddress());
    
    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 VRF DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    
    console.log("📋 Deployed Contracts:");
    if (config.useMock && mockVRFCoordinator) {
        console.log("   MockVRFCoordinator:", await mockVRFCoordinator.getAddress());
    }
    console.log("   ChainlinkVRF:", await vrfContract.getAddress());
    console.log("   TransferableNFT:", await transferableNFT.getAddress());
    console.log("   SoulboundNFT:", await soulboundNFT.getAddress());
    console.log("   Vote Contract:", await voteContract.getAddress());
    console.log("   VoteFactory:", await voteFactory.getAddress());
    
    console.log("\n🧪 Testing Commands:");
    console.log("   Run VRF test: node tests/vrf-test.js");
    console.log("   Run NFT test: node tests/nft-test.js");
    
    if (!config.useMock) {
        console.log("\n⚠️  Next Steps for Real VRF:");
        console.log("   1. Add consumer contract to VRF subscription");
        console.log("   2. Fund subscription with LINK tokens");
        console.log("   3. Test on testnet before mainnet");
        console.log("   4. Monitor VRF requests in Chainlink dashboard");
    }
    
    // Save deployment info
    const deploymentInfo = {
        network: networkName,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            mockVRFCoordinator: mockVRFCoordinator ? await mockVRFCoordinator.getAddress() : null,
            chainlinkVRF: await vrfContract.getAddress(),
            transferableNFT: await transferableNFT.getAddress(),
            soulboundNFT: await soulboundNFT.getAddress(),
            voteContract: await voteContract.getAddress(),
            voteFactory: await voteFactory.getAddress()
        },
        config: config
    };
    
    console.log("\n💾 Deployment info saved to deployment-vrf.json");
    require('fs').writeFileSync(
        'deployment-vrf.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main()
    .then(() => {
        console.log("\n✅ VRF deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ VRF deployment failed:", error);
        process.exit(1);
    }); 