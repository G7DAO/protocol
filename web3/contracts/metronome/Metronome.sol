// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

struct Schedule {
    uint256 minBlocks;
    uint256 maxBlocks;    
}

contract Metronome {
    mapping(uint256 => Schedule) public Schedules;
    mapping(uint256 => uint256) public ScheduleBalances;
    uint256 public NumSchedules;

    function createSchedule(uint256 minBlocks, uint256 maxBlocks) external payable returns (uint256 scheduleID) {
        scheduleID = NumSchedules;
        NumSchedules++;
        Schedules[scheduleID] = Schedule(minBlocks, maxBlocks);
        ScheduleBalances[scheduleID] = msg.value;
    }
}