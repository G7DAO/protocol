// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Game7 Engineering
 */

pragma solidity ^0.8.0;
import "../libraries/LibReentrancyGuard.sol";

abstract contract DiamondReentrancyGuard {
    modifier diamondNonReentrant() {
        LibReentrancyGuard.ReentrancyGuardStorage storage rgs = LibReentrancyGuard.reentrancyGuardStorage();
        require(!rgs._entered, "LibReentrancyGuard: reentrant call!");
        rgs._entered = true;
        _;
        rgs._entered = false;
    }
}
