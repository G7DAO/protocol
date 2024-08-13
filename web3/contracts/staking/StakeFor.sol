// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { Staker } from "./Staker.sol";

contract StakeFor is IERC721Receiver, ReentrancyGuard {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function stakeERC20For(
        address stakerContract,
        address user,
        uint256 poolID,
        uint256 amount
    ) external nonReentrant returns (uint256 positionTokenID) {
        positionTokenID = Staker(stakerContract).stakeERC20(poolID, amount);
        IERC721(stakerContract).safeTransferFrom(address(this), user, positionTokenID);
    }
}
