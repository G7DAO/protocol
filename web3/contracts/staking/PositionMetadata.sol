// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { StakingPool, Position } from "./data.sol";
import "./SVGGenerate.sol";

contract PositionMetadata {

    function metadataBytes(
        uint256 positionTokenID,
        Position memory position,
        StakingPool memory pool
    ) public pure returns (bytes memory) {
        // encode the image
        string memory image = Base64.encode(bytes(SVGGenerate.generateSVG(positionTokenID, position, pool)));
        bytes memory result = bytes(
            abi.encodePacked(
            '{"token_id":"',
            Strings.toString(positionTokenID),
            '","image": "',
            'data:image/svg+xml;base64,',
            image,
            ',"result_version":1,"attributes": ['
        )
        );

        result = abi.encodePacked(result, '{"trait_type":"Pool ID","value":"', Strings.toString(position.poolID), '"}');

        result = abi.encodePacked(
            result,
            ",",
            pool.tokenType == 721
                ? '{"trait_type":"Staked token ID","value":"'
                : '{"trait_type":"Staked amount","value":"',
            Strings.toString(position.amountOrTokenID),
            '"}'
        );

        result = abi.encodePacked(
            result,
            ',{"display_type":"number","trait_type":"Staked at","value":',
            Strings.toString(position.stakeTimestamp),
            "}"
        );

        result = abi.encodePacked(
            result,
            ',{"display_type":"number","trait_type":"Lockup expires at","value":',
            Strings.toString(position.stakeTimestamp + pool.lockupSeconds),
            "}"
        );

        result = abi.encodePacked(result, "]}");

        return result;
    }

    /// @notice Returns a JSON string representing a position's on-chain metadata.
    function metadataJSON(
        uint256 positionTokenID,
        Position memory position,
        StakingPool memory pool
    ) public pure returns (string memory) {
        return string(metadataBytes(positionTokenID, position, pool));
    }

    function metadata(
        uint256 positionTokenID,
        Position memory position,
        StakingPool memory pool
    ) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(metadataBytes(positionTokenID, position, pool))
                )
            );
    }
    
}
