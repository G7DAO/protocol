// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

struct Schedule {
    uint256 remainder;
    uint256 divisor;    
    uint256 bounty;
}

contract Metronome is ReentrancyGuard {
    mapping(uint256 => Schedule) public Schedules;
    mapping(uint256 => uint256) public ScheduleBalances;
    // scheduleID => blockNumber => true if claimed already and false if not
    mapping(uint256 => mapping(uint256 => bool)) public ClaimedBounties;
    uint256 public NumSchedules;
    // scheduleID => block number at which schedule last ticked
    mapping(uint256 => uint256) public LastTick;

    event ScheduleCreated(uint256 indexed scheduleID, uint256 indexed remainder, uint256 indexed divisor, uint256 bounty);
    event BountyClaimed(uint256 indexed scheduleID, address indexed forAddress, uint256 payment);

    error InvalidSchedule();
    error BountyAlreadyClaimedForSchedule(uint256 scheduleID);
    error OffSchedule(uint256 scheduleID);

    function createSchedule(uint256 remainder, uint256 divisor, uint256 bounty) external payable returns (uint256 scheduleID) {
        if (divisor == 0) {
            revert InvalidSchedule();
        }
        if (bounty == 0) {
            revert InvalidSchedule();
        }
        if (remainder >= divisor) {
            revert InvalidSchedule();
        }
        scheduleID = NumSchedules;
        NumSchedules++;
        Schedules[scheduleID] = Schedule(remainder, divisor, bounty);
        ScheduleBalances[scheduleID] = msg.value;
        emit ScheduleCreated(scheduleID, remainder, divisor, bounty);
    }

    function _claim(uint256 scheduleID, address forAddress) internal {
        if (ClaimedBounties[scheduleID][block.number]) {
            revert BountyAlreadyClaimedForSchedule(scheduleID);
        }
        if (block.number % Schedules[scheduleID].divisor != Schedules[scheduleID].remainder) {
            revert OffSchedule(scheduleID);
        }
        uint256 payment = ScheduleBalances[scheduleID];
        if (payment > Schedules[scheduleID].bounty) {
            payment = Schedules[scheduleID].bounty;
        }
        ScheduleBalances[scheduleID] -= payment;
        ClaimedBounties[scheduleID][block.number] = true;

        payable(forAddress).transfer(payment);
        emit BountyClaimed(scheduleID, forAddress, payment);
    }

    function claim(uint256 scheduleID, address forAddress) external nonReentrant {
        _claim(scheduleID, forAddress);
    }

    function claimBatch(uint256[] memory scheduleIDs, address forAddress) external nonReentrant {
        for (uint256 i = 0; i < scheduleIDs.length; i++) {
            _claim(scheduleIDs[i], forAddress);
        }
    }
}
