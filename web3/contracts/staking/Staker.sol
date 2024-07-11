// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * The Staker contract allows users to permissionlessly create staking pools by specifying various parameters
 * for each pool, such as:
 * - the tokens it accepts
 * - whether or not positions from that pool are transferable
 * - the period for which those tokens will be locked up
 * - a cooldown period on withdrawals for tokens in that pool
 *
 * Built by the Game7 World Builder team: worldbuilder - at - game7.io
 */
contract Staker is ERC721Enumerable, ReentrancyGuard {
    /**
     * StakingPool represents a staking position that users can adopt.
     *
     * Anybody can permissionlessly create a staking pool on the Staker contract. The creator
     * of a pool is automatically designated as its administrator. The current administrator of a pool
     * can transfer its administration privileges to another account.
     *
     * The administrator of a staking pool is the only account that can change certain parameters
     * of the pool, such as whether positions under that staking pool are transferable, the length of
     * the lockup period for positions staked under that pool, and the length of the cooldown period for
     * withdrawals for positions staked under that pool.
     */
    struct StakingPool {
        address administrator;
        uint256 tokenType;
        address tokenAddress;
        uint256 tokenID;
        bool transferable;
        uint256 lockupSeconds;
        uint256 cooldownSeconds;
    }

    // Valid token types for StakingPool.tokenType
    uint256 public constant NATIVE_TOKEN_TYPE = 1;
    uint256 public constant ERC20_TOKEN_TYPE = 20;
    uint256 public constant ERC721_TOKEN_TYPE = 721;
    uint256 public constant ERC1155_TOKEN_TYPE = 1155;

    uint256 public TotalPools;

    mapping(uint256 => StakingPool) public Pools;

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

    error InvalidTokenType();
    error InvalidConfiguration();
    error NonAdministrator();

    constructor() ERC721("Game7 Staker", "G7STAKER") {}

    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external {
        if (tokenType == NATIVE_TOKEN_TYPE) {
            if (tokenAddress != address(0) || tokenID != 0) {
                revert InvalidConfiguration();
            }
        } else if (tokenType == ERC20_TOKEN_TYPE) {
            if (tokenAddress == address(0) || tokenID != 0) {
                revert InvalidConfiguration();
            }
        } else if (tokenType == ERC721_TOKEN_TYPE) {
            if (tokenAddress == address(0) || tokenID != 0) {
                revert InvalidConfiguration();
            }
        } else if (tokenType == ERC1155_TOKEN_TYPE) {
            if (tokenAddress == address(0)) {
                revert InvalidConfiguration();
            }
        } else {
            revert InvalidTokenType();
        }

        Pools[TotalPools] = StakingPool({
            administrator: msg.sender,
            tokenType: tokenType,
            tokenAddress: tokenAddress,
            tokenID: tokenID,
            transferable: transferable,
            lockupSeconds: lockupSeconds,
            cooldownSeconds: cooldownSeconds
        });

        emit StakingPoolCreated(TotalPools, tokenType, tokenAddress, tokenID);
        emit StakingPoolConfigured(TotalPools, msg.sender, transferable, lockupSeconds, cooldownSeconds);

        TotalPools++;
    }

    function updatePoolConfiguration(
        uint256 poolID,
        bool changeTransferability,
        bool transferable,
        bool changeLockup,
        uint256 lockupSeconds,
        bool changeCooldown,
        uint256 cooldownSeconds
    ) external {
        StakingPool storage pool = Pools[poolID];
        if (msg.sender != pool.administrator) {
            revert NonAdministrator();
        }
        if (changeTransferability) {
            pool.transferable = transferable;
        }
        if (changeLockup) {
            pool.lockupSeconds = lockupSeconds;
        }
        if (changeCooldown) {
            pool.cooldownSeconds = cooldownSeconds;
        }
        emit StakingPoolConfigured(
            poolID,
            pool.administrator,
            pool.transferable,
            pool.lockupSeconds,
            pool.cooldownSeconds
        );
    }

    function transferPoolAdministration(uint256 poolID, address newAdministrator) external {
        StakingPool storage pool = Pools[poolID];
        if (msg.sender != pool.administrator) {
            revert NonAdministrator();
        }
        pool.administrator = newAdministrator;
        emit StakingPoolConfigured(
            poolID,
            newAdministrator,
            pool.transferable,
            pool.lockupSeconds,
            pool.cooldownSeconds
        );
    }
}
