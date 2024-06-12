// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';

contract Staker {

    IERC20 public immutable depositToken;
    mapping(address => uint256) public balanceOf;

    event Staked(address indexed receiver, address indexed from, uint256 amount);  
    event Unstaked(address indexed from, address indexed receiver, uint256 amount);

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

        depositToken.transferFrom(address(this), _receiver, _amount);
        balanceOf[msg.sender] = balanceOf[msg.sender] - _amount;

        emit Unstaked(msg.sender, _receiver, _amount);
    }

}