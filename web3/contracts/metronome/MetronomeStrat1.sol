// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ArbSys } from "../interfaces/ArbSys.sol";
import { ArbGasInfo } from "../interfaces/ArbGasInfo.sol";

contract MetronomeStrat1 is ReentrancyGuard {
    mapping(address => uint256) public membershipEndBlock;
    mapping(uint256 => bytes32) private arbBlockNumberToArbBlockHash;
    mapping(uint256 => bytes32) private allArbBlockHashesCollected;

    uint256 public totalArbBlockHashesCollected;
    uint256 public lastArbBlockNumber;

    uint256 private payedOut;
    uint256 private immutable startTime;
    ArbSys public constant arbSys = ArbSys(address(100));
    ArbGasInfo public constant arbGasInfo = ArbGasInfo(address(0x000000000000000000000000000000000000006c));

    event MembershipExtension(address indexed member, uint256 indexed endBlock);

    constructor() {
        startTime = block.timestamp;
    }

    error InvalidMembership();
    error InvalidPayment();

    function collectArbBlockHashes() external nonReentrant {
        uint256 gasLeftInitial = gasleft();
        //can only record hashes from previous block not current
        uint256 arbBlockNumber = arbSys.arbBlockNumber() - 1;
        uint256 blockDiff = arbBlockNumber - lastArbBlockNumber;
        require(blockDiff > 0, "No new blocks");
        lastArbBlockNumber = blockDiff > 1 && blockDiff < 256 ? lastArbBlockNumber : arbBlockNumber - 255;

        for (uint256 blockNumber = lastArbBlockNumber + 1; blockNumber <= arbBlockNumber; blockNumber++) {
            arbBlockNumberToArbBlockHash[blockNumber] = arbSys.arbBlockHash(blockNumber);
            totalArbBlockHashesCollected++;
            allArbBlockHashesCollected[totalArbBlockHashesCollected] = arbBlockNumberToArbBlockHash[blockNumber];
        }

        uint256 gasReturn = (tx.gasprice * (gasLeftInitial - gasleft())) + arbGasInfo.getCurrentTxL1GasFees();
        gasReturn += (gasReturn * 11) / 10;
        payedOut += gasReturn;

        (bool success, ) = payable(msg.sender).call{ value: gasReturn }("");
        require(success, "Transfer failed");
    }

    function extendMembership(address member) external payable nonReentrant {
        uint256 cost = miniumCost();
        if (msg.value < cost) {
            revert InvalidPayment();
        }
        uint256 timeToAdd = cost * msg.value;

        if (membershipEndBlock[member] > block.timestamp) {
            membershipEndBlock[member] += timeToAdd;
        } else {
            membershipEndBlock[member] = block.timestamp + timeToAdd;
        }
        emit MembershipExtension(member, membershipEndBlock[member]);
    }

    //returns the minimum cost to extend membership
    function miniumCost() public view returns (uint256) {
        uint256 timePassed = block.timestamp - startTime;
        //Estimate cost based on time passed and amount paid out with 10% margin
        uint256 cost = (11 * payedOut) / timePassed;
        return cost / 10;
    }

    //returns the hash and a boolean indicating if the block number is within the range of collected hashes
    function getArbBlockHashAtBlockNumber(uint256 arbBlockNumber) public view returns (bytes32, bool) {
        if (membershipEndBlock[msg.sender] <= block.timestamp) {
            return (bytes32(0), false);
        } else {
            return (
                arbBlockNumberToArbBlockHash[arbBlockNumber],
                arbBlockNumber <= lastArbBlockNumber && arbBlockNumberToArbBlockHash[arbBlockNumber] != bytes32(0)
            );
        }
    }

    //returns the hash and a boolean indicating if the index is within the range of collected hashes
    function getArbBlockHashesAtIndex(uint256 index) public view returns (bytes32, bool) {
        if (membershipEndBlock[msg.sender] <= block.timestamp) {
            return (bytes32(0), false);
        } else {
            return (allArbBlockHashesCollected[index], index <= totalArbBlockHashesCollected);
        }
    }
}
