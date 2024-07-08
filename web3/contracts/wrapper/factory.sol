// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../token/DEXW1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract Factory {

    // 1155 to tokenid to erc20
    mapping(address =>mapping(uint256 => address)) _get20;
    // erc20 to 1155 data
    mapping(address => tokenData) _getData;

    struct tokenData{
        address _contract;
        uint256 tokenId;
    }


    constructor(){}

    function create20(address _contract, uint256 tokenId)public returns(address token){
        token = _get20[_contract][tokenId];
        if(token != address(0)){
            //need nameing schematic
            string memory _name = "Token 1";
            string memory _symbol = "TKN1";
            bytes memory bytecode = type(DEXW1155).creationCode;

            bytes32 salt = keccak256(abi.encodePacked(_name, _symbol, _contract, tokenId));
            assembly {
            token := create2(0, add(bytecode, 32), mload(bytecode), salt)
            }
            DEXW1155(token).initialize(_contract, tokenId);
        }
    }
}