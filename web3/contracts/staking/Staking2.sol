// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';

/**
 * @title Game7 Staking
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract Staking2 {

    struct Deposit {
        address tokenAddress;
        uint256 amount;
        uint64 start;
        uint64 end;
    }

    mapping(address => Deposit[]) public depositsOf;

    event Deposited(address indexed tokenAddress, address indexed receiver, address indexed from, uint256 duration, uint256 amount);
    event Withdrawn(uint256 indexed depositId, address indexed from, address indexed receiver);

    function getDepositCount(address user) external view returns (uint256) {
        return depositsOf[user].length;
    }

    function deposit(address _tokenAddress, uint256 _amount, uint256 _duration, address _receiver) external {
        require(_receiver != address(0), "Staking.lock: receiver cannot be zero address");
        require(_amount > 0, "Staking.lock: cannot deposit 0");

        IERC20 depositToken = IERC20(_tokenAddress);
        depositToken.transferFrom(msg.sender, address(this), _amount);

        depositsOf[_receiver].push(
            Deposit({
                tokenAddress: _tokenAddress,
                amount: _amount,
                start: uint64(block.timestamp),
                end: uint64(block.timestamp) + uint64(_duration)
            })
        );

        emit Deposited(_tokenAddress, _receiver, msg.sender, _duration, _amount);
    }

    function withdraw(uint256 _depositId, address _receiver) external {
        require(_receiver != address(0), "Staking.unlock: receiver cannot be zero address");
        uint256 depositCount = depositsOf[msg.sender].length;
        require(_depositId < depositCount, "Staking.unlock: deposit does not exist");
        Deposit memory userDeposit = depositsOf[msg.sender][_depositId];
        require(block.timestamp >= userDeposit.end, "Staking.unlock: TOO SOON! YOU HAVE AWAKENED ME TOO SOON, EXECUTUS!");

        // remove Deposit
        depositsOf[msg.sender][_depositId] = depositsOf[msg.sender][depositCount - 1];
        depositsOf[msg.sender].pop();

        // return tokens
        IERC20 depositToken = IERC20(userDeposit.tokenAddress);
        depositToken.transferFrom(address(this), _receiver, userDeposit.amount);
        emit Withdrawn(_depositId, msg.sender, _receiver);
    }

}
