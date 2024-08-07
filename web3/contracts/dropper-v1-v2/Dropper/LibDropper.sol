// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

struct DroppableToken {
    uint256 tokenType;
    address tokenAddress; // address of the token
    uint256 tokenId;
    uint256 amount;
}

struct TerminusAuthorization {
    address terminusAddress;
    uint256 poolId;
}

uint256 constant ERC20_TYPE = 20;
uint256 constant ERC721_TYPE = 721;
uint256 constant ERC1155_TYPE = 1155;
uint256 constant TERMINUS_MINTABLE_TYPE = 1;

library LibDropper {
    bytes32 constant DROPPERV2_STORAGE_POSITION =
        keccak256("moonstreamdao.eth.storage.Dropper");

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

    function dropperStorage()
        internal
        pure
        returns (DropperStorage storage ds)
    {
        bytes32 position = DROPPERV2_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
