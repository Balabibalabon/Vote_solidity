// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {VoteFactory} from "./VoteFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/* ------------------------------------------------------------- *
 |  投票合約只需實作 endVoteAutomatically() 讓 Trigger 呼叫結算        |
 * ------------------------------------------------------------- */
interface IVote {
    function endVoteAutomatically() external;
}

/* ============================================================= *
    |  Trigger :                                                     |
    |    • registerVote() 時寫入 VoteInfo，並即時更新 nextExecutionAt   |
    |    • checkUpkeep() 只在 block.timestamp ≥ nextExecutionAt 時     |
    |      回傳 true，並把「最早到期的 index」打包進 performData        |
    |    • performUpkeep() 結算該投票 → 標記 done → 重新計算下一筆       |
    * ============================================================= */

contract Trigger is Ownable, AutomationCompatible {
    /* --------- 資料結構 --------- */
    struct VoteInfo {
        address voteContract; // 投票合約位址
        uint64 endTime; // 截止時間（秒）
        bool done; // 是否已結算
    }

    VoteInfo[] public votes; // 投票列表
    uint64 public nextExecutionAt = type(uint64).max;
    // 下一次 Keeper 醒來應該執行的最早時間 (預設無任務 = 最大值)

    /* --------- 事件 --------- */
    event VoteRegistered(address indexed vote, uint64 endTime);
    event VoteExecuted(address indexed vote);

    /* --------- Constructor --------- */
    constructor() Ownable(msg.sender) {}

    /* ========================================================= *
     |                   1. 新投票排程 (onlyOwner)                |
     * ========================================================= */
    function registerVote(
        address voteContract,
        uint64 endTime
    ) external onlyOwner {
        require(endTime > block.timestamp, "end in past");

        votes.push(VoteInfo(voteContract, endTime, false));
        emit VoteRegistered(voteContract, endTime);

        // 📝 如果這張投票比目前紀錄的 nextExecutionAt 更早，就更新
        if (endTime < nextExecutionAt) {
            nextExecutionAt = endTime;
        }
    }

    /* ========================================================= *
     |                   2. Keeper 模擬 checkUpkeep               |
     * ========================================================= */
    function checkUpkeep(
        bytes calldata
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // (1) 時間尚未到 → 不需要喚醒
        if (block.timestamp < nextExecutionAt) {
            return (false, bytes(""));
        }

        // (2) 掃描找出最早且尚未 done 的投票
        uint256 idx;
        uint64 earliest = type(uint64).max;

        for (uint256 i = 0; i < votes.length; i++) {
            if (!votes[i].done && votes[i].endTime < earliest) {
                earliest = votes[i].endTime;
                idx = i;
            }
        }

        // (3) 若沒有任何待處理投票，就回傳 false
        if (earliest == type(uint64).max || block.timestamp < earliest) {
            return (false, bytes(""));
        }

        // (4) 有投票到期 → 回傳 true 並把 index 打包進 performData
        upkeepNeeded = true; // Keeper → on-chain
        performData = abi.encode(idx); //  performUpkeep(bytes)
    }

    /* ========================================================= *
     |                   3. Keeper 真正 performUpkeep            |
     * ========================================================= */
    function performUpkeep(bytes calldata performData) external override {
        if (performData.length == 0) return; // safety

        uint256 idx = abi.decode(performData, (uint256));
        VoteInfo storage v = votes[idx];

        // 📝 二次檢查：若已處理過或時間還沒到，就直接 return
        if (v.done || block.timestamp < v.endTime) return;

        v.done = true; // 標記已結算

        // (1) 呼叫投票合約結束投票
        IVote(v.voteContract).endVoteAutomatically();
        emit VoteExecuted(v.voteContract);

        // (2) 重新找下一筆最早的投票，更新 nextExecutionAt
        uint64 soon = type(uint64).max;
        for (uint256 i = 0; i < votes.length; i++) {
            if (!votes[i].done && votes[i].endTime < soon) {
                soon = votes[i].endTime;
            }
        }
        nextExecutionAt = soon;
    }

    /* --------- 輔助：外部查詢 votes 長度 --------- */
    function votesLength() external view returns (uint256) {
        return votes.length;
    }
}
