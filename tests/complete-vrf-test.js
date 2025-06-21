// Complete VRF Test Script
// Tests all aspects of your deployed VRF contract
// Run with: npx hardhat run tests/complete-vrf-test.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 Starting Complete VRF Test");
    console.log("=" .repeat(50));

    // Your deployed contract addresses
    const VRF_ADDRESS = "0xE60f17e59f9EF3C002E4719bCb3BdE9C270eB5F0";
    const VOTE_ADDRESS = "0x36197DDF830C0C925be0B065212018CCb5c79443"; // From previous deployment

    // === PART 1: Setup and Connection ===
    console.log("\n📋 Part 1: Contract Connection");
    console.log("-".repeat(30));

    try {
        // Connect to contracts
        const vrf = await ethers.getContractAt('ChainlinkVRF', VRF_ADDRESS);
        const vote = await ethers.getContractAt('Vote', VOTE_ADDRESS);

        console.log("✅ Connected to VRF:", VRF_ADDRESS);
        console.log("✅ Connected to Vote:", VOTE_ADDRESS);

        // === PART 2: Check VRF Configuration ===
        console.log("\n📋 Part 2: VRF Configuration");
        console.log("-".repeat(30));

        const subscriptionId = await vrf.getSubscriptionId();
        const keyHash = await vrf.getKeyHash();
        const coordinator = await vrf.getVRFCoordinator();

        console.log("Subscription ID:", subscriptionId.toString());
        console.log("Key Hash:", keyHash);
        console.log("VRF Coordinator:", coordinator);

        // === PART 3: Check VRF Functions ===
        console.log("\n📋 Part 3: Available Functions");
        console.log("-".repeat(30));

        console.log("🔧 Key VRF Functions:");
        console.log("  • requestRandomWinner(address voteContract)");
        console.log("  • getRandomResult(address voteContract)");
        console.log("  • getRequestStatus(uint256 requestId)");
        console.log("  • getSubscriptionId()");
        console.log("  • getKeyHash()");

        // === PART 4: Test VRF Request ===
        console.log("\n📋 Part 4: VRF Request Test");
        console.log("-".repeat(30));

        try {
            console.log("🎲 Making VRF request...");
            
            // Make VRF request
            const tx = await vrf.requestRandomWinner(VOTE_ADDRESS);
            console.log("⏳ Transaction sent:", tx.hash);
            console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
            // Check for events
            console.log("📡 Transaction events:", receipt.logs.length);
            
            // Parse VRF events
            const vrfEvents = receipt.logs.filter(log => {
                try {
                    const parsed = vrf.interface.parseLog(log);
                    return parsed.name === 'RequestSent';
                } catch {
                    return false;
                }
            });
            
            if (vrfEvents.length > 0) {
                const event = vrf.interface.parseLog(vrfEvents[0]);
                console.log("🎫 Request ID:", event.args.requestId.toString());
                console.log("🗳️  Vote Contract:", event.args.voteContract);
                console.log("🔢 Num Words:", event.args.numWords.toString());
            }
            
        } catch (error) {
            console.log("❌ VRF request failed:", error.message);
            
            if (error.message.includes("insufficient funds")) {
                console.log("💡 Solution: Fund subscription with LINK tokens");
                console.log("🔗 Fund at: https://vrf.chain.link/");
            } else if (error.message.includes("consumer")) {
                console.log("💡 Solution: Add contract as consumer to subscription");
            } else if (error.message.includes("revert")) {
                console.log("💡 Check contract logic and VRF configuration");
            }
        }

        // === PART 5: Check Random Result ===
        console.log("\n📋 Part 5: Random Result Check");
        console.log("-".repeat(30));

        try {
            const randomResult = await vrf.getRandomResult(VOTE_ADDRESS);
            console.log("🎲 Random result:", randomResult.toString());
            
            if (randomResult.toString() !== '0') {
                console.log("✅ VRF request was fulfilled!");
                console.log("🎯 Random number:", randomResult.toString());
                
                // Convert to hex for better readability
                const hexResult = "0x" + randomResult.toString(16);
                console.log("🔢 Hex format:", hexResult);
            } else {
                console.log("⏳ VRF request pending or not made yet");
            }
            
        } catch (error) {
            console.log("⚠️ Could not get random result:", error.message);
        }

        // === PART 6: Check Request History ===
        console.log("\n📋 Part 6: Request History");
        console.log("-".repeat(30));

        try {
            // Get request events
            const requestFilter = vrf.filters.RequestSent();
            const requests = await vrf.queryFilter(requestFilter, -1000);
            console.log("📊 Total requests found:", requests.length);
            
            if (requests.length > 0) {
                console.log("📝 Recent requests:");
                requests.slice(-3).forEach((req, index) => {
                    console.log(`   ${index + 1}. Request ID: ${req.args.requestId.toString()}`);
                    console.log(`      Vote Contract: ${req.args.voteContract}`);
                    console.log(`      Block: ${req.blockNumber}`);
                });
            }
            
            // Get fulfillment events
            const fulfillFilter = vrf.filters.RequestFulfilled();
            const fulfillments = await vrf.queryFilter(fulfillFilter, -1000);
            console.log("✅ Total fulfillments:", fulfillments.length);
            
            if (fulfillments.length > 0) {
                console.log("📝 Recent fulfillments:");
                fulfillments.slice(-3).forEach((ful, index) => {
                    console.log(`   ${index + 1}. Request ID: ${ful.args.requestId.toString()}`);
                    console.log(`      Random Words: ${ful.args.randomWords.map(w => w.toString()).join(', ')}`);
                    console.log(`      Block: ${ful.blockNumber}`);
                });
            }
            
        } catch (error) {
            console.log("⚠️ Could not get request history:", error.message);
        }

        // === PART 7: Test Vote Integration ===
        console.log("\n📋 Part 7: Vote Integration");
        console.log("-".repeat(30));

        try {
            // Check vote state
            const voteResults = await vote.TotalVoteRecordGetter();
            console.log("🗳️ Vote results:");
            for (let i = 1; i < voteResults.length; i++) {
                console.log(`   Option ${i}: ${voteResults[i].toString()} votes`);
            }
            
            // Check user vote
            const userVote = await vote.UserVoteRecordGetter();
            console.log("👤 Your vote:", userVote.toString());
            
            // Check vote name and description
            const voteName = await vote.i_VoteName();
            const voteDesc = await vote.i_VoteDescribtion();
            console.log("📋 Vote Name:", voteName);
            console.log("📄 Description:", voteDesc);
            
        } catch (error) {
            console.log("⚠️ Vote contract interaction failed:", error.message);
        }

        // === PART 8: Automation Check ===
        console.log("\n📋 Part 8: Automation Status");
        console.log("-".repeat(30));

        try {
            const automationConfig = await vrf.getAutomationConfig(VOTE_ADDRESS);
            console.log("⏰ Automation configured:");
            console.log("   Vote Contract:", automationConfig.voteContract);
            console.log("   End Time:", new Date(Number(automationConfig.voteEndTime) * 1000).toLocaleString());
            console.log("   Is Active:", automationConfig.isActive);
            console.log("   Executed:", automationConfig.executed);
            
        } catch (error) {
            console.log("⚠️ Could not get automation config:", error.message);
        }

        // === PART 9: Comprehensive Status ===
        console.log("\n📋 Part 9: Complete Status Summary");
        console.log("-".repeat(40));

        console.log("🔗 Contract Addresses:");
        console.log("   VRF Consumer:", VRF_ADDRESS);
        console.log("   Vote Contract:", VOTE_ADDRESS);

        console.log("\n⚙️ VRF Configuration:");
        console.log("   Subscription ID:", subscriptionId.toString());
        console.log("   VRF Coordinator:", coordinator);
        console.log("   Key Hash:", keyHash);

        console.log("\n🎯 Key Functions:");
        console.log("   Request VRF: await vrf.requestRandomWinner(voteAddress)");
        console.log("   Check Result: await vrf.getRandomResult(voteAddress)");
        console.log("   Check Status: await vrf.getRequestStatus(requestId)");

        console.log("\n🔗 Useful Links:");
        console.log("   VRF Contract: https://sepolia.etherscan.io/address/" + VRF_ADDRESS);
        console.log("   Vote Contract: https://sepolia.etherscan.io/address/" + VOTE_ADDRESS);
        console.log("   VRF Dashboard: https://vrf.chain.link/");

        console.log("\n🎉 Complete VRF Test Finished!");
        console.log("=" .repeat(50));

        // === PART 10: Next Steps ===
        console.log("\n📋 Next Steps:");
        console.log("1. 🪙 Fund your VRF subscription with LINK tokens");
        console.log("2. 🧪 Test real VRF requests (costs ~0.25 LINK each)");
        console.log("3. 🗳️ Deploy complete voting system with VRF");
        console.log("4. 📊 Monitor VRF requests and fulfillments");
        console.log("5. 🚀 Deploy to mainnet when ready");

    } catch (error) {
        console.log("❌ Test failed:", error.message);
        
        if (error.message.includes("contract not deployed")) {
            console.log("💡 Make sure contracts are deployed to Sepolia");
        } else if (error.message.includes("network")) {
            console.log("💡 Check your network connection and RPC endpoint");
        }
    }
}

// Run the test
main()
    .then(() => {
        console.log("\n✅ Test script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Test script failed:", error.message);
        process.exit(1);
    });
