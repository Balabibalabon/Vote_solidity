// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title INFTVoting
 * @notice Interface for voting NFT contracts
 */
interface INFTVoting {
    /**
     * @notice Add a holder and grant them an NFT for voting rights
     * @param holder Address to receive the NFT
     * @return The token ID of the minted NFT
     */
    function addHolder(address holder) external returns (uint256);
    
    /**
     * @notice Mark the winning token with special metadata
     * @param winner Address of the winner
     */
    function returnWinner(address winner) external;
    
    /**
     * @notice Check if an address has voting rights
     * @param holder Address to check
     * @return True if the address has voting rights
     */
    function hasVotingRights(address holder) external view returns (bool);
    
    /**
     * @notice Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external;
} 