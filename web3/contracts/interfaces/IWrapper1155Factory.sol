// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

interface Wrapper1155Factory {
    struct tokenData{
        address _contract;
        uint256 tokenId;
    }
    function get1155Wrapper(address _contract, uint256 tokenid) external view returns(address token);
    function get1155TokenID(address token) external view returns(address _contract, uint256 tokenid);
    function create20(address _contract, uint256 tokenId)external returns(address token);
}