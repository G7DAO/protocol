// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "../interfaces/IERC20.sol";
import { IERC20Inbox } from "../interfaces/IERC20Inbox.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token Faucet
 * @author Game7 Engineering Team - worldbuilder@game7.io
 */
contract TokenFaucet is Ownable {
    address public tokenAddress;
    address public inboxAddress;
    uint256 public faucetAmount;
    uint256 public faucetTimeInterval;
    uint256 public DEFAULT_GAS_LIMIT = 21000;
    mapping(address => uint256) public lastClaimedTimestamp;

    error TokenFaucetClaimIntervalNotPassed();

    modifier timeInterval() {
        if (block.timestamp <= lastClaimedTimestamp[msg.sender] + faucetTimeInterval) {
            revert TokenFaucetClaimIntervalNotPassed();
        }
        _;
        lastClaimedTimestamp[msg.sender] = block.timestamp;
    }

    constructor(
        address _tokenAddress,
        address _owner,
        address _inboxAddress,
        uint256 _faucetAmount,
        uint256 _faucetTimeInterval
    ) Ownable(_owner) {
        tokenAddress = _tokenAddress;
        inboxAddress = _inboxAddress;
        faucetAmount = _faucetAmount;
        faucetTimeInterval = _faucetTimeInterval;
        transferOwnership(_owner);
    }

    /**
     * @notice Claim tokens from the faucet
     */
    function claim() public timeInterval {
        IERC20(tokenAddress).transfer(msg.sender, faucetAmount);
    }

    /**
     * @notice Claim tokens from the faucet on L3
     */
    function claimL3() public timeInterval {
        uint256 _tokenTotalFeeAmount = (DEFAULT_GAS_LIMIT * block.basefee) + faucetAmount;
        IERC20(tokenAddress).approve(inboxAddress, _tokenTotalFeeAmount);
        IERC20Inbox(inboxAddress).createRetryableTicket(
            msg.sender,
            faucetAmount,
            0,
            address(this),
            address(this),
            DEFAULT_GAS_LIMIT,
            block.basefee,
            _tokenTotalFeeAmount,
            ""
        );
    }

    /**
     * @notice Set the faucet time interval
     * @dev Only the owner can call this function
     * @param _faucetTimeInterval The time interval between claims
     */
    function setFaucetTimeInterval(uint256 _faucetTimeInterval) public onlyOwner {
        faucetTimeInterval = _faucetTimeInterval;
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
    function setTokenAddress(address _tokenAddress) public onlyOwner {
        tokenAddress = _tokenAddress;
    }

    /**
     * @notice Deposit eth from L2 to L3 to address of the sender if sender is an EOA, and to its aliased address if the sender is a contract
     * @dev This does not trigger the fallback function when receiving in the L3 side.
     *      Look into retryable tickets if you are interested in this functionality.
     * @dev This function should not be called inside contract constructors
     */
    function setInboxAddress(address _inboxAddress) public onlyOwner {
        inboxAddress = _inboxAddress;
    }

    /**
     * @notice Rescue tokens from the contract
     * @dev Only the owner can call this function
     * @param _token The address of the token to rescue
     * @param _to The address to send the rescued tokens to
     * @param _amount The amount of tokens to rescue
     */
    function rescueTokens(address _token, address _to, uint256 _amount) public onlyOwner {
        IERC20(_token).transfer(_to, _amount);
    }
}
