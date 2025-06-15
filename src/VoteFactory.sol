// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {Vote} from "./Vote.sol";
import {TransferableNFT} from "./TransferableNFT.sol";
import {SoulboundNFT} from "./SoulboundNFT.sol";
import {ChainlinkIntegration} from "./Chainlink.sol";

contract VoteFactory {
    Vote newVote;
    address private VoteAddress;
    address[] private VoteItemList;
    
    // Chainlink Integration
    ChainlinkIntegration public chainlinkIntegration;

    event VoteCreated();
    event ChainlinkIntegrationSet(address chainlinkAddress);

    constructor() {}
    
    // Set Chainlink integration contract
    function setChainlinkIntegration(address _chainlinkIntegration) external {
        chainlinkIntegration = ChainlinkIntegration(_chainlinkIntegration);
        emit ChainlinkIntegrationSet(_chainlinkIntegration);
    }

    function createVote(
        string memory _VoteName,
        string memory _VoteDescribtion,
        uint8 _totalOptions
    ) public payable {
        createVoteWithChainlink(_VoteName, _VoteDescribtion, _totalOptions, 24, false);
    }
    
    function createVoteWithChainlink(
        string memory _VoteName,
        string memory _VoteDescribtion,
        uint8 _totalOptions,
        uint256 _voteDurationInHours,
        bool _useRandomWinner
    ) public payable {
        // Create NFT contract for this vote
        TransferableNFT nftContract = new TransferableNFT(_VoteName, "VOTE");
        
        newVote = new Vote(
            _VoteName, 
            _VoteDescribtion, 
            _totalOptions, 
            address(nftContract),
            address(chainlinkIntegration),
            _voteDurationInHours,
            _useRandomWinner
        );
        VoteAddress = address(newVote);
        
        // Transfer NFT contract ownership to vote contract
        nftContract.transferOwnership(VoteAddress);
        
        approve();

        VoteItemList.push(VoteAddress);
        emit VoteCreated();
    }

    function approve() public {
        // 發起項目者需要 approve 項目合約能夠使用他的 eth 來發送獎金
    }
    
    // Getter functions
    function getVoteList() public view returns (address[] memory) {
        return VoteItemList;
    }
    
    function getLatestVote() public view returns (address) {
        require(VoteItemList.length > 0, "No votes created yet");
        return VoteItemList[VoteItemList.length - 1];
    }
}
