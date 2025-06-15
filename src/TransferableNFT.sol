// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./INFTVoting.sol";

/**
 * @title TransferableNFT
 * @notice ERC721 implementation for voting rights that can be transferred
 */
contract TransferableNFT is ERC721, ERC721URIStorage, Ownable, INFTVoting {
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;
    
    string public voteName;
    string public rewardDescription;
    
    // Mapping to track if an address has voting rights
    mapping(address => bool) public hasVotingRights;
    
    // Mapping to track token holders
    mapping(uint256 => address) public tokenHolders;
    
    // Event emitted when a holder is added
    event HolderAdded(address indexed holder, uint256 tokenId);
    
    // Event emitted when a winner is rewarded
    event WinnerRewarded(address indexed winner, uint256 tokenId);
    
    constructor(string memory _voteName, string memory _rewardDescription) 
        ERC721("VoteNFT", "VNFT") 
        Ownable(msg.sender)
    {
        voteName = _voteName;
        rewardDescription = _rewardDescription;
    }
    
    /**
     * @notice Add a holder and grant them an NFT for voting rights
     * @param holder Address to receive the NFT
     * @return The token ID of the minted NFT
     */
    function addHolder(address holder) external onlyOwner returns (uint256) {
        require(!hasVotingRights[holder], "Address already has voting rights");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _mint(holder, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(voteName, " Voting Rights")));
        
        hasVotingRights[holder] = true;
        tokenHolders[tokenId] = holder;
        
        emit HolderAdded(holder, tokenId);
        
        return tokenId;
    }
    
    /**
     * @notice Mark the winning token with special metadata
     * @param winner Address of the winner
     */
    function returnWinner(address winner) external onlyOwner {
        require(hasVotingRights[winner], "Winner must have voting rights");
        
        // Find winner's token
        uint256 winnerTokenId = 0;
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (tokenHolders[i] == winner) {
                winnerTokenId = i;
                break;
            }
        }
        
        require(winnerTokenId > 0, "Winner token not found");
        
        // Update token URI to reflect winner status
        _setTokenURI(winnerTokenId, string(abi.encodePacked(voteName, " Winner - ", rewardDescription)));
        
        emit WinnerRewarded(winner, winnerTokenId);
    }
    
    /**
     * @notice Update token holder information when tokens are transferred
     * @param from Address sending the token
     * @param to Address receiving the token
     * @param tokenId The token ID being transferred
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
        
        // Skip during minting (from == 0)
        if (from != address(0)) {
            hasVotingRights[from] = false;
        }
        
        // Update records for the new holder
        hasVotingRights[to] = true;
        tokenHolders[tokenId] = to;
    }
    
    // The following functions are overrides required by Solidity
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 