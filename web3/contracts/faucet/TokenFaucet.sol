// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IERC20} from "../interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token Faucet
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract TokenFaucet is Ownable {
    address TOKEN_ADDRESS;
    uint256 FAUCET_AMOUNT;
    uint256 FAUCET_BLOCK_INTERVAL;
    mapping(address => uint256) lastClaimedBlock;

    constructor(
        address _TOKEN_ADDRESS,
        address _owner,
        uint256 _FAUCET_AMOUNT,
        uint256 _FAUCET_BLOCK_INTERVAL
    ) Ownable(_owner) {
        TOKEN_ADDRESS = _TOKEN_ADDRESS;
        FAUCET_AMOUNT = _FAUCET_AMOUNT;
        FAUCET_BLOCK_INTERVAL = _FAUCET_BLOCK_INTERVAL;
        transferOwnership(_owner);
    }

    function getTokenAddress() public view returns (address) {
        return TOKEN_ADDRESS;
    }

    function getToken() internal view returns (IERC20) {
        return IERC20(TOKEN_ADDRESS);
    }

    function getTokenBalance(address _address)
        public
        view
        returns (uint256)
    {
        return getToken().balanceOf(_address);
    }

    function getLastClaimedBlock(address _address)
        public
        view
        returns (uint256)
    {
        return lastClaimedBlock[_address];
    }

    function claim() public {
        uint256 current_block = block.number;
        require(
            current_block > lastClaimedBlock[msg.sender] + FAUCET_BLOCK_INTERVAL
        );
        getToken().transfer(msg.sender, FAUCET_AMOUNT);
        lastClaimedBlock[msg.sender] = current_block;
    }

    function getFaucetAmount() public view returns (uint256) {
        return FAUCET_AMOUNT;
    }

    function getFaucetBlockInterval() public view returns (uint256) {
        return FAUCET_BLOCK_INTERVAL;
    }

    function setFaucetBlockInterval(uint256 _FAUCET_BLOCK_INTERVAL)
        public
        onlyOwner
    {
        FAUCET_BLOCK_INTERVAL = _FAUCET_BLOCK_INTERVAL;
    }

    function setFaucetAmount(uint256 _FAUCET_AMOUNT) public onlyOwner {
        FAUCET_AMOUNT = _FAUCET_AMOUNT;
    }

    function setTokenAddress(address _TOKEN_ADDRESS)
        public
        onlyOwner
    {
        TOKEN_ADDRESS = _TOKEN_ADDRESS;
    }
}