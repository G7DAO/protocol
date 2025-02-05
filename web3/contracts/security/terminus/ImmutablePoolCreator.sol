// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface StakerInterface {
    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds,
        address administrator
    ) external;

    function transferPoolAdministration(uint256 poolID, address newAdministrator) external;
}

contract ImmutablePoolCreator {
    address public immutable stakerAddress;

    event ImmutablePoolCreated(uint256 poolID);

    constructor(address _stakerAddress) {
        stakerAddress = _stakerAddress;
    }

    function createImmutablePool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external {
        StakerInterface staker = StakerInterface(stakerAddress);

        // sender as the administrator
        staker.createPool(tokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds, msg.sender);

        // 0 address as the administrator to make the pool immutable
        staker.transferPoolAdministration(poolID, address(0));

        emit ImmutablePoolCreated(poolID);
    }
}
