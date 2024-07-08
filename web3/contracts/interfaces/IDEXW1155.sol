// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


abstract contract IDEXW1155 is IERC20{
    
    /// @notice Deposit ERC1155 tokenId to get wrapped ERC1155 as ERC20
    function deposit1155(address from, address to, uint256 amount) virtual external;

    /// @notice Withdraw ERC1155 tokenId by sending in ERC20
    function withdraw1155(address from, address to, uint256 amount) virtual external;

}