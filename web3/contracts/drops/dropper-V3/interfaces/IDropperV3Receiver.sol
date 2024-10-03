// SPDX-License-Identifier: MIT

/**
 * Authors: Game7 World Builder
 * Email: worldbuilder@game7.io
 */

pragma solidity ^0.8.9;

/**
 * @title DropperV3 claim receiver interface
 * @author Game7 World Builder
 * @dev Interface for any contract that wants to support calldata recieved. 
 */

interface IDropperV3Receiver {

    /**
     * @dev Whenever a claim is called for a receiver 
     * @param caller is the caller for the claim function, the caller is not required to be the claimant
     * @param data is the data provided from the signature within the claimPayload. 
     * 
     */
    function onDropperV3Recieved(
        address caller, 
        bytes calldata data
        ) external ();

}
