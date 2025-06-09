// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import {Vote} from "./Vote.sol";

contract VoteFactory {
    Vote newVote;
    address private VoteAddress;
    address[] private VoteItemList;

    event VoteCreated();

    constructor() {}

    function createVote(
        string memory _VoteName,
        string memory _VoteDescribtion,
        uint8 _totalOptions
    ) public payable {
        newVote = new Vote(_VoteName, _VoteDescribtion, _totalOptions);
        VoteAddress = address(newVote);
        approve();

        VoteItemList.push(VoteAddress);
        emit VoteCreated();
    }

    function approve() public {
        // 發起項目者需要 approve 項目合約能夠使用他的 eth 來發送獎金
    }
}
