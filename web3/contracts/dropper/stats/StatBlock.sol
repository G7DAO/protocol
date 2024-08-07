// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * Authors: Moonstream Engineering (engineering - at - moonstream.to)
 * GitHub: https://github.com/moonstream-to/web3
 */

import {IERC1155} from "@openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";
import {IStatBlock} from "./IStatBlock.sol";

contract StatBlockBase is IStatBlock {
    string public statBlockVersion = "0.0.1";
    // Stats are 0-indexed.
    uint256 public NumStats;
    mapping(uint256 => string) StatDescriptor;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) Stat;

    function isAdministrator(
        address account
    ) public view virtual returns (bool) {
        return false;
    }

    function createStat(
        string memory descriptor
    ) external returns (uint256 statID) {
        require(
            isAdministrator(msg.sender),
            "StatBlock.createStat: msg.sender must be an administrator of the StatBlock"
        );
        statID = ++NumStats;
        StatDescriptor[statID] = descriptor;
        emit StatCreated(statID);
        emit StatDescriptorUpdated(statID, descriptor);
    }

    // NOTE: This method does not check that the statID has already been created. That check is
    // unnecessary, but it means that checking if a description exists is not a correct way to check
    // if the stat with the corresponding statID exists.
    function setStatDescriptor(
        uint256 statID,
        string memory descriptor
    ) external {
        require(
            isAdministrator(msg.sender),
            "StatBlock.setStatDescriptor: msg.sender must be an administrator of the StatBlock"
        );
        StatDescriptor[statID] = descriptor;
        emit StatDescriptorUpdated(statID, descriptor);
    }

    function describeStat(
        uint256 statID
    ) external view returns (string memory) {
        return StatDescriptor[statID];
    }

    function assignStats(
        address tokenAddress,
        uint256 tokenID,
        uint256[] memory statIDs,
        uint256[] memory values
    ) public {
        require(
            isAdministrator(msg.sender),
            "StatBlock.assignStats: msg.sender must be an administrator of the StatBlock"
        );
        require(
            statIDs.length == values.length,
            "StatBlock.assignStats: statIDs and values must be the same length"
        );
        for (uint256 i = 0; i < statIDs.length; i++) {
            Stat[tokenAddress][tokenID][statIDs[i]] = values[i];
            emit StatAssigned(tokenAddress, tokenID, statIDs[i], values[i]);
        }
    }

    function batchAssignStats(
        address[] memory tokenAddresses,
        uint256[] memory tokenIDs,
        uint256[][] memory statIDs,
        uint256[][] memory values
    ) external {
        require(
            isAdministrator(msg.sender),
            "StatBlock.batchAssignStats: msg.sender must be an administrator of the StatBlock"
        );
        require(
            tokenAddresses.length == tokenIDs.length,
            "StatBlock.batchAssignStats: tokenAddresses and tokenIDs must be the same length"
        );
        require(
            tokenAddresses.length == statIDs.length,
            "StatBlock.batchAssignStats: tokenAddresses and statIDs must be the same length"
        );
        require(
            tokenAddresses.length == values.length,
            "StatBlock.batchAssignStats: tokenAddresses and values must be the same length"
        );
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            assignStats(tokenAddresses[i], tokenIDs[i], statIDs[i], values[i]);
        }
    }

    function getStats(
        address tokenAddress,
        uint256 tokenID,
        uint256[] memory statIDs
    ) public view returns (uint256[] memory) {
        uint256[] memory values = new uint256[](statIDs.length);
        for (uint256 i = 0; i < statIDs.length; i++) {
            values[i] = Stat[tokenAddress][tokenID][statIDs[i]];
        }
        return values;
    }

    function batchGetStats(
        address[] memory tokenAddresses,
        uint256[] memory tokenIDs,
        uint256[] memory statIDs
    ) external view returns (uint256[][] memory) {
        require(
            tokenAddresses.length == tokenIDs.length,
            "StatBlock.batchGetStats: tokenAddresses and tokenIDs must be the same length"
        );
        uint256[][] memory values = new uint256[][](tokenAddresses.length);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            values[i] = getStats(tokenAddresses[i], tokenIDs[i], statIDs);
        }
        return values;
    }
}

contract StatBlock is StatBlockBase {
    address AdminTerminusAddress;
    uint256 AdminTerminusPoolID;

    constructor(address adminTerminusAddress, uint256 adminTerminusPoolID) {
        AdminTerminusAddress = adminTerminusAddress;
        AdminTerminusPoolID = adminTerminusPoolID;
    }

    function adminTerminusInfo() external view returns (address, uint256) {
        return (AdminTerminusAddress, AdminTerminusPoolID);
    }

    function isAdministrator(
        address account
    ) public view override returns (bool) {
        IERC1155 terminus = IERC1155(AdminTerminusAddress);
        return terminus.balanceOf(account, AdminTerminusPoolID) > 0;
    }
}
