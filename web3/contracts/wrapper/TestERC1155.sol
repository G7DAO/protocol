// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

//Warning not secured do not use for anything beside testing
contract TestERC1155 is ERC1155{


    constructor()ERC1155("test Token URI"){

    }

    function mint(uint256 id, uint256 value) external {

        _mint(msg.sender, id, value, '0x0');

    }

    function mintBatach(uint count) external {

        uint256[] memory ids =new uint256[](count);
        uint256[] memory values= new uint256[](count);

        for(uint i =0; i < count;){
            ids[i] = i+1;
            values[i] = 1000;
            unchecked{i++;}
        }
        _mintBatch(msg.sender, ids, values, "0x0");
    }


}