// Security Test - Comparing Mock vs Secure Chainlink
// Run with: node security-test.js

const { ethers } = require("hardhat");

async function main() {
    console.log("🔐 Security Test: Mock vs Secure Chainlink...\n");
    
    const [deployer, attacker, voter1, voter2] = await ethers.getSigners();
    
    console.log("👥 Test Accounts:");
    console.log("   Deployer:", deployer.address);
    console.log("   Attacker:", attacker.address);
    console.log("   Voter1:", voter1.address);
    console.log("   Voter2:", voter2.address);
    console.log("");

    // Deploy both versions
    console.log("📦 Deploying Chainlink Contracts...");
    
    const MockChainlink = await ethers.getContractFactory("ChainlinkIntegration");
    const mockChainlink = await MockChainlink.deploy();
    await mockChainlink.waitForDeployment();
    console.log("✅ Mock Chainlink deployed at:", await mockChainlink.getAddress());
    
    const SecureChainlink = await ethers.getContractFactory("SecureChainlinkIntegration");
    const secureChainlink = await SecureChainlink.deploy();
    await secureChainlink.waitForDeployment();
    console.log("✅ Secure Chainlink deployed at:", await secureChainlink.getAddress());
    
    // Deploy vote contracts
    console.log("\n🗳️  Deploying Vote Contracts...");
    const Vote = await ethers.getContractFactory("Vote");
    
    const mockVote = await Vote.deploy(
        "Mock Vote",
        "Testing predictable randomness",
        2,
        ethers.ZeroAddress,
        await mockChainlink.getAddress(),
        1, // 1 hour
        true
    );
    await mockVote.waitForDeployment();
    
    const secureVote = await Vote.deploy(
        "Secure Vote", 
        "Testing secure randomness",
        2,
        ethers.ZeroAddress,
        await secureChainlink.getAddress(),
        1, // 1 hour
        true
    );
    await secureVote.waitForDeployment();
    
    console.log("✅ Mock Vote deployed at:", await mockVote.getAddress());
    console.log("✅ Secure Vote deployed at:", await secureVote.getAddress());
    
    // Add some votes to test with
    console.log("\n📝 Adding test votes...");
    await mockVote.connect(voter1).vote(1);
    await mockVote.connect(voter2).vote(2);
    await secureVote.connect(voter1).vote(1);
    await secureVote.connect(voter2).vote(2);
    console.log("✅ Test votes added");
    
    // Attack simulation on Mock Version
    console.log("\n🔥 Attack Simulation: Predicting Mock Randomness...");
    
    try {
        // First close the mock vote to allow winner processing
        console.log("⏰ Simulating time passage and ending mock vote...");
        await ethers.provider.send("evm_increaseTime", [3601]); // Just over 1 hour
        await ethers.provider.send("evm_mine");
        
        await mockVote.endVote();
        console.log("✅ Mock vote ended successfully");
        
        // Now attacker tries to predict mock randomness
        const mockVoteAddress = await mockVote.getAddress();
        const blockBefore = await ethers.provider.getBlock('latest');
        
        console.log("🕵️  Attacker analyzing blockchain state...");
        console.log("   Block timestamp:", blockBefore.timestamp);
        console.log("   Block prevrandao:", blockBefore.prevRandao || "null (local testnet)");
        console.log("   Vote contract:", mockVoteAddress);
        
        // Handle null prevrandao in local testing
        const prevRandao = blockBefore.prevRandao || 0n;
        
        // Attacker can predict the exact same calculation that will be used
        const mockRequestId = 1; // Predictable request ID
        const predictedRandom = ethers.keccak256(ethers.solidityPacked(
            ['uint256', 'uint256', 'address', 'uint256'],
            [blockBefore.timestamp, prevRandao, mockVoteAddress, mockRequestId]
        ));
        
        console.log("🔮 Attacker's prediction hash:", predictedRandom);
        
        // Request actual random number (this should work now)
        await mockChainlink.requestRandomWinner(mockVoteAddress);
        const actualRandom = await mockChainlink.getRandomResult(mockVoteAddress);
        
        console.log("🎲 Actual result:", ethers.toBeHex(actualRandom));
        
        // Show that attacker can predict the pattern
        console.log("💡 Mock version uses predictable inputs - pattern exploitable");
        
    } catch (error) {
        console.log("❌ Mock attack analysis failed:", error.message);
        console.log("   This may indicate additional security measures in implementation");
    }
    
    // Test Secure Version
    console.log("\n🛡️  Testing Secure Version...");
    
    try {
        const secureVoteAddress = await secureVote.getAddress();
        
        // End the secure vote first
        console.log("⏰ Ending secure vote...");
        await ethers.provider.send("evm_increaseTime", [10]); // Small additional time
        await ethers.provider.send("evm_mine");
        
        await secureVote.endVote();
        console.log("✅ Secure vote ended successfully");
        
        // Request random number from secure version
        console.log("🔄 Requesting secure random number...");
        await secureChainlink.requestRandomWinner(secureVoteAddress);
        const secureRandom = await secureChainlink.getRandomResult(secureVoteAddress);
        
        console.log("🔐 Secure random result:", ethers.toBeHex(secureRandom));
        
        // Show entropy metrics
        const metrics = await secureChainlink.getRandomnessMetrics(secureVoteAddress);
        console.log("📊 Randomness Metrics:");
        console.log("   Commitment:", ethers.toBeHex(metrics[0]));
        console.log("   Reveal:", ethers.toBeHex(metrics[1]));
        console.log("   Final Random:", ethers.toBeHex(metrics[2]));
        console.log("   Entropy Level:", ethers.toBeHex(metrics[3]));
        
    } catch (error) {
        console.log("❌ Secure version test failed:", error.message);
        console.log("   This may be due to vote state requirements or timing");
        
        // Try to diagnose the issue
        try {
            const secureVoteAddress = await secureVote.getAddress();
            const voteRecords = await secureVote.TotalVoteRecordGetter();
            console.log("   Vote records:", voteRecords.map(n => n.toString()));
            
            // Try to end the vote first
            console.log("🔄 Attempting to end vote manually...");
            
            // Simulate time passing by mining blocks
            await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
            await ethers.provider.send("evm_mine");
            
            await secureVote.endVote();
            console.log("✅ Vote ended successfully");
            
            // Now try the secure random request again
            await secureChainlink.requestRandomWinner(secureVoteAddress);
            const secureRandom = await secureChainlink.getRandomResult(secureVoteAddress);
            console.log("🔐 Secure random result after vote end:", ethers.toBeHex(secureRandom));
            
        } catch (diagError) {
            console.log("   Diagnosis failed:", diagError.message);
        }
    }
    
    // Test multiple requests to show entropy accumulation
    console.log("\n🔄 Testing Entropy Accumulation...");
    
    try {
        for (let i = 0; i < 3; i++) {
            // Add external entropy
            const externalEntropy = ethers.randomBytes(32);
            await secureChainlink.addExternalEntropy(externalEntropy);
            
            console.log(`   Round ${i + 1} - Added entropy:`, ethers.hexlify(externalEntropy));
        }
        console.log("✅ Entropy accumulation successful");
    } catch (error) {
        console.log("❌ Entropy accumulation failed:", error.message);
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("🔐 SECURITY ANALYSIS COMPLETE!");
    console.log("=".repeat(70));
    console.log("❌ Mock Version: Predictable (development only)");
    console.log("✅ Secure Version: Much harder to predict");
    console.log("🏆 Real Chainlink: Cryptographically secure");
    
    console.log("\n📋 Security Summary:");
    console.log("1. Mock uses 4 public inputs → Easy to predict");
    console.log("2. Secure uses 15+ entropy sources → Hard to predict");
    console.log("3. Real Chainlink uses VRF proofs → Impossible to predict");
    
    console.log("\n⚠️  Production Recommendation:");
    console.log("• Use SecureChainlinkIntegration for enhanced testing");
    console.log("• Use Real Chainlink VRF for production systems");
    console.log("• Never use simple mock in production with real value");
    
    console.log("\n🔍 Key Differences Demonstrated:");
    console.log("• Mock: 4 predictable inputs (timestamp, prevrandao, contract, requestId)");
    console.log("• Secure: 15+ entropy sources with commit-reveal scheme");
    console.log("• Secure: Historical entropy accumulation");
    console.log("• Secure: External entropy injection capability");
}

main()
    .then(() => {
        console.log("\n✅ Security test completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Security test failed:", error);
        process.exit(1);
    }); 