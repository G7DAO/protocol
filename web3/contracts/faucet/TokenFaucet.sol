// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IERC20} from "../interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token Faucet
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract TokenFaucet is Ownable {
    address public tokenAddress;
    uint256 public faucetAmount;
    uint256 public faucetBlockInterval;
    mapping(address => uint256) public lastClaimedBlock;

    error TokenFaucetClaimIntervalNotPassed();
    constructor(
        address _tokenAddress,
        address _owner,
        uint256 _faucetAmount,
        uint256 _faucetBlockInternal
    ) Ownable(_owner) {
        tokenAddress = _tokenAddress;
        faucetAmount = _faucetAmount;
        faucetBlockInterval = _faucetBlockInternal;
        transferOwnership(_owner);
    }

    function claim() public {
        uint256 current_block = block.number;
        if(current_block <= lastClaimedBlock[msg.sender] + faucetBlockInterval) {
            revert TokenFaucetClaimIntervalNotPassed();
        }

        IERC20(tokenAddress).transfer(msg.sender, faucetAmount);
        lastClaimedBlock[msg.sender] = current_block;
    }

    function setFaucetBlockInterval(uint256 _faucetBlockInterval)
        public
        onlyOwner
    {
        faucetBlockInterval = _faucetBlockInterval;
    }

    function setFaucetAmount(uint256 _faucetAmount) public onlyOwner {
        faucetAmount = _faucetAmount;
    }

    function setTokenAddress(address _tokenAddress)
        public
        onlyOwner
    {
        tokenAddress = _tokenAddress;
    }
}