// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/engine
 */

pragma solidity ^0.8.9;

import {IERC721} from "@openzeppelin/contracts/contracts/token/ERC721/IERC721.sol";
import {IGOFP} from "../interfaces/IGOFP.sol";

library GOFPPredicates {
    function doesNotExceedMaxTokensInSession(
        uint256 maxStakable,
        address gofpAddress,
        uint256 sessionId,
        address player,
        address nftAddress,
        uint256 tokenId
    ) external view returns (bool) {
        IGOFP gofpContract = IGOFP(gofpAddress);
        uint256 numStaked = gofpContract.numTokensStakedIntoSession(
            sessionId,
            player
        );
        return numStaked < maxStakable;
    }
}
