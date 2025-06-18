// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {VoteFactory} from "./VoteFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract Trigger is Ownable, AutomationCompatible {
    uint256 public interval; // 秒
    uint256 public nextTime;

    event IntervalChanged(uint256 newInterval);

    constructor(uint256 _interval) Ownable(msg.sender) {
        interval = _interval;
        nextTime = block.timestamp + _interval;
    }

    function _changeInterval(uint256 _newInterval) external onlyOwner {
        emit IntervalChanged(_newInterval);
        interval = _newInterval;
    }

    function checkUpkeep(
        bytes calldata
    ) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = block.timestamp >= nextTime;
    }

    function performUpkeep(bytes calldata) external override {
        require(block.timestamp >= nextTime, "Too early");
        _doTheThing();
        nextTime = block.timestamp + interval; // 若只想執行一次就把 interval 時間設成無限大. type(uint256).max
    }

    function _doTheThing() internal {
        // 你的業務邏輯
    }
}
