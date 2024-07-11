// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';

/**
 * @title Wrapped Native Token
 * @author Game7 Engineering Team - worldbuilder@game7.io
 * @dev Adapted from WETH9: https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code
 */
contract WrappedNativeToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Deposit(address indexed _to, uint _amount);
    event Withdrawal(address indexed from, uint _amount);

    constructor(string memory _tokenName, string memory _symbol) {
        name = _tokenName;
        symbol = _symbol;
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

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        require(msg.value > 0, "zero value");
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint _amount) public {
        require(_amount > 0, "zero value");
        require(balanceOf[msg.sender] >= _amount);
        balanceOf[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit Withdrawal(msg.sender, _amount);
    }

    function totalSupply() public view returns (uint) {
        return address(this).balance;
    }
}