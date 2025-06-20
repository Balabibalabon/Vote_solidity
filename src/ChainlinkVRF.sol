// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainlinkVRF
 * @dev Simplified VRF integration for secure random number generation
 * @notice This contract provides a structure for VRF integration with voting systems
 */
contract ChainlinkVRF is Ownable {
    
    // VRF Configuration
    uint256 private s_subscriptionId;
    bytes32 private s_keyHash;
    address private s_vrfCoordinator;
    uint32 private s_callbackGasLimit = 100000;
    uint16 private s_requestConfirmations = 3;
    uint32 private s_numWords = 1;
    
    // Request tracking
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        address voteContract;
        uint256[] randomWords;
    }
    
    mapping(uint256 => RequestStatus) public s_requests;
    mapping(address => uint256) public voteContractToRequestId;
    mapping(address => uint256) public randomResults;
    uint256[] public requestIds;
    uint256 public lastRequestId;
    uint256 private requestCounter = 1;
    
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
    event RequestSent(uint256 requestId, uint32 numWords, address voteContract);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords, address voteContract);
    event AutomationConfigured(address indexed voteContract, uint256 voteEndTime);
    event VoteEnded(address indexed voteContract, uint256 randomNumber);
    
    /**
     * @dev Constructor for Chainlink VRF integration
     * @param subscriptionId Chainlink VRF subscription ID
     * @param vrfCoordinator Address of the VRF Coordinator
     * @param keyHash The gas lane key hash value
     */
    constructor(
        uint256 subscriptionId,
        address vrfCoordinator,
        bytes32 keyHash
    ) Ownable(msg.sender) {
        s_subscriptionId = subscriptionId;
        s_vrfCoordinator = vrfCoordinator;
        s_keyHash = keyHash;
    }
    
    /**
     * @dev Request random number for vote winner selection
     * @param voteContract Address of the vote contract requesting randomness
     * @return requestId The ID of the VRF request
     */
    function requestRandomWinner(address voteContract) external returns (uint256 requestId) {
        require(voteContract != address(0), "Invalid vote contract");
        require(voteContractToRequestId[voteContract] == 0, "Request already exists for this vote");
        
        // Generate mock request ID for testing
        requestId = requestCounter++;
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            voteContract: voteContract,
            randomWords: new uint256[](0)
        });
        
        voteContractToRequestId[voteContract] = requestId;
        requestIds.push(requestId);
        lastRequestId = requestId;
        
        emit RequestSent(requestId, s_numWords, voteContract);
        
        // For testing, simulate immediate fulfillment
        _simulateFulfillment(requestId, voteContract);
        
        return requestId;
    }
    
    /**
     * @dev Simulate VRF fulfillment for testing
     * @param requestId The ID of the VRF request
     * @param voteContract Address of the vote contract
     */
    function _simulateFulfillment(uint256 requestId, address voteContract) internal {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            requestId,
            voteContract
        )));
        
        RequestStatus storage request = s_requests[requestId];
        request.fulfilled = true;
        request.randomWords = randomWords;
        
        uint256 randomNumber = randomWords[0];
        randomResults[voteContract] = randomNumber;
        
        emit RequestFulfilled(requestId, randomWords, voteContract);
        
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
     * @dev Manual upkeep function to end votes
     * @param voteContract Address of the vote contract to end
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
        
        emit VoteEnded(voteContract, randomResults[voteContract]);
    }
    
    /**
     * @dev Check upkeep for automation (Chainlink Automation compatible)
     * @return upkeepNeeded True if upkeep is needed
     * @return performData Data to pass to performUpkeep
     */
    function checkUpkeep(bytes calldata /* checkData */) external view returns (bool upkeepNeeded, bytes memory performData) {
        address[] memory contractsToEnd = new address[](activeVoteContracts.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeVoteContracts.length; i++) {
            address voteContract = activeVoteContracts[i];
            AutomationConfig memory config = automationConfigs[voteContract];
            
            if (config.isActive && !config.executed && block.timestamp >= config.voteEndTime) {
                contractsToEnd[count] = voteContract;
                count++;
            }
        }
        
        if (count > 0) {
            // Resize array to actual count
            address[] memory result = new address[](count);
            for (uint256 i = 0; i < count; i++) {
                result[i] = contractsToEnd[i];
            }
            upkeepNeeded = true;
            performData = abi.encode(result);
        }
    }
    
    /**
     * @dev Perform upkeep for automation (Chainlink Automation compatible)
     * @param performData Data from checkUpkeep
     */
    function performUpkeep(bytes calldata performData) external {
        address[] memory contractsToEnd = abi.decode(performData, (address[]));
        
        for (uint256 i = 0; i < contractsToEnd.length; i++) {
            _performSingleUpkeep(contractsToEnd[i]);
        }
    }
    
    /**
     * @dev Internal function to perform upkeep for a single contract
     * @param voteContract Address of the vote contract to end
     */
    function _performSingleUpkeep(address voteContract) internal {
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
        
        emit VoteEnded(voteContract, randomResults[voteContract]);
    }
    
    // View functions
    function getRequestStatus(uint256 requestId) external view returns (bool fulfilled, uint256[] memory randomWords, address voteContract) {
        require(s_requests[requestId].exists, "Request not found");
        RequestStatus memory request = s_requests[requestId];
        return (request.fulfilled, request.randomWords, request.voteContract);
    }
    
    function getRandomResult(address voteContract) external view returns (uint256) {
        return randomResults[voteContract];
    }
    
    function getAutomationConfig(address voteContract) external view returns (AutomationConfig memory) {
        return automationConfigs[voteContract];
    }
    
    function getActiveVoteContracts() external view returns (address[] memory) {
        return activeVoteContracts;
    }
    
    // Owner functions
    function setSubscriptionId(uint256 subscriptionId) external onlyOwner {
        s_subscriptionId = subscriptionId;
    }
    
    function setKeyHash(bytes32 keyHash) external onlyOwner {
        s_keyHash = keyHash;
    }
    
    function setVRFCoordinator(address vrfCoordinator) external onlyOwner {
        s_vrfCoordinator = vrfCoordinator;
    }
    
    function setCallbackGasLimit(uint32 callbackGasLimit) external onlyOwner {
        s_callbackGasLimit = callbackGasLimit;
    }
    
    function setRequestConfirmations(uint16 requestConfirmations) external onlyOwner {
        s_requestConfirmations = requestConfirmations;
    }
    
    // Getters for configuration
    function getSubscriptionId() external view returns (uint256) {
        return s_subscriptionId;
    }
    
    function getKeyHash() external view returns (bytes32) {
        return s_keyHash;
    }
    
    function getVRFCoordinator() external view returns (address) {
        return s_vrfCoordinator;
    }
} 