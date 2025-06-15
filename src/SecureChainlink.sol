// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SecureChainlinkIntegration
 * @dev Enhanced mock integration with better randomness for testing
 * @notice Uses multiple entropy sources and commit-reveal for security
 */
contract SecureChainlinkIntegration is Ownable {
    
    // Enhanced randomness tracking
    mapping(address => uint256) public randomResults;
    mapping(address => bool) public pendingRequests;
    mapping(address => uint256) private commitments; // For commit-reveal
    mapping(address => uint256) private reveals;
    
    // Historical entropy accumulator
    uint256 private entropyAccumulator;
    uint256 private requestCounter;
    
    // Automation Configuration
    struct AutomationConfig {
        address voteContract;
        uint256 voteEndTime;
        bool isActive;
        bool executed;
    }
    
    mapping(address => AutomationConfig) public automationConfigs;
    address[] public activeVoteContracts;
    
    // Events
    event RandomnessRequested(address indexed voteContract, uint256 indexed requestId);
    event RandomnessReceived(address indexed voteContract, uint256 indexed requestId, uint256 randomNumber);
    event AutomationConfigured(address indexed voteContract, uint256 voteEndTime);
    event VoteEnded(address indexed voteContract, uint256 randomNumber);
    event CommitSubmitted(address indexed voteContract, bytes32 commitment);
    event RandomnessRevealed(address indexed voteContract, uint256 reveal, uint256 finalRandom);

    constructor() Ownable(msg.sender) {
        // Initialize entropy accumulator with deployment block data
        entropyAccumulator = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.coinbase,
            tx.gasprice,
            msg.sender
        )));
    }

    /**
     * @dev Enhanced random number request with commit-reveal scheme
     * @param voteContract Address of the vote contract requesting randomness
     */
    function requestRandomWinner(address voteContract) external returns (uint256 requestId) {
        require(!pendingRequests[voteContract], "Request already pending for this vote");
        
        requestCounter++;
        requestId = requestCounter;
        
        pendingRequests[voteContract] = true;
        
        // Start commit-reveal process
        _initiateCommitReveal(voteContract, requestId);
        
        emit RandomnessRequested(voteContract, requestId);
        return requestId;
    }

    /**
     * @dev Initiate commit-reveal process for better randomness
     */
    function _initiateCommitReveal(address voteContract, uint256 requestId) internal {
        // Generate commitment using multiple entropy sources
        bytes32 commitment = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.gaslimit,
            tx.origin,
            msg.sender,
            voteContract,
            requestId,
            entropyAccumulator,
            blockhash(block.number - 1), // Previous block hash
            address(this).balance,
            gasleft()
        ));
        
        commitments[voteContract] = uint256(commitment);
        emit CommitSubmitted(voteContract, commitment);
        
        // Simulate async behavior - would be replaced by oracle in real implementation
        _revealAndProcess(voteContract, requestId);
    }

    /**
     * @dev Reveal phase with additional entropy
     */
    function _revealAndProcess(address voteContract, uint256 requestId) internal {
        // Add more entropy from current block (different from commit block)
        uint256 reveal = uint256(keccak256(abi.encodePacked(
            block.timestamp + 1, // Slightly different time
            block.prevrandao,
            blockhash(block.number), // Current block hash
            entropyAccumulator,
            commitments[voteContract],
            requestId
        )));
        
        reveals[voteContract] = reveal;
        
        // Combine commit and reveal for final randomness
        uint256 finalRandom = uint256(keccak256(abi.encodePacked(
            commitments[voteContract],
            reveal,
            _getAdditionalEntropy()
        )));
        
        // Update entropy accumulator for future requests
        entropyAccumulator = uint256(keccak256(abi.encodePacked(
            entropyAccumulator,
            finalRandom,
            block.timestamp
        )));
        
        randomResults[voteContract] = finalRandom;
        pendingRequests[voteContract] = false;
        
        emit RandomnessRevealed(voteContract, reveal, finalRandom);
        emit RandomnessReceived(voteContract, requestId, finalRandom);
        
        // Call the vote contract to process the winner selection
        (bool success, ) = voteContract.call(
            abi.encodeWithSignature("processRandomWinner(uint256)", finalRandom)
        );
        require(success, "Failed to process random winner");
    }

    /**
     * @dev Get additional entropy from various blockchain sources
     */
    function _getAdditionalEntropy() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.coinbase,
            block.gaslimit,
            tx.gasprice,
            msg.sender,
            address(this).balance,
            gasleft(),
            blockhash(block.number - 1),
            blockhash(block.number - 2), // Two blocks back
            requestCounter
        )));
    }

    /**
     * @dev Configure automation for a vote contract
     */
    function configureAutomation(address voteContract, uint256 voteEndTime) external {
        require(voteEndTime > block.timestamp, "End time must be in the future");
        
        automationConfigs[voteContract] = AutomationConfig({
            voteContract: voteContract,
            voteEndTime: voteEndTime,
            isActive: true,
            executed: false
        });
        
        activeVoteContracts.push(voteContract);
        
        emit AutomationConfigured(voteContract, voteEndTime);
    }

    /**
     * @dev Enhanced upkeep function with additional security checks
     */
    function performUpkeep(address voteContract) external {
        AutomationConfig storage config = automationConfigs[voteContract];
        
        require(config.isActive, "Vote is not active");
        require(!config.executed, "Vote already executed");
        require(block.timestamp >= config.voteEndTime, "Vote has not ended yet");
        
        config.executed = true;
        config.isActive = false;
        
        // End the vote first, then process winner
        (bool success, ) = voteContract.call(
            abi.encodeWithSignature("endVoteAutomatically()")
        );
        require(success, "Failed to end vote");
        
        emit VoteEnded(voteContract, 0);
    }

    /**
     * @dev Emergency function to add external entropy (only owner)
     */
    function addExternalEntropy(bytes32 entropy) external onlyOwner {
        entropyAccumulator = uint256(keccak256(abi.encodePacked(
            entropyAccumulator,
            entropy,
            block.timestamp
        )));
    }

    /**
     * @dev Get randomness quality metrics
     */
    function getRandomnessMetrics(address voteContract) external view returns (
        uint256 commitment,
        uint256 reveal,
        uint256 finalRandom,
        uint256 entropyLevel
    ) {
        return (
            commitments[voteContract],
            reveals[voteContract],
            randomResults[voteContract],
            entropyAccumulator
        );
    }

    // Standard view functions
    function getRandomResult(address voteContract) external view returns (uint256) {
        return randomResults[voteContract];
    }

    function hasPendingRequest(address voteContract) external view returns (bool) {
        return pendingRequests[voteContract];
    }

    function getAutomationConfig(address voteContract) external view returns (AutomationConfig memory) {
        return automationConfigs[voteContract];
    }

    function getActiveVoteContracts() external view returns (address[] memory) {
        return activeVoteContracts;
    }
} 