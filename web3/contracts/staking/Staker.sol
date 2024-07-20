// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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
    using SafeERC20 for IERC20;

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

    /**
     * Position represents the parameters of a staking position:
     * - the staking pool ID under which the deposit was made
     * - the amount of tokens deposited under that staking pool (for non-ERC721 token types),
     *   or the tokenID for staking positions involving ERC721 tokens
     * - the timestamp at which the deposit was made
     *
     * The address of the depositor is the owner of the ERC721 token representing this deposit, and
     * is not stored within this struct.
     */
    struct Position {
        uint256 poolID;
        uint256 amountOrTokenID;
        uint256 stakeTimestamp;
        uint256 unstakeInitiatedAt;
    }

    // Valid token types for StakingPool.tokenType
    uint256 public constant NATIVE_TOKEN_TYPE = 1;
    uint256 public constant ERC20_TOKEN_TYPE = 20;
    uint256 public constant ERC721_TOKEN_TYPE = 721;
    uint256 public constant ERC1155_TOKEN_TYPE = 1155;

    uint256 public TotalPools;
    uint256 public TotalPositions;

    // Pool ID => StakingPool struct
    mapping(uint256 => StakingPool) public Pools;

    // Token ID of position tokens on this ERC721 contract => Position struct
    mapping(uint256 => Position) public Positions;

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
    event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);

    error InvalidTokenType();
    error InvalidConfiguration();
    error NonAdministrator();
    error IncorrectTokenType(uint256 poolID, uint256 poolTokenType, uint256 tokenTypeArg);
    error NothingToStake();
    error UnauthorizedForPosition(address owner, address sender);
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
    error LockupNotExpired(uint256 expiresAt);
    error PositionNotTransferable(uint256 positionTokenID);

    constructor() ERC721("Game7 Staker", "G7STAKER") {}

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // We don't implement onERC1155BatchReceived because staking operates on a single tokenID.
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    // If a pool is configured so that its positions are non-trasnsferable, then we must disable transfer
    // functionality on the position tokens.
    // Since our ERC721 functionality is inherited from OpenZeppelin's ERC721 contract, we can override
    // this functionality in the transferFrom function. Both safeTransferFrom methods on the OpenZeppelin
    // ERC721 rely on transferFrom to perform the actual transfer.
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        Position storage position = Positions[tokenId];
        StakingPool storage pool = Pools[position.poolID];
        if (!pool.transferable) {
            revert PositionNotTransferable(tokenId);
        }
        super.transferFrom(from, to, tokenId);
    }

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

    function stakeNative(uint256 poolID) external payable returns (uint256 positionTokenID) {
        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != NATIVE_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, NATIVE_TOKEN_TYPE);
        }

        if (msg.value == 0) {
            revert NothingToStake();
        }

        positionTokenID = TotalPositions++;
        _mint(msg.sender, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: msg.value,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        emit Staked(positionTokenID, msg.sender, poolID, msg.value);
    }

    function stakeERC20(uint256 poolID, uint256 amount) external nonReentrant returns (uint256 positionTokenID) {
        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != ERC20_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, ERC20_TOKEN_TYPE);
        }

        if (amount == 0) {
            revert NothingToStake();
        }

        IERC20(pool.tokenAddress).safeTransferFrom(msg.sender, address(this), amount);

        positionTokenID = TotalPositions++;
        _mint(msg.sender, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: amount,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        emit Staked(positionTokenID, msg.sender, poolID, amount);
    }

    function stakeERC721(uint256 poolID, uint256 tokenID) external nonReentrant returns (uint256 positionTokenID) {
        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != ERC721_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, ERC721_TOKEN_TYPE);
        }

        IERC721(pool.tokenAddress).safeTransferFrom(msg.sender, address(this), tokenID);

        positionTokenID = TotalPositions++;
        _mint(msg.sender, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: tokenID,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        emit Staked(positionTokenID, msg.sender, poolID, tokenID);
    }

    function stakeERC1155(uint256 poolID, uint256 amount) external nonReentrant returns (uint256 positionTokenID) {
        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != ERC1155_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, ERC1155_TOKEN_TYPE);
        }

        if (amount == 0) {
            revert NothingToStake();
        }

        IERC1155(pool.tokenAddress).safeTransferFrom(msg.sender, address(this), pool.tokenID, amount, "");

        positionTokenID = TotalPositions++;
        _mint(msg.sender, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: amount,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        emit Staked(positionTokenID, msg.sender, poolID, amount);
    }

    function initiateUnstake(uint256 positionTokenID) external {
        address positionOwner = ownerOf(positionTokenID);
        if (positionOwner != msg.sender) {
            revert UnauthorizedForPosition(positionOwner, msg.sender);
        }

        Position storage position = Positions[positionTokenID];
        StakingPool storage pool = Pools[position.poolID];

        // Enforce lockup period
        if (block.timestamp < position.stakeTimestamp + pool.lockupSeconds) {
            revert LockupNotExpired(position.stakeTimestamp + pool.lockupSeconds);
        }

        if (position.unstakeInitiatedAt == 0) {
            position.unstakeInitiatedAt = block.timestamp;
            emit UnstakeInitiated(positionTokenID, msg.sender);
        }
    }

    function unstake(uint256 positionTokenID) external nonReentrant {
        {
            address positionOwner = ownerOf(positionTokenID);
            if (positionOwner != msg.sender) {
                revert UnauthorizedForPosition(positionOwner, msg.sender);
            }
        }

        Position storage position = Positions[positionTokenID];
        StakingPool storage pool = Pools[position.poolID];

        // Enforce cooldown, but only if the pool has a cooldown period.
        if (pool.cooldownSeconds > 0) {
            // This branch doesn't enforce the lockup period as that has already been enforced in `initiateUnstake`.
            if (
                position.unstakeInitiatedAt == 0 || block.timestamp < position.unstakeInitiatedAt + pool.cooldownSeconds
            ) {
                revert InitiateUnstakeFirst(pool.cooldownSeconds);
            }
        } else {
            // Enforce lockup period
            if (block.timestamp < position.stakeTimestamp + pool.lockupSeconds) {
                revert LockupNotExpired(position.stakeTimestamp + pool.lockupSeconds);
            }
        }

        // Delete position data and burn the position token
        uint256 amountOrTokenID = position.amountOrTokenID;
        emit Unstaked(positionTokenID, msg.sender, position.poolID, amountOrTokenID);
        delete Positions[positionTokenID];
        _burn(positionTokenID);

        // Return the staked tokens.
        if (pool.tokenType == NATIVE_TOKEN_TYPE) {
            payable(msg.sender).transfer(amountOrTokenID);
        } else if (pool.tokenType == ERC20_TOKEN_TYPE) {
            IERC20(pool.tokenAddress).safeTransfer(msg.sender, amountOrTokenID);
        } else if (pool.tokenType == ERC721_TOKEN_TYPE) {
            IERC721(pool.tokenAddress).safeTransferFrom(address(this), msg.sender, amountOrTokenID);
        } else if (pool.tokenType == ERC1155_TOKEN_TYPE) {
            IERC1155(pool.tokenAddress).safeTransferFrom(address(this), msg.sender, pool.tokenID, amountOrTokenID, "");
        }
    }

    function metadataBytes(uint256 positionTokenID) public view returns (bytes memory metadata) {
        Position storage position = Positions[positionTokenID];
        StakingPool storage pool = Pools[position.poolID];

        if (pool.tokenType == 0) {
            // This means that the position does not exist.
            revert InvalidTokenType();
        }

        // Preamble
        metadata = abi.encodePacked(
            '{"token_id":"',
            Strings.toString(positionTokenID),
            // TODO(zomglings): Change image URI
            '","image": "https://badges.moonstream.to/test/staking_logo.png"',
            ',"external_url":"https://game7.io"',
            ',"metadata_version":1,"attributes": ['
        );

        metadata = abi.encodePacked(
            metadata,
            '{"trait_type":"Pool ID","value":"',
            Strings.toString(position.poolID),
            '"}'
        );

        metadata = abi.encodePacked(
            metadata,
            ",",
            pool.tokenType == ERC721_TOKEN_TYPE
                ? '{"trait_type":"Staked token ID","value":"'
                : '{"trait_type":"Staked amount","value":"',
            Strings.toString(position.amountOrTokenID),
            '"}'
        );

        metadata = abi.encodePacked(
            metadata,
            ',{"display_type":"number","trait_type":"Staked at","value":',
            Strings.toString(position.stakeTimestamp),
            "}"
        );

        metadata = abi.encodePacked(
            metadata,
            ',{"display_type":"number","trait_type":"Lockup expires at","value":',
            Strings.toString(position.stakeTimestamp + pool.lockupSeconds),
            "}"
        );

        metadata = abi.encodePacked(metadata, "]}");
    }

    function metadataJSON(uint256 positionTokenID) public view returns (string memory) {
        return string(metadataBytes(positionTokenID));
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(metadataBytes(tokenId))));
    }
}
