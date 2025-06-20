# 🎲 Mock VRF Testing Guide

## Overview
This guide shows you how to test your **FREE Mock VRF system** that's already deployed on Sepolia. No LINK tokens required!

## 📋 Your Deployed Mock VRF System

### Contract Addresses
- **Mock VRF Coordinator**: `0x8D5a997c96af14511c879e72f96648c377d606D9`
- **Mock VRF Consumer**: `0xA605405374e96ED271BAc0e5e75A005fC5525A94`
- **Vote Contract**: `0x834427C865a0fEf42D9f4C581c075E4D6B0dc588`
- **NFT Contract**: `0xCebD5C5BaB57c8dbDa28473137681aE7946264E9`

### Network
- **Sepolia Testnet**
- **No LINK tokens needed**
- **Instant random number generation**

## 🚀 Quick Start Testing

### Method 1: Hardhat Console (Interactive)

```bash
# Start Hardhat console
npx hardhat console --network sepolia
```

```javascript
// Connect to your mock VRF contracts
const mockVrf = await ethers.getContractAt('ChainlinkVRF', '0xA605405374e96ED271BAc0e5e75A005fC5525A94')
const mockVote = await ethers.getContractAt('Vote', '0x834427C865a0fEf42D9f4C581c075E4D6B0dc588')
const mockCoordinator = await ethers.getContractAt('MockVRFCoordinator', '0x8D5a997c96af14511c879e72f96648c377d606D9')

// Check configuration
console.log("✅ Mock VRF Coordinator:", await mockVrf.getVRFCoordinator())
console.log("✅ Subscription ID:", (await mockVrf.getSubscriptionId()).toString())
console.log("✅ Key Hash:", await mockVrf.getKeyHash())

// Test VRF request
console.log("🎲 Making VRF request...")
const tx = await mockVrf.requestRandomWinner('0x834427C865a0fEf42D9f4C581c075E4D6B0dc588')
const receipt = await tx.wait()
console.log("✅ Transaction:", receipt.hash)

// Check random result
const result = await mockVrf.getRandomResult('0x834427C865a0fEf42D9f4C581c075E4D6B0dc588')
console.log("🎯 Random result:", result.toString())
console.log("🔢 Hex format:", "0x" + result.toString(16))
```

### Method 2: Test Script

Create `tests/test-mock-vrf.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Testing Mock VRF System");
    console.log("=" .repeat(40));
    
    // Contract addresses
    const MOCK_VRF = "0xA605405374e96ED271BAc0e5e75A005fC5525A94";
    const MOCK_VOTE = "0x834427C865a0fEf42D9f4C581c075E4D6B0dc588";
    const MOCK_COORDINATOR = "0x8D5a997c96af14511c879e72f96648c377d606D9";
    
    // Connect to contracts
    const mockVrf = await ethers.getContractAt('ChainlinkVRF', MOCK_VRF);
    const mockVote = await ethers.getContractAt('Vote', MOCK_VOTE);
    const mockCoordinator = await ethers.getContractAt('MockVRFCoordinator', MOCK_COORDINATOR);
    
    console.log("✅ Connected to all contracts");
    
    // Test 1: Configuration Check
    console.log("\n📋 Configuration Check:");
    const coordinator = await mockVrf.getVRFCoordinator();
    const subscriptionId = await mockVrf.getSubscriptionId();
    const keyHash = await mockVrf.getKeyHash();
    
    console.log("   Coordinator:", coordinator);
    console.log("   Subscription ID:", subscriptionId.toString());
    console.log("   Key Hash:", keyHash);
    
    // Test 2: Vote Status
    console.log("\n📋 Vote Status:");
    const voteName = await mockVote.i_VoteName();
    const voteResults = await mockVote.TotalVoteRecordGetter();
    
    console.log("   Vote Name:", voteName);
    console.log("   Vote Results:");
    for (let i = 1; i < voteResults.length; i++) {
        console.log(`     Option ${i}: ${voteResults[i].toString()} votes`);
    }
    
    // Test 3: VRF Request
    console.log("\n📋 VRF Request Test:");
    try {
        const tx = await mockVrf.requestRandomWinner(MOCK_VOTE);
        const receipt = await tx.wait();
        
        console.log("✅ VRF request successful!");
        console.log("   Transaction:", receipt.hash);
        console.log("   Gas used:", receipt.gasUsed.toString());
        
        // Check for events
        const events = receipt.logs.filter(log => {
            try {
                const parsed = mockVrf.interface.parseLog(log);
                return parsed.name === 'RequestSent' || parsed.name === 'RequestFulfilled';
            } catch {
                return false;
            }
        });
        
        console.log("   Events found:", events.length);
        
    } catch (error) {
        console.log("❌ VRF request failed:", error.message);
    }
    
    // Test 4: Check Random Result
    console.log("\n📋 Random Result Check:");
    try {
        const randomResult = await mockVrf.getRandomResult(MOCK_VOTE);
        
        if (randomResult.toString() !== '0') {
            console.log("✅ Random number generated!");
            console.log("   Decimal:", randomResult.toString());
            console.log("   Hex:", "0x" + randomResult.toString(16));
            
            // Calculate winner selection
            const totalVotes = voteResults.slice(1).reduce((sum, votes) => sum + BigInt(votes), 0n);
            if (totalVotes > 0n) {
                const winnerIndex = (randomResult % totalVotes) + 1n;
                console.log("   Would select option:", winnerIndex.toString());
            }
        } else {
            console.log("⏳ No random result yet");
        }
        
    } catch (error) {
        console.log("❌ Random result check failed:", error.message);
    }
    
    // Test 5: Manual Fulfillment
    console.log("\n📋 Manual Fulfillment Test:");
    try {
        const testRequestId = 99999;
        const testRandomWords = [ethers.getBigInt(ethers.randomBytes(32))];
        
        console.log("🎲 Test random number:", testRandomWords[0].toString());
        
        await mockCoordinator.fulfillRandomWords(testRequestId, MOCK_VRF, testRandomWords);
        console.log("✅ Manual fulfillment successful!");
        
    } catch (error) {
        console.log("❌ Manual fulfillment failed:", error.message);
    }
    
    console.log("\n🎉 Mock VRF Testing Complete!");
}

main().catch(console.error);
```

