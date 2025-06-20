// Test VRF Request with Deployed Contract
// Tests the actual VRF request functionality
// Run with: npx hardhat run tests/test-deployed-vrf-request.js --network sepolia

const { ethers } = require("hardhat");

const DEPLOYED_VRF_ADDRESS = "0xE60f17e59f9EF3C002E4719bCb3BdE9C270eB5F0";

async function main() {
    console.log("🎲 Testing VRF Request with Deployed Contract");
    console.log("=" .repeat(50));
    
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address || await deployer.getAddress();
    
    console.log("🌐 Network:", hre.network.name);
    console.log("👤 Deployer:", deployerAddress);
    console.log("📝 VRF Contract:", DEPLOYED_VRF_ADDRESS);
    console.log("");
    
    // Connect to deployed VRF contract
    console.log("🔗 Connecting to VRF contract...");
    const vrfConsumer = await ethers.getContractAt("ChainlinkVRF", DEPLOYED_VRF_ADDRESS);
    console.log("✅ Connected to VRF consumer");
    
    // Step 1: Deploy supporting contracts for testing
    console.log("\n📋 Step 1: Deploy Test Vote System");
    console.log("-".repeat(40));
    
    try {
        // Deploy NFT contract
        console.log("🎫 Deploying NFT contract...");
        const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
        const nftContract = await TransferableNFT.deploy(
            "Test Voting NFT",
            "VRF test voting rights"
        );
        await nftContract.waitForDeployment();
        const nftAddress = await nftContract.getAddress();
        console.log("✅ NFT deployed at:", nftAddress);
        
        // Deploy Vote contract
        console.log("🗳️  Deploying Vote contract...");
        const Vote = await ethers.getContractFactory("Vote");
        const voteContract = await Vote.deploy(
            "VRF Test Vote",
            "Testing VRF random winner selection",
            3, // 3 options
            nftAddress,
            DEPLOYED_VRF_ADDRESS,
            1, // 1 hour
            true // Use random winner
        );
        await voteContract.waitForDeployment();
        const voteAddress = await voteContract.getAddress();
        console.log("✅ Vote deployed at:", voteAddress);
        
        // Configure contracts
        console.log("🔧 Configuring contracts...");
        await nftContract.setVoteContract(voteAddress);
        await nftContract.transferOwnership(voteAddress);
        console.log("✅ Contracts configured");
        
        // Step 2: Test VRF Request
        console.log("\n📋 Step 2: Test VRF Request");
        console.log("-".repeat(30));
        
        // Cast some test votes first
        console.log("👥 Casting test votes...");
        const [, voter1, voter2] = await ethers.getSigners();
        
        await voteContract.connect(voter1).vote(1);
        await voteContract.connect(voter2).vote(2);
        
        const voteResults = await voteContract.TotalVoteRecordGetter();
        console.log("📊 Vote results:");
        for (let i = 1; i < voteResults.length; i++) {
            console.log(`   Option ${i}: ${voteResults[i].toString()} votes`);
        }
        
        // End the vote
        console.log("⏰ Ending vote...");
        await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
        await ethers.provider.send("evm_mine");
        await voteContract.endVote();
        console.log("✅ Vote ended");
        
        // Now test VRF request
        console.log("🎲 Testing VRF request...");
        
        try {
            const tx = await vrfConsumer.requestRandomWinner(voteAddress);
            const receipt = await tx.wait();
            
            console.log("✅ VRF request sent successfully!");
            console.log("📝 Transaction hash:", receipt.hash);
            console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${receipt.hash}`);
            
            // Check for events
            const requestEvents = receipt.logs.filter(log => {
                try {
                    const parsed = vrfConsumer.interface.parseLog(log);
                    return parsed.name === 'RequestSent';
                } catch {
                    return false;
                }
            });
            
            if (requestEvents.length > 0) {
                const event = vrfConsumer.interface.parseLog(requestEvents[0]);
                console.log("🎫 Request ID:", event.args.requestId.toString());
                console.log("🗳️  Vote Contract:", event.args.voteContract);
                
                // Check if request was fulfilled (for mock VRF)
                setTimeout(async () => {
                    try {
                        const randomResult = await vrfConsumer.getRandomResult(voteAddress);
                        if (randomResult.toString() !== '0') {
                            console.log("🎯 Random result:", randomResult.toString());
                            console.log("✅ VRF request fulfilled!");
                        }
                    } catch (error) {
                        console.log("⏳ VRF fulfillment pending...");
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.log("❌ VRF request failed:", error.message);
            
            if (error.message.includes("insufficient funds")) {
                console.log("💡 Subscription needs LINK funding");
            } else if (error.message.includes("consumer")) {
                console.log("💡 Contract not added as consumer to subscription");
            } else {
                console.log("💡 Check subscription status at https://vrf.chain.link/");
            }
        }
        
        // Step 3: Check request status
        console.log("\n📋 Step 3: Check Request Status");
        console.log("-".repeat(30));
        
        try {
            const randomResult = await vrfConsumer.getRandomResult(voteAddress);
            console.log("🎲 Random result for vote:", randomResult.toString());
            
            if (randomResult.toString() !== '0') {
                console.log("✅ VRF request was fulfilled");
            } else {
                console.log("⏳ VRF request pending fulfillment");
            }
            
        } catch (error) {
            console.log("⚠️  Could not get random result:", error.message);
        }
        
    } catch (error) {
        console.log("❌ Test setup failed:", error.message);
    }
    
    console.log("\n🎉 VRF Request Test Complete!");
    console.log("=" .repeat(40));
    
    console.log("\n📝 Summary:");
    console.log("• VRF contract function: requestRandomWinner(address voteContract)");
    console.log("• Requires: Vote contract address as parameter");
    console.log("• Returns: Request ID for tracking");
    console.log("• Cost: ~0.25 LINK per request (if using real VRF)");
    
    console.log("\n💡 To manually test in console:");
    console.log("1. Deploy vote contract");
    console.log("2. Call: await vrf.requestRandomWinner(voteContractAddress)");
    console.log("3. Monitor: await vrf.getRandomResult(voteContractAddress)");
}

main()
    .then(() => {
        console.log("\n✅ Test script completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }); 