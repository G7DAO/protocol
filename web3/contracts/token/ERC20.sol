// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';

/**
 * @title ERC20 Token
 * @author Game7 Engineering Team - engineering@game7.io
 * @dev Adapted from WETH9: https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code
 */
contract ERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    constructor(string memory _tokenName, string memory _symbol, uint8 _decimals, uint256 _totalSupply) {
        name = _tokenName;
        symbol = _symbol;
        decimals = _decimals;

        balanceOf[msg.sender] = _totalSupply;
        totalSupply = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
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
