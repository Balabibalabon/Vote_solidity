// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainlinkIntegration
 * @dev Integrates Chainlink VRF for random winner selection and Chainlink Automation for vote management
 */
contract ChainlinkIntegration is VRFConsumerBaseV2, AutomationCompatibleInterface, Ownable {
    
    // Chainlink VRF Configuration
    VRFCoordinatorV2Interface immutable COORDINATOR;
    uint64 private s_subscriptionId;
    bytes32 private s_keyHash;
    uint32 private s_callbackGasLimit = 2500000;
    uint16 private s_requestConfirmations = 3;
    uint32 private s_numWords = 1;

    // VRF Request tracking
    mapping(uint256 => address) public requestToVoteContract;
    mapping(address => uint256) public voteContractToRequest;
    mapping(address => uint256) public randomResults;
    mapping(address => bool) public pendingRequests;

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

    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
    }

    /**
     * @dev Request random number for vote winner selection
     * @param voteContract Address of the vote contract requesting randomness
     */
    function requestRandomWinner(address voteContract) external returns (uint256 requestId) {
        require(!pendingRequests[voteContract], "Request already pending for this vote");
        
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            s_requestConfirmations,
            s_callbackGasLimit,
            s_numWords
        );
        
        requestToVoteContract[requestId] = voteContract;
        voteContractToRequest[voteContract] = requestId;
        pendingRequests[voteContract] = true;
        
        emit RandomnessRequested(voteContract, requestId);
        return requestId;
    }

    /**
     * @dev Chainlink VRF callback function
     * @param requestId The ID of the VRF request
     * @param randomWords Array of random numbers
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address voteContract = requestToVoteContract[requestId];
        require(voteContract != address(0), "Invalid request ID");
        
        uint256 randomNumber = randomWords[0];
        randomResults[voteContract] = randomNumber;
        pendingRequests[voteContract] = false;
        
        emit RandomnessReceived(voteContract, requestId, randomNumber);
        
        // Call the vote contract to process the winner selection
        (bool success, ) = voteContract.call(
            abi.encodeWithSignature("processRandomWinner(uint256)", randomNumber)
        );
        require(success, "Failed to process random winner");
    }

    /**
     * @dev Configure automation for a vote contract
     * @param voteContract Address of the vote contract
     * @param voteEndTime Timestamp when the vote should end
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
     * @dev Chainlink Automation checkUpkeep function
     * @param checkData Additional data for upkeep check
     * @return upkeepNeeded Whether upkeep is needed
     * @return performData Data to pass to performUpkeep
     */
    function checkUpkeep(bytes calldata checkData) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        upkeepNeeded = false;
        address[] memory contractsToEnd = new address[](activeVoteContracts.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeVoteContracts.length; i++) {
            address voteContract = activeVoteContracts[i];
            AutomationConfig memory config = automationConfigs[voteContract];
            
            if (config.isActive && 
                !config.executed && 
                block.timestamp >= config.voteEndTime) {
                contractsToEnd[count] = voteContract;
                count++;
                upkeepNeeded = true;
            }
        }
        
        if (upkeepNeeded) {
            // Resize array to actual count
            address[] memory finalContracts = new address[](count);
            for (uint256 i = 0; i < count; i++) {
                finalContracts[i] = contractsToEnd[i];
            }
            performData = abi.encode(finalContracts);
        }
        
        return (upkeepNeeded, performData);
    }

    /**
     * @dev Chainlink Automation performUpkeep function
     * @param performData Data from checkUpkeep
     */
    function performUpkeep(bytes calldata performData) external override {
        address[] memory contractsToEnd = abi.decode(performData, (address[]));
        
        for (uint256 i = 0; i < contractsToEnd.length; i++) {
            address voteContract = contractsToEnd[i];
            AutomationConfig storage config = automationConfigs[voteContract];
            
            if (config.isActive && 
                !config.executed && 
                block.timestamp >= config.voteEndTime) {
                
                config.executed = true;
                config.isActive = false;
                
                // Request random number for winner selection
                uint256 requestId = requestRandomWinner(voteContract);
                
                emit VoteEnded(voteContract, requestId);
            }
        }
    }

    /**
     * @dev Get random result for a vote contract
     * @param voteContract Address of the vote contract
     * @return Random number result
     */
    function getRandomResult(address voteContract) external view returns (uint256) {
        return randomResults[voteContract];
    }

    /**
     * @dev Check if a vote contract has a pending randomness request
     * @param voteContract Address of the vote contract
     * @return True if request is pending
     */
    function hasPendingRequest(address voteContract) external view returns (bool) {
        return pendingRequests[voteContract];
    }

    /**
     * @dev Get automation configuration for a vote contract
     * @param voteContract Address of the vote contract
     * @return AutomationConfig struct
     */
    function getAutomationConfig(address voteContract) external view returns (AutomationConfig memory) {
        return automationConfigs[voteContract];
    }

    /**
     * @dev Get all active vote contracts
     * @return Array of active vote contract addresses
     */
    function getActiveVoteContracts() external view returns (address[] memory) {
        return activeVoteContracts;
    }

    /**
     * @dev Emergency stop automation for a vote contract (only owner)
     * @param voteContract Address of the vote contract
     */
    function emergencyStopAutomation(address voteContract) external onlyOwner {
        automationConfigs[voteContract].isActive = false;
    }

    /**
     * @dev Update VRF configuration (only owner)
     * @param subscriptionId New subscription ID
     * @param keyHash New key hash
     * @param callbackGasLimit New callback gas limit
     */
    function updateVRFConfig(
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit
    ) external onlyOwner {
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
        s_callbackGasLimit = callbackGasLimit;
    }

    /**
     * @dev Clean up completed vote contracts from active list (only owner)
     */
    function cleanupCompletedVotes() external onlyOwner {
        address[] memory newActiveContracts = new address[](activeVoteContracts.length);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < activeVoteContracts.length; i++) {
            address voteContract = activeVoteContracts[i];
            if (automationConfigs[voteContract].isActive) {
                newActiveContracts[activeCount] = voteContract;
                activeCount++;
            }
        }
        
        // Replace with cleaned array
        delete activeVoteContracts;
        for (uint256 i = 0; i < activeCount; i++) {
            activeVoteContracts.push(newActiveContracts[i]);
        }
    }
} 