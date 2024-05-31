// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';

/**
 * @title Game7 Staking
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract Staking {

    struct Deposit {
        uint256 amount;
        uint64 start;
        uint64 end;
    }

    IERC20 public immutable depositToken;
    mapping(address => uint256) public balanceOf;
    mapping(address => Deposit[]) public depositsOf;

    event Staked(address indexed receiver, address indexed from, uint256 amount);  
    event Unstaked(address indexed from, address indexed receiver, uint256 amount);
    event Locked(address indexed receiver, address indexed from, uint256 duration, uint256 amount);
    event Unlocked(uint256 indexed depositId, address indexed from, address indexed receiver);

    constructor(address _depositToken) {
        depositToken = IERC20(_depositToken);
    }

    function stake(uint256 _amount, address _receiver) external {
        require(_receiver != address(0), "Staking.deposit: receiver cannot be zero address");
        require(_amount > 0, "Staking.deposit: cannot deposit 0");

        depositToken.transferFrom(msg.sender, address(this), _amount);

        balanceOf[_receiver] = balanceOf[_receiver] + _amount;

        emit Staked(_receiver, msg.sender, _amount); 
    }

    function unstake(uint256 _amount, address _receiver) external {
        require(_receiver != address(0), "Staking.unstake: receiver cannot be zero address");
        require(_amount <= balanceOf[msg.sender], "Staking.unstake: insufficient balance");

        balanceOf[msg.sender] = balanceOf[msg.sender] - _amount;

        depositToken.transferFrom(address(this), _receiver, _amount);
        emit Unstaked(msg.sender, _receiver, _amount);
    }

    function getDepositCount(address user) external view returns (uint256) {
        return depositsOf[user].length;
    }

    function lock(uint256 _amount, uint256 _duration, address _receiver) external {
        require(_receiver != address(0), "Staking.lock: receiver cannot be zero address");
        require(_amount > 0, "Staking.lock: cannot deposit 0");

        depositToken.transferFrom(msg.sender, address(this), _amount);

        depositsOf[_receiver].push(
            Deposit({
                amount: _amount,
                start: uint64(block.timestamp),
                end: uint64(block.timestamp) + uint64(_duration)
            })
        );

        emit Locked(_receiver, msg.sender, _duration, _amount);
    }

    function unlock(uint256 _depositId, address _receiver) external {
        require(_receiver != address(0), "Staking.unlock: receiver cannot be zero address");
        uint256 depositCount = depositsOf[msg.sender].length;
        require(_depositId < depositCount, "Staking.unlock: deposit does not exist");
        Deposit memory userDeposit = depositsOf[msg.sender][_depositId];
        require(block.timestamp >= userDeposit.end, "Staking.unlock: TOO SOON! YOU HAVE AWAKENED ME TOO SOON, EXECUTUS!");

        // remove Deposit
        depositsOf[msg.sender][_depositId] = depositsOf[msg.sender][depositCount - 1];
        depositsOf[msg.sender].pop();

        // return tokens
        depositToken.transferFrom(address(this), _receiver, userDeposit.amount);
        emit Unlocked(_depositId, msg.sender, _receiver);
    }

}
