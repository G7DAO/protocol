// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';

/**
 * @title Game7 Token
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract Game7Token is IERC20 {
    string public constant name = 'Game7 Token';
    string public constant symbol = 'G7T';
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    constructor(uint256 _totalSupply) {
        balanceOf[msg.sender] = _totalSupply;
        totalSupply = _totalSupply;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return transferFrom(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, 'ERC20: transfer amount exceeds balance');
        

        if (msg.sender != from && allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= amount, 'ERC20: insufficient allowance');
            allowance[from][msg.sender] -= amount;
        } 

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);

        return true;
    }

}
