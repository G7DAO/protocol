// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 *
 * Initializer for Terminus contract. Used when mounting a new TerminusFacet onto its diamond proxy.
 */

pragma solidity ^0.8.9;

import "@openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin-contracts/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {LibDiamondMoonstream as LibDiamond} from "../diamond/libraries/LibDiamondMoonstream.sol";
import "./LibTerminus.sol";

contract TerminusInitializer {
    function init() external {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC1155).interfaceId] = true;
        ds.supportedInterfaces[type(IERC1155MetadataURI).interfaceId] = true;

        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.controller = msg.sender;
    }
}
