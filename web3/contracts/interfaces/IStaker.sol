// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import { StakingPool, Position } from "../staking/data.sol";
import { PositionMetadata } from "../staking/PositionMetadata.sol";

interface IStaker {

    function positionMetadataAddress() external view returns (address);

    function TotalPools() external view returns (uint256);

    function TotalPositions() external view returns (uint256);

    function CurrentAmountInPool(uint256 poolID) external view returns (uint256);

    function CurrentPositionsInPool(uint256 poolID) external view returns (uint256);

    function Pools(uint256 poolID) external view returns (
        address administrator,
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    );

    function Positions(uint256 positionTokenID) external view returns (
        uint256 poolID,
        uint256 amountOrTokenID,
        uint256 stakeTimestamp,
        uint256 unstakeInitiatedAt
    );

    event StakingPoolCreated(
        uint256 indexed poolID,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 tokenID
    );

    event StakingPoolConfigured(
        uint256 indexed poolID,
        address indexed administrator,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    );

    event Staked(
        uint256 positionTokenID,
        address indexed owner,
        uint256 indexed poolID,
        uint256 amountOrTokenID
    );

    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);

    event Unstaked(
        uint256 positionTokenID,
        address indexed owner,
        uint256 indexed poolID,
        uint256 amountOrTokenID
    );

    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external;

    function updatePoolConfiguration(
        uint256 poolID,
        bool changeTransferability,
        bool transferable,
        bool changeLockup,
        uint256 lockupSeconds,
        bool changeCooldown,
        uint256 cooldownSeconds
    ) external;

    function transferPoolAdministration(uint256 poolID, address newAdministrator) external;

    function stakeNative(address user, uint256 poolID) external payable returns (uint256 positionTokenID);

    function stakeERC20(address user, uint256 poolID, uint256 amount) external returns (uint256 positionTokenID);

    function stakeERC721(address user, uint256 poolID, uint256 tokenID) external returns (uint256 positionTokenID);

    function stakeERC1155(address user, uint256 poolID, uint256 amount) external returns (uint256 positionTokenID);

    function initiateUnstake(uint256 positionTokenID) external;

    function unstake(uint256 positionTokenID) external;

    function tokenURI(uint256 tokenId) external view returns (string memory);
}