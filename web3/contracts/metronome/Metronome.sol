// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract Metronome {
    // scheduleID => target number of seconds per block
    mapping(uint256 => uint256) public Rates;
    // scheduleID => current bounty for that schedule
    mapping(uint256 => uint256) public Bounties;
    uint256 public NumSchedules;
    // scheduleID => block number at which schedule last ticked
    mapping(uint256 => uint256) public LastTick;

    event ScheduleCreated(uint256 indexed scheduleID, uint256 rate);
    event BountyIncreased(uint256 indexed scheduleID, uint256 value);
    event Tick(uint256 indexed scheduleID, uint256 indexed executor, uint256 indexed blockNumber, uint256 bounty);

    function createSchedule(uint256 rate) external payable returns (uint256 scheduleID) {
        scheduleID = NumSchedules;
        NumSchedules++;
        Rates[scheduleID] = rate;
        Bounties[scheduleID] = msg.value;

        emit ScheduleCreated(scheduleID, rate);
        emit BountyIncreased(scheduleID, msg.value);
    }

    function addBounty(uint256 scheduleID) external payable {
        Bounties[scheduleID] += msg.value;
        emit BountyIncreased(scheduleID, msg.value);
    }

    // function tick(uint256 scheduleID) external {
    // }
}
