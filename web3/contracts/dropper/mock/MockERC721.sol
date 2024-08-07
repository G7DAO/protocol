// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract MockERC721 is ERC721Enumerable {
    constructor() ERC721("Mock ERC721", "MOCKERC721") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
