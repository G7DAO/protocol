// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TokenSender
 * @notice Contract used by the Game7 testnet faucet accounts to apply validations before sending tokens.
 * @author Game7 Engineering Team - worldbuilder@game7.io
 */
contract TokenSender {
    uint256 public faucetTimeInterval;
    // address => block.timestamp for the block in which the TokenSender was last used to send native tokens to that account
    mapping(address => uint256) public lastSentTimestamp;

    event TokensSent(address indexed sender, address indexed recipient, uint256 amount);

    error TokenSenderClaimIntervalNotPassed(address recipient);

    constructor(uint256 _faucetTimeInterval) {
        faucetTimeInterval = _faucetTimeInterval;
    }

    /**
     * @notice Send msg.value native tokens to the given recipient, applying the validations from this
     * TokenSender contract
     */
    function send(address recipient) external payable {
        if (block.timestamp <= lastSentTimestamp[recipient] + faucetTimeInterval) {
            revert TokenSenderClaimIntervalNotPassed(recipient);
        }

        lastSentTimestamp[recipient] = block.timestamp;
        payable(recipient).transfer(msg.value);
        emit TokensSent(msg.sender, recipient, msg.value);
    }
}
