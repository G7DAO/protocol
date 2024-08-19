// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

uint256 constant NATIVE_TOKEN_TYPE = 1;
uint256 constant ERC20_TYPE = 20;
uint256 constant ERC721_TYPE = 721;
uint256 constant ERC1155_TYPE = 1155;
uint256 constant TERMINUS_MINTABLE_TYPE = 2;

library TokenType {

    function native_token_type() public pure returns (uint256){
        return NATIVE_TOKEN_TYPE;
    }

    function erc20_type() public pure returns (uint256) {
        return ERC20_TYPE;
    }

    function erc721_type() public pure returns (uint256) {
        return ERC721_TYPE;
    }

    function erc1155_type() public pure returns (uint256) {
        return ERC1155_TYPE;
    }

    function terminus_mintable_type() public pure returns (uint256) {
        return TERMINUS_MINTABLE_TYPE;
    }
}