// Debug VRF Error Messages
// Shows detailed error information for VRF failures
// Run with: npx hardhat run tests/debug-vrf-error.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging VRF Error Messages");
    console.log("=" .repeat(50));
    
    const VRF_ADDRESS = "0xE60f17e59f9EF3C002E4719bCb3BdE9C270eB5F0";
    const VOTE_ADDRESS = "0x36197DDF830C0C925be0B065212018CCb5c79443";
    
    const [deployer] = await ethers.getSigners();
    
    console.log("🌐 Network:", hre.network.name);
    console.log("👤 Deployer:", await deployer.getAddress());
    console.log("📝 VRF Contract:", VRF_ADDRESS);
    console.log("🗳️ Vote Contract:", VOTE_ADDRESS);
    
    try {
        // Connect to contracts
        const vrf = await ethers.getContractAt('ChainlinkVRF', VRF_ADDRESS);
        const vote = await ethers.getContractAt('Vote', VOTE_ADDRESS);
        
        console.log("\n📋 Step 1: Check Vote Contract State");
        console.log("-".repeat(40));
        
        // Check vote contract state
        try {
            const voteName = await vote.i_VoteName();
            const voteDesc = await vote.i_VoteDescribtion();
            const voteResults = await vote.TotalVoteRecordGetter();
            
            console.log("✅ Vote Name:", voteName);
            console.log("✅ Description:", voteDesc);
            console.log("✅ Vote Results:");
            for (let i = 1; i < voteResults.length; i++) {
                console.log(`   Option ${i}: ${voteResults[i].toString()} votes`);
            }
            
            // Check if vote has ended
            const userVote = await vote.UserVoteRecordGetter();
            console.log("✅ Your vote:", userVote.toString());
            
        } catch (error) {
            console.log("❌ Vote contract state check failed:", error.message);
        }
        
        console.log("\n📋 Step 2: Check Vote Contract Functions");
        console.log("-".repeat(40));
        
        // Check if processRandomWinner function exists
        try {
            const voteABI = vote.interface;
            const hasProcessFunction = voteABI.fragments.some(f => f.name === 'processRandomWinner');
            console.log("✅ Has processRandomWinner function:", hasProcessFunction);
            
            if (hasProcessFunction) {
                console.log("✅ Vote contract has the required function");
            } else {
                console.log("❌ Vote contract missing processRandomWinner function");
                console.log("💡 This is likely the cause of the error");
            }
            
        } catch (error) {
            console.log("❌ Function check failed:", error.message);
        }
        
        console.log("\n📋 Step 3: Simulate VRF Call");
        console.log("-".repeat(30));
        
        try {
            // Try to call processRandomWinner directly
            const testRandomNumber = ethers.getBigInt(ethers.randomBytes(32));
            console.log("🎲 Test random number:", testRandomNumber.toString());
            
            // Check if we can call processRandomWinner directly
            const tx = await vote.processRandomWinner(testRandomNumber);
            const receipt = await tx.wait();
            
            console.log("✅ Direct call successful!");
            console.log("📝 Transaction:", receipt.hash);
            
        } catch (error) {
            console.log("❌ Direct call failed:", error.message);
            console.log("🔍 Full error details:");
            
            // Parse revert reason
            if (error.data) {
                try {
                    const decoded = vote.interface.parseError(error.data);
                    console.log("   Decoded error:", decoded.name, decoded.args);
                } catch {
                    console.log("   Raw error data:", error.data);
                }
            }
            
            if (error.reason) {
                console.log("   Revert reason:", error.reason);
            }
            
            // Common causes
            console.log("\n💡 Possible causes:");
            console.log("   • Vote hasn't ended yet");
            console.log("   • Vote already processed");
            console.log("   • Insufficient permissions");
            console.log("   • Contract state issue");
        }
        
        console.log("\n📋 Step 4: Check VRF Request with Detailed Errors");
        console.log("-".repeat(50));
        
        try {
            // Enable detailed error reporting
            console.log("🎲 Making VRF request with error catching...");
            
            const tx = await vrf.requestRandomWinner(VOTE_ADDRESS, {
                gasLimit: 500000 // Increase gas limit
            });
            
            console.log("⏳ Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            
            console.log("✅ VRF request successful!");
            console.log("📝 Block:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
            // Check events
            console.log("\n📡 Transaction Events:");
            receipt.logs.forEach((log, index) => {
                try {
                    const parsed = vrf.interface.parseLog(log);
                    console.log(`   ${index + 1}. ${parsed.name}:`, parsed.args);
                } catch {
                    console.log(`   ${index + 1}. Raw log:`, log.topics[0]);
                }
            });
            
        } catch (error) {
            console.log("❌ VRF request failed with detailed error:");
            console.log("   Message:", error.message);
            
            if (error.data) {
                console.log("   Data:", error.data);
            }
            
            if (error.reason) {
                console.log("   Reason:", error.reason);
            }
            
            // Try to decode the error
            if (error.data && error.data.startsWith('0x08c379a0')) {
                // Standard revert string
                try {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + error.data.slice(10));
                    console.log("   Decoded revert:", decoded[0]);
                } catch {
                    console.log("   Could not decode revert reason");
                }
            }
            
            console.log("\n🔧 Debugging Steps:");
            console.log("1. Check if vote has ended");
            console.log("2. Verify vote contract has processRandomWinner function");
            console.log("3. Check if subscription is funded");
            console.log("4. Verify consumer is added to subscription");
        }
        
        console.log("\n📋 Step 5: Alternative Testing");
        console.log("-".repeat(30));
        
        console.log("💡 To test without the vote contract issue:");
        console.log("1. Use mock VRF system (already deployed)");
        console.log("2. Deploy new vote contract with proper functions");
        console.log("3. Test VRF directly with mock coordinator");
        
        console.log("\n🔗 Your Mock VRF System:");
        console.log("   Mock Coordinator: 0x8D5a997c96af14511c879e72f96648c377d606D9");
        console.log("   Mock VRF Consumer: 0xA605405374e96ED271BAc0e5e75A005fC5525A94");
        console.log("   This works without LINK tokens!");
        
    } catch (error) {
        console.log("❌ Debug script failed:", error.message);
    }
    
    console.log("\n🎉 Debug Analysis Complete!");
    console.log("=" .repeat(40));
}

main()
    .then(() => {
        console.log("\n✅ Debug completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Debug failed:", error.message);
        process.exit(1);
    }); 