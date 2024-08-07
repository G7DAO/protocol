// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 */

pragma solidity ^0.8.0;

library LibReentrancyGuard {
    bytes32 constant REENTRANCY_GUARD_STORAGE_POSITION =
        keccak256("moonstreamdao.eth.storage.reentrancy");

    struct ReentrancyGuardStorage {
        bool _entered;
    }

    function reentrancyGuardStorage()
        internal
        pure
        returns (ReentrancyGuardStorage storage ds)
    {
        bytes32 position = REENTRANCY_GUARD_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
