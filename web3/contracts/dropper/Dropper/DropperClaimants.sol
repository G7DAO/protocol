// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 */

pragma solidity ^0.8.0;

import "@openzeppelin-contracts/contracts/access/Ownable.sol";
import "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

import {IDropper} from "../interfaces/IDropper.sol";

contract ClaimProxy is Ownable {
    address public DropperAddress;

    constructor(address _dropperAddress) {
        DropperAddress = _dropperAddress;
    }

    function claim(
        uint256 dropId,
        uint256 requestID,
        uint256 blockDeadline,
        uint256 amount,
        address signer,
        bytes memory signature
    ) public virtual {
        IDropper(DropperAddress).claim(
            dropId,
            requestID,
            blockDeadline,
            amount,
            signer,
            signature
        );
    }

    function drain(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenId
    ) external onlyOwner {
        require(
            tokenType == 20 || tokenType == 721 || tokenType == 1155,
            "Invalid token type. Valid types: 20, 721, 1155. Figure it out."
        );

        if (tokenType == 20) {
            IERC20 token = IERC20(tokenAddress);
            uint256 balance = token.balanceOf(address(this));
            bool success = token.transfer(owner(), balance);
            require(success, "Transfer failed");
        } else if (tokenType == 721) {
            IERC721(tokenAddress).transferFrom(address(this), owner(), tokenId);
        } else if (tokenType == 1155) {
            IERC1155 token = IERC1155(tokenAddress);
            uint256 balance = token.balanceOf(address(this), tokenId);
            token.safeTransferFrom(
                address(this),
                owner(),
                tokenId,
                balance,
                ""
            );
        }
    }
}

contract ERC721CompatibleClaimProxy is ClaimProxy {
    constructor(address _dropperAddress) ClaimProxy(_dropperAddress) {}

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }
}

contract ERC1155CompatibleClaimProxy is ClaimProxy {
    constructor(address _dropperAddress) ClaimProxy(_dropperAddress) {}

    function onERC1155Received(
        address operator,
        address from,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }
}
