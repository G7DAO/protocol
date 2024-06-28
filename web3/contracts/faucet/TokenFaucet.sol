// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token Faucet
 * @author Game7 Engineering Team - worldbuilder@game7.io
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
        uint256 _faucetBlockInterval
    ) Ownable(_owner) {
        tokenAddress = _tokenAddress;
        faucetAmount = _faucetAmount;
        faucetBlockInterval = _faucetBlockInterval;
        transferOwnership(_owner);
    }

    /**
     * @notice Claim tokens from the faucet
     */
    function claim() public {
        uint256 current_block = block.number;
        if(current_block <= lastClaimedBlock[msg.sender] + faucetBlockInterval) {
            revert TokenFaucetClaimIntervalNotPassed();
        }
        lastClaimedBlock[msg.sender] = current_block;
        IERC20(tokenAddress).transfer(msg.sender, faucetAmount);
    }

    /**
     * @notice Set the faucet block interval
     * @dev Only the owner can call this function
     * @param _faucetBlockInterval The block interval between claims
     */
    function setFaucetBlockInterval(uint256 _faucetBlockInterval)
        public
        onlyOwner
    {
        faucetBlockInterval = _faucetBlockInterval;
    }

    /**
     * @notice Set the faucet amount
     * @dev Only the owner can call this function
     * @param _faucetAmount The amount of tokens to send
     */
    function setFaucetAmount(uint256 _faucetAmount) public onlyOwner {
        faucetAmount = _faucetAmount;
    }

    /**
     * @notice Set the token address
     * @dev Only the owner can call this function
     * @param _tokenAddress The address of the token to set
     */
    function setTokenAddress(address _tokenAddress)
        public
        onlyOwner
    {
        tokenAddress = _tokenAddress;
    }

    /**
     * @notice Rescue tokens from the contract
     * @dev Only the owner can call this function
     * @param _token The address of the token to rescue
     * @param _to The address to send the rescued tokens to
     * @param _amount The amount of tokens to rescue
     */
    function rescueTokens(address _token, address _to, uint256 _amount)
        public
        onlyOwner
    {
        IERC20(_token).transfer(_to, _amount);
    }
}