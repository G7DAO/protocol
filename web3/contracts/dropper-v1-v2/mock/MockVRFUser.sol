// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

contract MockVRFUser is VRFConsumerBase {
    uint256 ChainlinkVRFFee;
    bytes32 ChainlinkVRFKeyhash;

    mapping(bytes32 => bool) public randomnessFullfilled;
    mapping(bytes32 => uint256) public randomnessValue;

    event VRFUserRandomnessFullfilled(bytes32 requestID, uint256 randomness);

    constructor(
        address _VRFCoordinatorAddress,
        address _LinkTokenAddress,
        uint256 _ChainlinkVRFFee,
        bytes32 _ChainlinkVRFKeyhash
    ) VRFConsumerBase(_VRFCoordinatorAddress, _LinkTokenAddress) {
        ChainlinkVRFFee = _ChainlinkVRFFee;
        ChainlinkVRFKeyhash = _ChainlinkVRFKeyhash;
    }

    function request() public {
        bytes32 requestId = requestRandomness(
            ChainlinkVRFKeyhash,
            ChainlinkVRFFee
        );
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        randomnessFullfilled[requestId] = true;
        randomnessValue[requestId] = randomness;

        emit VRFUserRandomnessFullfilled(requestId, randomness);
    }
}
