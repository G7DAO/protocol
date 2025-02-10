// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract NativeBalances {
    function getSingleNaitveBalance(address user) public view returns (uint256) {
        return user.balance;
    }

    function getMultipleNativeBalances(address[] calldata users) public view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            balances[i] = users[i].balance;
        }
        return balances;
    }
}
