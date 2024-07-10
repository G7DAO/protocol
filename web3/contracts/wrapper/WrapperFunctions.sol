// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IWrapper1155Factory} from"../interfaces/IWrapper1155Factory.sol";

import {IDEXW1155} from "../interfaces/IDEXW1155.sol";

abstract contract WrapperFunctions is ERC1155Holder {

    address immutable public wrapperFactory;

    constructor(address _factory){
        wrapperFactory = _factory;
    }
    function wrap1155(address erc1155Contract,address to, uint256 amount, uint256 tokenId) internal virtual returns(address token, uint256 _amount){
        token = IWrapper1155Factory(wrapperFactory).get1155Wrapper(erc1155Contract, tokenId);
        require(token != address(0), "Create Wrapper first");
        IERC1155(erc1155Contract).safeTransferFrom(msg.sender, address(this), tokenId, amount, "0x0");
        IERC1155(erc1155Contract).setApprovalForAll(token, true);
        _amount = IDEXW1155(token).deposit1155(address(this), to, amount);
        IERC1155(erc1155Contract).setApprovalForAll(token, false);
    }
    function unwrap1155(address token, address to, uint256 amount) internal virtual returns(uint256 _amount){
        IDEXW1155(token).transferFrom(msg.sender, address(this), amount);
        IDEXW1155(token).approve(token, amount);
        _amount = IDEXW1155(token).withdraw1155(address(this),to, amount);
        IDEXW1155(token).transfer(msg.sender, IDEXW1155(token).balanceOf(address(this)));
    }

}