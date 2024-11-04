// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct DroppableToken {
    uint256 tokenType;
    address tokenAddress; // address of the token
    uint256 tokenId;
    uint256 amount;
    uint256 maxNumberOfTokens;
    uint256 claimCount;
}

struct TerminusAuthorization {
    address terminusAddress;
    uint256 poolId;
}

library LibDropper {
    //todo: Check if "game7dao.eth" wanted or something else
    bytes32 constant DROPPERV3_STORAGE_POSITION = keccak256("game7.storage.Dropper");

    struct DropperStorage {
        address TerminusAdminContractAddress;
        uint256 TerminusAdminPoolID;
        uint256 NumDrops;
        mapping(uint256 => bool) IsDropActive;
        mapping(uint256 => TerminusAuthorization) DropAuthorizations;
        mapping(uint256 => DroppableToken) DropToken;
        mapping(uint256 => string) DropURI;
        // dropID => requestID => true if claimed and false if not
        mapping(uint256 => mapping(uint256 => bool)) DropRequestClaimed;
    }

    function dropperStorage() internal pure returns (DropperStorage storage ds) {
        bytes32 position = DROPPERV3_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
