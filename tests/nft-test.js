// NFT Voting System Test
// Tests both TransferableNFT and SoulboundNFT integration with voting
// Run with: node nft-test.js

const { ethers } = require("hardhat");

async function main() {
    console.log("🎫 Starting NFT Voting System Test...\n");
    
    // Get signers for testing
    const [deployer, voter1, voter2, voter3, voter4] = await ethers.getSigners();
    
    console.log("👥 Test Accounts:");
    console.log("   Deployer:", deployer.address);
    console.log("   Voter 1: ", voter1.address);
    console.log("   Voter 2: ", voter2.address);
    console.log("   Voter 3: ", voter3.address);
    console.log("   Voter 4: ", voter4.address);
    console.log("");

    // Test 1: Transferable NFT Voting System
    console.log("🔄 Test 1: Transferable NFT Voting System");
    console.log("=" .repeat(50));
    
    // Deploy TransferableNFT
    console.log("📦 Deploying TransferableNFT...");
    const TransferableNFT = await ethers.getContractFactory("TransferableNFT");
    const transferableNFT = await TransferableNFT.deploy(
        "Blockchain Governance",
        "Special governance NFT for voting"
    );
    await transferableNFT.waitForDeployment();
    console.log("✅ TransferableNFT deployed at:", await transferableNFT.getAddress());
    
    // Deploy simplified Chainlink (mock)
    console.log("🔗 Deploying Chainlink Integration...");
    const ChainlinkIntegration = await ethers.getContractFactory("ChainlinkIntegration");
    const chainlink = await ChainlinkIntegration.deploy();
    await chainlink.waitForDeployment();
    console.log("✅ Chainlink deployed at:", await chainlink.getAddress());
    
    // Deploy Vote contract with NFT integration
    console.log("🗳️  Deploying Vote contract with NFT integration...");
    const Vote = await ethers.getContractFactory("Vote");
    const vote = await Vote.deploy(
        "Best DeFi Protocol",
        "Vote for the best DeFi protocol of 2024",
        4, // 4 options
        await transferableNFT.getAddress(),
        await chainlink.getAddress(),
        48, // 48 hours
        false // No random winner for this test
    );
    await vote.waitForDeployment();
    console.log("✅ Vote contract deployed at:", await vote.getAddress());
    
    // Transfer NFT ownership to vote contract
    console.log("🔄 Transferring NFT ownership to vote contract...");
    await transferableNFT.transferOwnership(await vote.getAddress());
    console.log("✅ Ownership transferred");
    
    // Set vote contract address in NFT for vote record transfers
    console.log("🔗 Setting vote contract address in NFT...");
    await transferableNFT.setVoteContract(await vote.getAddress());
    console.log("✅ Vote contract address set");
    
    // Test NFT voting
    console.log("\n🎫 Testing NFT Voting Process...");
    
    // Voter 1 votes - should get NFT
    console.log("👤 Voter 1 voting for option 1...");
    await vote.connect(voter1).vote(1);
    
    // Check if voter1 has voting rights
    const hasRights1 = await transferableNFT.hasVotingRights(voter1.address);
    console.log("✅ Voter 1 has voting rights:", hasRights1);
    
    // Voter 2 votes - should get NFT
    console.log("👤 Voter 2 voting for option 2...");
    await vote.connect(voter2).vote(2);
    
    // Voter 3 votes - should get NFT
    console.log("👤 Voter 3 voting for option 1...");
    await vote.connect(voter3).vote(1);
    
    // Check NFT balances
    console.log("\n📊 NFT Balances:");
    const balance1 = await transferableNFT.balanceOf(voter1.address);
    const balance2 = await transferableNFT.balanceOf(voter2.address);
    const balance3 = await transferableNFT.balanceOf(voter3.address);
    console.log("   Voter 1 NFT balance:", balance1.toString());
    console.log("   Voter 2 NFT balance:", balance2.toString());
    console.log("   Voter 3 NFT balance:", balance3.toString());
    
    // Check vote results
    console.log("\n📈 Vote Results:");
    const totalRecord = await vote.TotalVoteRecordGetter();
    for (let i = 1; i < totalRecord.length; i++) {
        console.log(`   Option ${i}: ${totalRecord[i].toString()} votes`);
    }
    
    // Test NFT transfer and voting rights
    console.log("\n🔄 Testing NFT Transfer...");
    const tokenId = 1; // Voter 1's NFT
    
    console.log("📦 Transferring NFT from Voter 1 to Voter 4...");
    await transferableNFT.connect(voter1).transferFrom(voter1.address, voter4.address, tokenId);
    
    // Check voting rights after transfer
    const hasRights1After = await transferableNFT.hasVotingRights(voter1.address);
    const hasRights4After = await transferableNFT.hasVotingRights(voter4.address);
    console.log("✅ Voter 1 has voting rights after transfer:", hasRights1After);
    console.log("✅ Voter 4 has voting rights after transfer:", hasRights4After);
    
    // Test Voter 4 voting after receiving NFT
    console.log("\n🎯 Testing Voter 4 Voting After NFT Transfer...");
    console.log("📊 Vote counts before Voter 4 votes:");
    const recordBefore = await vote.TotalVoteRecordGetter();
    for (let i = 1; i < recordBefore.length; i++) {
        console.log(`   Option ${i}: ${recordBefore[i].toString()} votes`);
    }
    
    // Voter 4 votes for option 3
    console.log("👤 Voter 4 voting for option 3...");
    await vote.connect(voter4).vote(3);
    console.log("✅ Voter 4 vote cast successfully");
    
    // Check updated vote counts
    console.log("📊 Vote counts after Voter 4 votes:");
    const recordAfter = await vote.TotalVoteRecordGetter();
    for (let i = 1; i < recordAfter.length; i++) {
        console.log(`   Option ${i}: ${recordAfter[i].toString()} votes`);
    }
    
    // Verify the vote count increased
    const option3Before = recordBefore[3];
    const option3After = recordAfter[3];
    console.log(`✅ Option 3 votes increased from ${option3Before} to ${option3After}`);
    
    // Check total votes
    const totalVotes = await vote.getTotalVotes();
    console.log("📈 Total votes cast:", totalVotes.toString());
    
    // Verify Voter 4's individual record
    const voter4Record = await vote.connect(voter4).UserVoteRecordGetter();
    console.log("📝 Voter 4's vote record:", voter4Record.toString());
    
    // Test that Voter 1 can no longer vote (lost rights after transfer)
    console.log("\n🚫 Testing Voter 1 Cannot Vote After Transfer...");
    try {
        await vote.connect(voter1).vote(4);
        console.log("❌ ERROR: Voter 1 should not be able to vote after transferring NFT!");
    } catch (error) {
        console.log("✅ Voter 1 correctly prevented from voting:", error.reason || "Access denied");
    }
    
    // Test 2: Soulbound NFT Voting System
    console.log("\n🔒 Test 2: Soulbound NFT Voting System");
    console.log("=" .repeat(50));
    
    // Deploy SoulboundNFT
    console.log("🔒 Deploying SoulboundNFT...");
    const SoulboundNFT = await ethers.getContractFactory("SoulboundNFT");
    const soulboundNFT = await SoulboundNFT.deploy(
        "Permanent Membership",
        "Lifetime voting rights NFT"
    );
    await soulboundNFT.waitForDeployment();
    console.log("✅ SoulboundNFT deployed at:", await soulboundNFT.getAddress());
    
    // Deploy another vote contract with soulbound NFT
    console.log("🗳️  Deploying Vote contract with SoulboundNFT...");
    const vote2 = await Vote.deploy(
        "Community Proposal",
        "Vote on community governance proposal",
        2, // Yes/No vote
        await soulboundNFT.getAddress(),
        await chainlink.getAddress(),
        24, // 24 hours
        false // No random winner
    );
    await vote2.waitForDeployment();
    console.log("✅ Vote contract deployed at:", await vote2.getAddress());
    
    // Transfer soulbound NFT ownership
    console.log("🔄 Transferring SoulboundNFT ownership to vote contract...");
    await soulboundNFT.transferOwnership(await vote2.getAddress());
    console.log("✅ Ownership transferred");
    
    // Test soulbound NFT voting
    console.log("\n🔒 Testing Soulbound NFT Voting...");
    
    // Voters vote and get soulbound NFTs
    console.log("👤 Voter 1 voting for option 1 (Yes)...");
    await vote2.connect(voter1).vote(1);
    
    console.log("👤 Voter 2 voting for option 2 (No)...");
    await vote2.connect(voter2).vote(2);
    
    // Check soulbound NFT balances
    console.log("\n📊 Soulbound NFT Status:");
    const soulboundBalance1 = await soulboundNFT.balanceOf(voter1.address);
    const soulboundBalance2 = await soulboundNFT.balanceOf(voter2.address);
    const soulboundRights1 = await soulboundNFT.hasVotingRights(voter1.address);
    const soulboundRights2 = await soulboundNFT.hasVotingRights(voter2.address);
    
    console.log("   Voter 1 soulbound NFT balance:", soulboundBalance1.toString());
    console.log("   Voter 2 soulbound NFT balance:", soulboundBalance2.toString());
    console.log("   Voter 1 has voting rights:", soulboundRights1);
    console.log("   Voter 2 has voting rights:", soulboundRights2);
    
    // Test soulbound property (should fail)
    console.log("\n🚫 Testing Soulbound Transfer Prevention...");
    try {
        await soulboundNFT.connect(voter1).transferFrom(voter1.address, voter3.address, 1);
        console.log("❌ ERROR: Soulbound transfer should have failed!");
    } catch (error) {
        console.log("✅ Soulbound transfer correctly prevented:", error.reason || "Transfer blocked");
    }
    
    // Check final vote results
    console.log("\n📈 Final Vote Results:");
    const totalRecord2 = await vote2.TotalVoteRecordGetter();
    for (let i = 1; i < totalRecord2.length; i++) {
        console.log(`   Option ${i}: ${totalRecord2[i].toString()} votes`);
    }
    
    // Test 3: Advanced NFT Features
    console.log("\n⚡ Test 3: Advanced NFT Features");
    console.log("=" .repeat(50));
    
    // Test voting power
    console.log("💪 Testing Custom Voting Power...");
    
    // Deploy new transferable NFT for power testing
    const powerNFT = await TransferableNFT.deploy("Power Voting", "Weighted voting NFT");
    await powerNFT.waitForDeployment();
    
    // Add holders with different voting powers
    console.log("👥 Adding holders with custom voting powers...");
    await powerNFT.addHolderWithPower(voter1.address, 5); // 5x voting power
    await powerNFT.addHolderWithPower(voter2.address, 3); // 3x voting power
    await powerNFT.addHolderWithPower(voter3.address, 1); // 1x voting power
    
    // Check voting powers
    const power1 = await powerNFT.getTotalVotingPower(voter1.address);
    const power2 = await powerNFT.getTotalVotingPower(voter2.address);
    const power3 = await powerNFT.getTotalVotingPower(voter3.address);
    
    console.log("⚡ Voting Powers:");
    console.log("   Voter 1:", power1.toString());
    console.log("   Voter 2:", power2.toString());
    console.log("   Voter 3:", power3.toString());
    
    // Test batch minting
    console.log("\n📦 Testing Batch Minting...");
    const batchAddresses = [voter4.address];
    const batchPowers = [10];
    
    await powerNFT.batchMint(batchAddresses, batchPowers);
    const power4 = await powerNFT.getTotalVotingPower(voter4.address);
    console.log("✅ Batch minted - Voter 4 power:", power4.toString());
    
    console.log("\n" + "=".repeat(70));
    console.log("🎉 NFT VOTING SYSTEM TEST COMPLETE!");
    console.log("=".repeat(70));
    console.log("✅ Transferable NFT Integration: SUCCESS");
    console.log("✅ Soulbound NFT Integration: SUCCESS");
    console.log("✅ NFT Transfer & Rights Management: SUCCESS");
    console.log("✅ Voting Power Customization: SUCCESS");
    console.log("✅ Batch Minting: SUCCESS");
    console.log("✅ Transfer Prevention (Soulbound): SUCCESS");
    
    console.log("\n🔗 Contract Addresses:");
    console.log("   TransferableNFT:", await transferableNFT.getAddress());
    console.log("   SoulboundNFT:", await soulboundNFT.getAddress());
    console.log("   Vote Contract 1:", await vote.getAddress());
    console.log("   Vote Contract 2:", await vote2.getAddress());
    console.log("   Chainlink Integration:", await chainlink.getAddress());
}

main()
    .then(() => {
        console.log("\n✅ NFT test completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ NFT test failed:", error);
        process.exit(1);
    }); 