Run with:
```bash
npx hardhat run tests/test-mock-vrf.js --network sepolia
```

## 🧪 Advanced Testing

### Test Random Number Distribution
```javascript
// Generate multiple random numbers
const results = [];
for (let i = 0; i < 10; i++) {
    const randomWords = [ethers.getBigInt(ethers.randomBytes(32))];
    await mockCoordinator.fulfillRandomWords(i + 1000, MOCK_VRF, randomWords);
    results.push(randomWords[0]);
}

console.log("Random numbers generated:");
results.forEach((num, index) => {
    console.log(`${index + 1}: ${num.toString()}`);
});
```

### Test Winner Selection Logic
```javascript
// Simulate vote with different outcomes
const voteOptions = [0n, 5n, 3n, 7n]; // Option 0 unused, then 5, 3, 7 votes
const totalVotes = voteOptions.slice(1).reduce((sum, votes) => sum + votes, 0n);

const randomNumber = ethers.getBigInt(ethers.randomBytes(32));
const winnerIndex = (randomNumber % totalVotes) + 1n;

console.log("Simulated winner selection:");
console.log("  Total votes:", totalVotes.toString());
console.log("  Random number:", randomNumber.toString());
console.log("  Winner index:", winnerIndex.toString());
```

## 📊 What You Can Test

### ✅ VRF Functionality
- Random number generation
- Request and fulfillment flow
- Event emission
- Result storage

### ✅ Integration Testing
- VRF to Vote contract communication
- Winner selection logic
- Automation triggers
- Error handling

### ✅ Performance Testing
- Gas usage optimization
- Multiple request handling
- Batch operations
- Stress testing

## 🔗 Useful Commands

### Check Contract Status
```bash
# View contracts on Etherscan
open https://sepolia.etherscan.io/address/0xA605405374e96ED271BAc0e5e75A005fC5525A94
open https://sepolia.etherscan.io/address/0x834427C865a0fEf42D9f4C581c075E4D6B0dc588
```

### Monitor Events
```javascript
// Listen for VRF events
mockVrf.on("RequestSent", (requestId, numWords, voteContract) => {
    console.log("VRF Request:", { requestId, numWords, voteContract });
});

mockVrf.on("RequestFulfilled", (requestId, randomWords, voteContract) => {
    console.log("VRF Fulfilled:", { requestId, randomWords, voteContract });
});
```

## 🎯 Next Steps

1. **Test Mock VRF thoroughly** - verify all functionality
2. **Develop voting logic** - use mock VRF for development
3. **Get LINK tokens** - when ready for production testing
4. **Switch to real VRF** - same interface, real randomness

## 💡 Benefits of Mock VRF

- **🆓 Free**: No LINK tokens required
- **⚡ Fast**: Instant fulfillment
- **🔧 Flexible**: Manual control over random numbers
- **🧪 Perfect for testing**: Develop without costs

Your mock VRF system is **production-ready** for testing and development! 🚀 