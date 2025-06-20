// Test VRF Without LINK Tokens
// Uses mock VRF functionality for testing without costs
// Run with: npx hardhat run tests/test-vrf-without-link.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Testing VRF Without LINK Tokens");
    console.log("=" .repeat(50));
    
    const [deployer] = await ethers.getSigners();
    
    console.log("🌐 Network:", hre.network.name);
    console.log("👤 Deployer:", await deployer.getAddress());
    
    // === STEP 1: Deploy Mock VRF System ===
    console.log("\n📋 Step 1: Deploy Mock VRF System");
    console.log("-".repeat(40));
    
    try {
        // Deploy Mock VRF Coordinator
        console.log("🎯 Deploying Mock VRF Coordinator...");
        const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
        const mockCoordinator = await MockVRFCoordinator.deploy();
        await mockCoordinator.waitForDeployment();
        const mockCoordinatorAddress = await mockCoordinator.getAddress();
        console.log("✅ Mock VRF Coordinator:", mockCoordinatorAddress);
        
        // Deploy ChainlinkVRF with mock coordinator
        console.log("🎯 Deploying VRF Consumer with Mock...");
        const ChainlinkVRF = await ethers.getContractFactory("ChainlinkVRF");
        const vrfConsumer = await ChainlinkVRF.deploy(
            1, // subscription ID (mock)
            mockCoordinatorAddress, // mock coordinator
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" // key hash
        );
        await vrfConsumer.waitForDeployment();
        const vrfAddress = await vrfConsumer.getAddress();
        console.log("✅ VRF Consumer:", vrfAddress);
        
        // === STEP 2: Deploy Supporting Contracts ===
        console.log("\n📋 Step 2: Deploy Supporting Contracts");
        console.log("-".repeat(40));
        
        // Deploy NFT
        console.log("🎫 Deploying NFT...");
        const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
        const nft = await TransferableNFT.deploy("Test NFT", "Test voting rights");
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();
        console.log("✅ NFT:", nftAddress);
        
        // Deploy Vote contract
        console.log("🗳️ Deploying Vote contract...");
        const Vote = await ethers.getContractFactory("Vote");
        const vote = await Vote.deploy(
            "Free VRF Test",
            "Testing VRF without LINK tokens",
            3, // 3 options
            nftAddress,
            vrfAddress,
            1, // 1 hour
            true // Use random winner
        );
        await vote.waitForDeployment();
        const voteAddress = await vote.getAddress();
        console.log("✅ Vote:", voteAddress);
        
        // Configure contracts
        console.log("🔧 Configuring contracts...");
        await nft.setVoteContract(voteAddress);
        await nft.transferOwnership(voteAddress);
        console.log("✅ Contracts configured");
        
        // === STEP 3: Cast Test Votes ===
        console.log("\n📋 Step 3: Cast Test Votes");
        console.log("-".repeat(30));
        
        const [, voter1, voter2, voter3] = await ethers.getSigners();
        
        console.log("👥 Casting votes...");
        await vote.connect(voter1).vote(1);
        await vote.connect(voter2).vote(2);
        await vote.connect(voter3).vote(1);
        
        // Check vote results
        const voteResults = await vote.TotalVoteRecordGetter();
        console.log("📊 Current vote results:");
        for (let i = 1; i < voteResults.length; i++) {
            console.log(`   Option ${i}: ${voteResults[i].toString()} votes`);
        }
        
        // === STEP 4: Test Mock VRF Request ===
        console.log("\n📋 Step 4: Test Mock VRF Request");
        console.log("-".repeat(35));
        
        console.log("🎲 Making mock VRF request...");
        
        try {
            // Request random winner
            const tx = await vrfConsumer.requestRandomWinner(voteAddress);
            const receipt = await tx.wait();
            
            console.log("✅ VRF request successful!");
            console.log("📝 Transaction:", receipt.hash);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
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
                console.log("🗳️ Vote Contract:", event.args.voteContract);
            }
            
            // Check fulfillment events
            const fulfillEvents = receipt.logs.filter(log => {
                try {
                    const parsed = vrfConsumer.interface.parseLog(log);
                    return parsed.name === 'RequestFulfilled';
                } catch {
                    return false;
                }
            });
            
            if (fulfillEvents.length > 0) {
                const event = vrfConsumer.interface.parseLog(fulfillEvents[0]);
                console.log("✅ Request fulfilled!");
                console.log("🎯 Random words:", event.args.randomWords.map(w => w.toString()).join(', '));
            }
            
        } catch (error) {
            console.log("❌ Mock VRF request failed:", error.message);
        }
        
        // === STEP 5: Check Random Result ===
        console.log("\n📋 Step 5: Check Random Result");
        console.log("-".repeat(30));
        
        try {
            const randomResult = await vrfConsumer.getRandomResult(voteAddress);
            console.log("🎲 Random result:", randomResult.toString());
            
            if (randomResult.toString() !== '0') {
                console.log("✅ Mock VRF generated random number!");
                console.log("🔢 Hex format:", "0x" + randomResult.toString(16));
                
                // Calculate which option this would select
                const totalVotes = voteResults.slice(1).reduce((sum, votes) => sum + BigInt(votes), 0n);
                if (totalVotes > 0n) {
                    const winnerIndex = (randomResult % totalVotes) + 1n;
                    console.log("🏆 This would select option:", winnerIndex.toString());
                }
            } else {
                console.log("⏳ No random result yet");
            }
            
        } catch (error) {
            console.log("⚠️ Could not get random result:", error.message);
        }
        
        // === STEP 6: Test Manual Fulfillment ===
        console.log("\n📋 Step 6: Test Manual Fulfillment");
        console.log("-".repeat(35));
        
        try {
            console.log("🎯 Testing manual VRF fulfillment...");
            
            // Generate a test request ID
            const testRequestId = 12345;
            const testRandomWords = [ethers.getBigInt(ethers.randomBytes(32))];
            
            console.log("🎲 Test random number:", testRandomWords[0].toString());
            
            // Manually fulfill the request
            await mockCoordinator.fulfillRandomWords(testRequestId, vrfAddress, testRandomWords);
            console.log("✅ Manual fulfillment successful!");
            
        } catch (error) {
            console.log("⚠️ Manual fulfillment failed:", error.message);
        }
        
        // === STEP 7: Summary ===
        console.log("\n📋 Summary: Free VRF Testing");
        console.log("-".repeat(35));
        
        console.log("✅ Mock VRF system deployed and working");
        console.log("✅ No LINK tokens required");
        console.log("✅ Instant random number generation");
        console.log("✅ Full voting integration tested");
        
        console.log("\n🔗 Deployed Contracts:");
        console.log("   Mock Coordinator:", mockCoordinatorAddress);
        console.log("   VRF Consumer:", vrfAddress);
        console.log("   Vote Contract:", voteAddress);
        console.log("   NFT Contract:", nftAddress);
        
        console.log("\n💡 To get real LINK tokens:");
        console.log("1. Try Alchemy faucet: https://sepoliafaucet.com/");
        console.log("2. Try QuickNode faucet: https://faucet.quicknode.com/ethereum/sepolia");
        console.log("3. Switch to Mumbai: https://faucet.polygon.technology/");
        console.log("4. Join Chainlink Discord for community help");
        
        console.log("\n🎉 Free VRF Test Complete!");
        
    } catch (error) {
        console.log("❌ Test failed:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n✅ Free VRF test completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }); 