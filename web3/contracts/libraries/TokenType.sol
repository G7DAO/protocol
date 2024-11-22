// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

library TokenType {
    function native_token_type() internal pure returns (uint256) {
        return 1;
    }

    function terminus_mintable_type() internal pure returns (uint256) {
        return 2;
    }

    function erc20_type() internal pure returns (uint256) {
        return 20;
    }

    function erc721_type() internal pure returns (uint256) {
        return 721;
    }

    function erc1155_type() internal pure returns (uint256) {
        return 1155;
    }
}
