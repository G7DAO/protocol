// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 *
 */
pragma solidity ^0.8.9;

import "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin-contracts/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {LibDiamondMoonstream as LibDiamond} from "./diamond/libraries/LibDiamondMoonstream.sol";

contract TokenDrainerFacet {
    function drainERC20(
        address tokenAddress,
        address receiverAddress
    ) external {
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        withdrawERC20(tokenAddress, balance, receiverAddress);
    }

    function withdrawERC20(
        address tokenAddress,
        uint256 amount,
        address receiverAddress
    ) public {
        LibDiamond.enforceIsContractOwner();
        IERC20 token = IERC20(tokenAddress);
        token.transfer(receiverAddress, amount);
    }

    function drainERC1155(
        address tokenAddress,
        uint256 tokenId,
        address receiverAddress
    ) external {
        uint256 balance = IERC1155(tokenAddress).balanceOf(
            address(this),
            tokenId
        );
        withdrawERC1155(tokenAddress, tokenId, balance, receiverAddress);
    }

    function withdrawERC1155(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        address receiverAddress
    ) public {
        LibDiamond.enforceIsContractOwner();
        IERC1155 token = IERC1155(tokenAddress);
        token.safeTransferFrom(
            address(this),
            receiverAddress,
            tokenId,
            amount,
            ""
        );
    }

    function withdrawERC721(
        address tokenAddress,
        uint256 tokenId,
        address receiverAddress
    ) public {
        LibDiamond.enforceIsContractOwner();
        IERC721 token = IERC721(tokenAddress);
        token.safeTransferFrom(address(this), receiverAddress, tokenId, "");
    }
}
