// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

import "@openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

interface IERC721Mint is IERC721 {
    function mint(address to, uint256 tokenId) external;

    function totalSupply() external view returns (uint256);
}
