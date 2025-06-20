// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockVRFCoordinator
 * @dev Mock VRF Coordinator for local testing of ChainlinkVRF integration
 * @notice This contract simulates the Chainlink VRF Coordinator for development and testing
 */
contract MockVRFCoordinator {
    
    mapping(uint256 => address) public requestToSender;
    mapping(uint256 => bool) public pendingRequests;
    uint256 public requestCounter = 1;
    
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords);
    
    /**
     * @dev Mock implementation of requestRandomWords
     * @param keyHash The gas lane key hash value
     * @param subId The subscription ID that this contract uses for funding requests
     * @param minimumRequestConfirmations How many blocks you'd like the oracle to wait
     * @param callbackGasLimit How much gas you want to use for the callback
     * @param numWords The number of uint256 random values you'd like to receive
     * @return requestId The ID of the VRF request
     */
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = requestCounter++;
        requestToSender[requestId] = msg.sender;
        pendingRequests[requestId] = true;
        
        emit RandomWordsRequested(
            keyHash,
            requestId,
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
        
        // Simulate immediate fulfillment (in real VRF, this would be delayed)
        _fulfillRandomWords(requestId, numWords);
        
        return requestId;
    }
    
    /**
     * @dev Internal function to fulfill random words request
     * @param requestId The ID of the VRF request
     * @param numWords Number of random words to generate
     */
    function _fulfillRandomWords(uint256 requestId, uint32 numWords) internal {
        require(pendingRequests[requestId], "Request not found");
        require(requestToSender[requestId] != address(0), "Invalid request");
        
        address consumer = requestToSender[requestId];
        pendingRequests[requestId] = false;
        
        // Generate mock random words
        uint256[] memory randomWords = new uint256[](numWords);
        for (uint32 i = 0; i < numWords; i++) {
            randomWords[i] = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                requestId,
                i,
                consumer
            )));
        }
        
        emit RandomWordsFulfilled(requestId, randomWords);
        
        // Call fulfillRandomWords on the consumer contract
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("fulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "Fulfillment callback failed");
    }
    
    /**
     * @dev Manual fulfillment for testing purposes
     * @param requestId The ID of the VRF request to fulfill
     * @param numWords Number of random words to generate
     */
    function fulfillRequest(uint256 requestId, uint32 numWords) external {
        require(pendingRequests[requestId], "Request not pending");
        _fulfillRandomWords(requestId, numWords);
    }
    
    /**
     * @dev Get the address that made a specific request
     * @param requestId The ID of the VRF request
     * @return The address of the requester
     */
    function getRequester(uint256 requestId) external view returns (address) {
        return requestToSender[requestId];
    }
    
    /**
     * @dev Check if a request is pending
     * @param requestId The ID of the VRF request
     * @return True if the request is pending
     */
    function isPending(uint256 requestId) external view returns (bool) {
        return pendingRequests[requestId];
    }
    
    /**
     * @dev Get the current request counter
     * @return The next request ID that will be assigned
     */
    function getNextRequestId() external view returns (uint256) {
        return requestCounter;
    }
} 