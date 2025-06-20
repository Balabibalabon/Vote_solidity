// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./INFTVoting.sol";
import "./Chainlink.sol";

abstract contract VoteBone {
    function EndVote() external {}

    function GetWinner() internal {}

    function GiveRewards() internal {}
}

contract Vote is VoteBone {
    //////////////////////
    /// State variable ///
    /////////////////////

    enum state {
        Open,
        Close
    } // 1 跟 2 比較便宜，節省 gas 可以考慮

    state private VoteState;
    string public i_VoteName;
    string public i_VoteDescribtion;
    uint8 public immutable totalOptions;
    mapping(address => uint8) public votersRecord;
    uint256[] public totalRecord;
    
    // NFT Voting Integration
    INFTVoting public nftVotingContract;
    
    // Chainlink Integration
    ChainlinkIntegration public chainlinkIntegration;
    uint256 public voteEndTime;
    bool public useRandomWinner;

    /////////////
    /// event ///
    /////////////
    event Voted(address indexed voter, uint8 choice);
    event VoteChanged(address indexed voter, uint8 fromChoice, uint8 toChoice);
    event VoteTransferred(address indexed from, address indexed to, uint8 choice);
    event VoteCleared(address indexed voter, uint8 clearedChoice);

    constructor(
        string memory _VoteName,
        string memory _VoteDescribtion,
        uint8 _totalOptions, // 加 factory contract address (owner)，後續串 Endvote
        address _nftVotingContract,
        address _chainlinkIntegration,
        uint256 _voteDurationInHours,
        bool _useRandomWinner
    ) {
        require(_totalOptions > 1, "Need at least 2 options");
        i_VoteName = _VoteName;
        i_VoteDescribtion = _VoteDescribtion;
        totalOptions = _totalOptions;
        totalRecord = new uint256[](_totalOptions + 1); // index 0 保留
        VoteState = state.Open;
        nftVotingContract = INFTVoting(_nftVotingContract);
        
        // Chainlink integration setup
        if (_chainlinkIntegration != address(0)) {
            chainlinkIntegration = ChainlinkIntegration(_chainlinkIntegration);
            voteEndTime = block.timestamp + (_voteDurationInHours * 1 hours);
            useRandomWinner = _useRandomWinner;
            // Configure automation for vote end
            chainlinkIntegration.configureAutomation(address(this), voteEndTime);
        }
        
        // 讓工廠合約 approve 將項目發起者的資金轉移到子帳戶，最後由子帳戶發送獎金，目前暫定 eth
    }

    /////////////////
    /// modifier ///
    ////////////////

    modifier Votecheck(uint8 _choice) {
        require(VoteState == state.Open, "Vote is not open");
        require(_choice >= 1 && _choice <= totalOptions, "Invalid choice");
        _;
    }

    modifier verifyNoVotingRecord() {
        if (votersRecord[msg.sender] > 0) {
            revert("You have voted before!");
        } else {
            _;
        }
    }

    modifier verifyHaveVotedRecord() {
        if (votersRecord[msg.sender] == 0) {
            revert("You have not voted before!");
        } else {
            _;
        }
    }

    /////////////////
    /// function ///
    ////////////////

    function vote(
        uint8 _choice
    ) external verifyNoVotingRecord Votecheck(_choice) {
        votersRecord[msg.sender] = _choice;
        totalRecord[_choice] += 1;
        
        // Grant NFT voting rights to voter
        if (address(nftVotingContract) != address(0)) {
            nftVotingContract.addHolder(msg.sender);
        }
        
        emit Voted(msg.sender, _choice);
    }

    function changevote(
        uint8 _choice
    ) external verifyHaveVotedRecord Votecheck(_choice) {
        uint8 original_choice = UserVoteRecordGetter();
        if (_choice == original_choice) {
            revert("Vote the same option");
        } else {
            votersRecord[msg.sender] = _choice;
            totalRecord[original_choice] -= 1;
            totalRecord[_choice] += 1;
        }
    }

    ///////////////
    /// Getter ///
    //////////////

    function UserVoteRecordGetter() public view returns (uint8) {
        return votersRecord[msg.sender];
    }

    function TotalVoteRecordGetter() public view returns (uint256[] memory) {
        return totalRecord;
    }
    
    // Winner selection and NFT reward functions
    function determineWinner() public view returns (uint8) {
        require(VoteState == state.Close, "Vote is not closed yet");
        uint256 maxVotes = 0;
        uint8 winner = 1;
        
        for (uint8 i = 1; i <= totalOptions; i++) {
            if (totalRecord[i] > maxVotes) {
                maxVotes = totalRecord[i];
                winner = i;
            }
        }
        
        return winner;
    }
    
    // Chainlink VRF callback function
    function processRandomWinner(uint256 randomNumber) external {
        require(msg.sender == address(chainlinkIntegration), "Only Chainlink can call this");
        require(VoteState == state.Close, "Vote must be closed");
        
        if (useRandomWinner) {
            _selectRandomWinner(randomNumber);
        } else {
            _selectHighestVoteWinner();
        }
    }
    
    function _selectRandomWinner(uint256 randomNumber) internal {
        uint256 totalVotes = getTotalVotes();
        require(totalVotes > 0, "No votes cast");
        
        uint256 randomIndex = randomNumber % totalVotes;
        uint256 currentSum = 0;
        
        for (uint8 i = 1; i <= totalOptions; i++) {
            currentSum += totalRecord[i];
            if (randomIndex < currentSum) {
                _rewardWinners(i);
                break;
            }
        }
    }
    
    function _selectHighestVoteWinner() internal {
        uint8 winningOption = determineWinner();
        _rewardWinners(winningOption);
    }
    
    function _rewardWinners(uint8 winningOption) internal {
        // Mark winner in NFT contract
        if (address(nftVotingContract) != address(0)) {
            // In real implementation, you'd iterate through voters and reward winners
            // For now, this is a placeholder for the winner reward logic
        }
    }
    
    function getTotalVotes() public view returns (uint256) {
        uint256 total = 0;
        for (uint8 i = 1; i <= totalOptions; i++) {
            total += totalRecord[i];
        }
        return total;
    }
    
    function rewardWinner() external {
        require(VoteState == state.Close, "Vote is not closed yet");
        
        if (address(chainlinkIntegration) != address(0) && useRandomWinner) {
            chainlinkIntegration.requestRandomWinner(address(this));
        } else {
            _selectHighestVoteWinner();
        }
    }
    
    /**
     * @dev End the vote manually (only callable after end time)
     */
    function endVote() external {
        require(VoteState == state.Open, "Vote is already closed");
        require(block.timestamp >= voteEndTime, "Vote has not ended yet");
        
        VoteState = state.Close;
        _processVoteEnd();
    }
    
    /**
     * @dev End vote automatically (called by Chainlink automation)
     */
    function endVoteAutomatically() external {
        require(msg.sender == address(chainlinkIntegration), "Only Chainlink can call this");
        require(VoteState == state.Open, "Vote is already closed");
        
        VoteState = state.Close;
        _processVoteEnd();
    }
    
    /**
     * @dev Internal function to process vote ending
     */
    function _processVoteEnd() internal {
        if (address(chainlinkIntegration) != address(0) && useRandomWinner) {
            chainlinkIntegration.requestRandomWinner(address(this));
        } else {
            _selectHighestVoteWinner();
        }
    }

    /**
     * @dev Transfer vote record when NFT is transferred (called by NFT contract)
     * @param from Previous voter address
     * @param to New voter address
     */
    function transferVoteRecord(address from, address to) external {
        require(msg.sender == address(nftVotingContract), "Only NFT contract can call this");
        require(VoteState == state.Open, "Cannot transfer votes after voting ends");
        
        // Get the vote record from the previous holder
        uint8 voteChoice = votersRecord[from];
        
        // Only transfer if there was a vote record
        if (voteChoice > 0) {
            // Remove vote record from previous holder
            votersRecord[from] = 0;
            
            // Transfer vote record to new holder
            votersRecord[to] = voteChoice;
            
            // Note: totalRecord doesn't change since the vote just transferred ownership
            // The vote count remains the same, just under different ownership
            
            emit VoteTransferred(from, to, voteChoice);
        }
    }

    /**
     * @dev Clear inherited vote record (only for current NFT holders)
     * @dev Allows new NFT owners to start fresh if they disagree with inherited vote
     */
    function clearInheritedVote() external {
        require(VoteState == state.Open, "Vote is not open");
        require(address(nftVotingContract) != address(0), "No NFT integration");
        require(INFTVoting(nftVotingContract).hasVotingRights(msg.sender), "No voting rights");
        
        uint8 currentVote = votersRecord[msg.sender];
        require(currentVote > 0, "No vote to clear");
        
        // Clear the vote record and decrease total count
        votersRecord[msg.sender] = 0;
        totalRecord[currentVote] -= 1;
        
        emit VoteCleared(msg.sender, currentVote);
    }
}
