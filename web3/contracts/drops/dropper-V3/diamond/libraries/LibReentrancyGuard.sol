// SPDX-License-Identifier: MIT

/**
 * Authors: Game7 Engineering
 */

pragma solidity ^0.8.0;

library LibReentrancyGuard {
    bytes32 constant REENTRANCY_GUARD_STORAGE_POSITION = keccak256("Game7dao.eth.storage.reentrancy");

    struct ReentrancyGuardStorage {
        bool _entered;
    }

    function reentrancyGuardStorage() internal pure returns (ReentrancyGuardStorage storage ds) {
        bytes32 position = REENTRANCY_GUARD_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
