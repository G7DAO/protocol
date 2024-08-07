// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 */

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

abstract contract LootboxRandomness is VRFConsumerBase {
    uint256 ChainlinkVRFFee;
    bytes32 ChainlinkVRFKeyhash;

    struct LootboxOpening {
        // Statuses:
        // 1 -> offered
        // 2 -> randomness fulfilled
        // 3 -> completed
        uint32 status;
        address user; // address which is openening the lootbox
        uint256 lootboxId;
        uint256 randomness;
    }

    event LootboxOpeningBegan(address lootboxOwner, uint256 lootboxId);
    event LootboxOpeningCompleted(
        address lootboxOwner,
        uint256 lootboxId,
        bytes32 requestId,
        uint256 randomness
    );

    mapping(bytes32 => LootboxOpening) public ActiveLootboxOpenings;
    mapping(address => bytes32) public CurrentOpeningforUser;

    constructor(
        address _VRFCoordinatorAddress,
        address _LinkTokenAddress,
        uint256 _ChainlinkVRFFee,
        bytes32 _ChainlinkVRFKeyhash
    ) VRFConsumerBase(_VRFCoordinatorAddress, _LinkTokenAddress) {
        ChainlinkVRFFee = _ChainlinkVRFFee;
        ChainlinkVRFKeyhash = _ChainlinkVRFKeyhash;
    }

    function getChainlinkVRFFee() public view returns (uint256) {
        return ChainlinkVRFFee;
    }

    function getChainlinkVRFKeyhash() public view returns (bytes32) {
        return ChainlinkVRFKeyhash;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        LootboxOpening storage currentLootboxOpening = ActiveLootboxOpenings[
            requestId
        ];
        if (currentLootboxOpening.status != 1) {
            return;
        }
        currentLootboxOpening.status = 2;
        currentLootboxOpening.randomness = randomness;
    }

    function _startRandomLootboxOpening(uint256 lootboxId) internal {
        require(
            CurrentOpeningforUser[msg.sender] == 0,
            "LootboxRandomness: _startRandomLootboxOpening -- Sender already has an incompleted opening"
        );

        emit LootboxOpeningBegan(msg.sender, lootboxId);

        LootboxOpening memory currentlootboxOpening;
        currentlootboxOpening.status = 1;
        currentlootboxOpening.user = msg.sender;
        currentlootboxOpening.lootboxId = lootboxId;

        bytes32 requestId = requestRandomness(
            ChainlinkVRFKeyhash,
            ChainlinkVRFFee
        );

        ActiveLootboxOpenings[requestId] = currentlootboxOpening;
        CurrentOpeningforUser[msg.sender] = requestId;
    }
}
