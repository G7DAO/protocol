// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamondDropperV3 as LibDiamond } from "../libraries/LibDiamondDropperV3.sol";
import { IERC173 } from "../interfaces/IERC173.sol";

contract DropperV3OwnershipFacet is IERC173 {
    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(_newOwner);
    }

    function owner() external view override returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }
}
