// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Note: Counters removed in newer OpenZeppelin versions, using manual counter instead
import "./INFTVoting.sol";

/**
 * @title IVote
 * @notice Interface for Vote contract to transfer vote records
 */
interface IVote {
    function transferVoteRecord(address from, address to) external;
}

/**
 * @title TransferableNFT
 * @notice ERC-721 contract for tradeable voting rights tokens
 */
contract TransferableNFT is ERC721, ERC721URIStorage, Ownable, INFTVoting {
    uint256 public _tokenIds;
    
    string public voteName;
    string public rewardDescription;
    
    // Voting power for each token (can be customized)
    mapping(uint256 => uint256) public tokenVotingPower;
    
    // Mapping to track if an address has voting rights
    mapping(address => bool) public hasVotingRights;
    
    // Mapping to track token holders
    mapping(uint256 => address) public tokenHolders;
    
    // Default voting power for new tokens
    uint256 public constant DEFAULT_VOTING_POWER = 1;
    
    // Address of the associated Vote contract for transferring vote records
    address public voteContract;
    
    // Event emitted when a holder is added
    event HolderAdded(address indexed holder, uint256 tokenId, uint256 votingPower);
    
    // Event emitted when a winner is rewarded
    event WinnerRewarded(address indexed winner, uint256 tokenId);
    
    // Event emitted when voting power is updated
    event VotingPowerUpdated(uint256 indexed tokenId, uint256 oldPower, uint256 newPower);
    
    constructor(string memory _voteName, string memory _rewardDescription) 
        ERC721("TransferableVoteNFT", "TVNFT") 
        Ownable(msg.sender)
    {
        voteName = _voteName;
        rewardDescription = _rewardDescription;
    }
    
    /**
     * @notice Add a holder and grant them a transferable NFT for voting rights
     * @param holder Address to receive the NFT
     * @return The token ID of the minted NFT
     */
    function addHolder(address holder) external onlyOwner returns (uint256) {
        return addHolderWithPower(holder, DEFAULT_VOTING_POWER);
    }
    
    /**
     * @notice Add a holder with custom voting power
     * @param holder Address to receive the NFT
     * @param votingPower Custom voting power for this token
     * @return The token ID of the minted NFT
     */
    function addHolderWithPower(address holder, uint256 votingPower) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        _mint(holder, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(voteName, " Voting Rights #", _toString(tokenId))));
        
        tokenVotingPower[tokenId] = votingPower;
        hasVotingRights[holder] = true;
        tokenHolders[tokenId] = holder;
        
        emit HolderAdded(holder, tokenId, votingPower);
        
        return tokenId;
    }
    
    /**
     * @notice Batch mint NFTs to multiple addresses
     * @param holders Array of addresses to receive NFTs
     * @param powers Array of voting powers for each NFT
     */
    function batchMint(address[] calldata holders, uint256[] calldata powers) external onlyOwner {
        require(holders.length == powers.length, "Arrays length mismatch");
        
        for (uint i = 0; i < holders.length; i++) {
            addHolderWithPower(holders[i], powers[i]);
        }
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
            if (ownerOf(i) == winner) {
                winnerTokenId = i;
                break;
            }
        }
        
        require(winnerTokenId > 0, "Winner token not found");
        
        // Update token URI to reflect winner status
        _setTokenURI(winnerTokenId, string(abi.encodePacked(voteName, " Winner #", _toString(winnerTokenId), " - ", rewardDescription)));
        
        emit WinnerRewarded(winner, winnerTokenId);
    }

    /**
     * @notice Override _update to handle voting rights on transfers
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Update voting rights when tokens are transferred
        if (from != address(0)) {
            // Remove voting rights from previous owner if they have no more tokens
            if (balanceOf(from) == 1) { // Will be 0 after transfer
                hasVotingRights[from] = false;
                
                // Transfer vote record to new owner if vote contract is set
                if (to != address(0) && voteContract != address(0)) {
                    try IVote(voteContract).transferVoteRecord(from, to) {
                        // Vote record transferred successfully
                    } catch {
                        // Vote transfer failed (voting may be closed or no record exists)
                        // This is not critical, so we continue with the NFT transfer
                    }
                }
            }
        }
        
        if (to != address(0)) {
            // Grant voting rights to new owner
            hasVotingRights[to] = true;
            tokenHolders[tokenId] = to;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Set the associated vote contract address (only owner)
     * @param _voteContract Address of the Vote contract
     */
    function setVoteContract(address _voteContract) external onlyOwner {
        voteContract = _voteContract;
    }
    
    /**
     * @notice Override transferOwnership to resolve conflict with INFTVoting interface
     */
    function transferOwnership(address newOwner) public override(Ownable, INFTVoting) onlyOwner {
        super.transferOwnership(newOwner);
    }
    
    /**
     * @notice Get voting power for a specific token
     * @param tokenId The token ID to check
     * @return Voting power of the token
     */
    function getTokenVotingPower(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenVotingPower[tokenId];
    }
    
    /**
     * @notice Get total voting power for an address
     * @param holder Address to check
     * @return Total voting power across all tokens owned
     */
    function getTotalVotingPower(address holder) external view returns (uint256) {
        uint256 totalPower = 0;
        uint256 balance = balanceOf(holder);
        
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (ownerOf(i) == holder) {
                totalPower += tokenVotingPower[i];
            }
        }
        
        return totalPower;
    }
    
    /**
     * @notice Update voting power for a token (only owner)
     * @param tokenId Token ID to update
     * @param newPower New voting power value
     */
    function updateTokenVotingPower(uint256 tokenId, uint256 newPower) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        uint256 oldPower = tokenVotingPower[tokenId];
        tokenVotingPower[tokenId] = newPower;
        
        emit VotingPowerUpdated(tokenId, oldPower, newPower);
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
        return super.supportsInterface(interfaceId);
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
    
    /**
     * @notice Convert uint256 to string (internal utility)
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
} 