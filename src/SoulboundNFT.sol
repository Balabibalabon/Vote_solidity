// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Note: Counters removed in newer OpenZeppelin versions, using manual counter instead
import "./INFTVoting.sol";

/**
 * @title SoulboundNFT
 * @notice ERC5192 implementation for non-transferable voting rights tokens (soulbound)
 */
contract SoulboundNFT is ERC721, ERC721URIStorage, Ownable, INFTVoting {
    uint256 public _tokenIds;
    
    string public voteName;
    string public rewardDescription;
    
    // Mapping to track if an address has voting rights
    mapping(address => bool) public hasVotingRights;
    
    // Mapping to track token holders
    mapping(uint256 => address) public tokenHolders;
    
    // Implement ERC-5192 interface
    bytes4 private constant INTERFACE_ID_ERC5192 = 0xb45a3c0e;
    
    // Event emitted when a holder is added
    event HolderAdded(address indexed holder, uint256 tokenId);
    
    // Event emitted when a winner is rewarded
    event WinnerRewarded(address indexed winner, uint256 tokenId);
    
    // ERC-5192 event
    event Locked(uint256 tokenId);
    
    constructor(string memory _voteName, string memory _rewardDescription) 
        ERC721("SoulboundVoteNFT", "SVNFT") 
        Ownable(msg.sender)
    {
        voteName = _voteName;
        rewardDescription = _rewardDescription;
    }
    
    /**
     * @notice Add a holder and grant them a soulbound NFT for voting rights
     * @param holder Address to receive the NFT
     * @return The token ID of the minted NFT
     */
    function addHolder(address holder) external onlyOwner returns (uint256) {
        require(!hasVotingRights[holder], "Address already has voting rights");
        
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        _mint(holder, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(voteName, " Voting Rights")));
        
        hasVotingRights[holder] = true;
        tokenHolders[tokenId] = holder;
        
        // Lock the token (make it soulbound)
        emit Locked(tokenId);
        
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
        for (uint256 i = 1; i <= _tokenIds; i++) {
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
     * @notice ERC-5192 interface implementation for checking if a token is locked
     * @param tokenId The token ID to check
     * @return Always returns true as all tokens are soulbound
     */
    function locked(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return true; // All tokens are permanently locked
    }
    
    /**
     * @notice Override transfer functions to prevent transfers
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting, but prevent transfers
        require(from == address(0) || to == address(0), "Token transfer is not allowed");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @notice Implementation of ERC-165 interface detection
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return 
            interfaceId == INTERFACE_ID_ERC5192 ||
            super.supportsInterface(interfaceId);
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
} 