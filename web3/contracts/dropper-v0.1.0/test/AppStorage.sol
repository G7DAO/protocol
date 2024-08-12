// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao

 */

pragma solidity ^0.8.0;

struct AppStorage {
    uint256 counter;
    mapping(address => bool) claimed;
}
