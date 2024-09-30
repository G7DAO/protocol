// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { StakingPool, Position } from "./data.sol";
import { PositionMetadata } from "./PositionMetadata.sol";

/**
 * @notice The Staker contract allows users to permissionlessly create staking pools by specifying various parameters
 * for each pool, such as:
 * - the tokens it accepts
 * - whether or not positions from that pool are transferable
 * - the period for which those tokens will be locked up
 * - a cooldown period on withdrawals for tokens in that pool
 *
 * @notice Users can stake tokens into these pools - this is called "opening a position under a pool".
 *
 * @notice Each position is represented by an ERC721 token, which is minted to the user when they open a position.
 * This ERC721 token is burned from its holder when they close their position.
 *
 * @notice Built by the Game7 World Builder team: worldbuilder - at - game7.io
 */
contract Staker is ERC721Enumerable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Valid token types for StakingPool.tokenType.
    // We use this method instead of an enum to make it easier for users to remember the mapping from
    // these values to the actual types they represent.
    uint256 public constant NATIVE_TOKEN_TYPE = 1;
    uint256 public constant ERC20_TOKEN_TYPE = 20;
    uint256 public constant ERC721_TOKEN_TYPE = 721;
    uint256 public constant ERC1155_TOKEN_TYPE = 1155;

    /// @notice Address of the contract that calculates position NFT metadata.
    address public immutable positionMetadataAddress;

    /// @notice The total number of staking pools created on this contract.
    uint256 public TotalPools;
    /// @notice The total number of staking positions that have ever been opened on this contract.
    uint256 public TotalPositions;

    /// @notice The total amount of tokens currently staked in each pool.
    mapping(uint256 => uint256) public CurrentAmountInPool;
    /// @notice The total number of positions currently open under each pool.
    mapping(uint256 => uint256) public CurrentPositionsInPool;

    /// @notice Pool ID => StakingPool struct
    mapping(uint256 => StakingPool) public Pools;

    /// @notice Token ID of position tokens on this ERC721 contract => Position struct
    mapping(uint256 => Position) public Positions;

    /// @notice This event is emitted when a staking pool is created.
    event StakingPoolCreated(
        uint256 indexed poolID,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 tokenID
    );
    /// @notice This event is emitted whenever the administrator of a staking pool changes its configuration
    /// (transferability, lockup period, cooldown period). The arguments of the event represent the
    /// pool's configuration after the change.
    event StakingPoolConfigured(
        uint256 indexed poolID,
        address indexed administrator,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    );
    /// @notice Emitted when a user opens a position under a given pool.
    event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
    /// @notice Emitted when a user initiates an unstake on a position they hold.
    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
    /// @notice Emitted when a user unstakes a position they hold.
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
    error MetadataError();

    /// @notice Deploys a Staker contract. Note that the constructor doesn't do much as Staker contracts
    /// are permissionless.
    constructor(address positionMetadata) ERC721("Game7 Staker", "G7STAKER") {
        positionMetadataAddress = positionMetadata;
    }

    /// @notice Allows the Staker to receive ERC721 tokens through safeTransferFrom.
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice Allows the Staker to receive ERC1155 tokens.
    ///
    /// @dev We don't implement onERC1155BatchReceived because staking operates on a single tokenID.
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    /**
     * @notice If a pool is configured so that its positions are non-transferable, then we must disable transfer
     * functionality on the position tokens.
     *
     * @dev Since our ERC721 functionality is inherited from OpenZeppelin's ERC721 contract, we can override
     * this functionality in the transferFrom function. Both safeTransferFrom methods on the OpenZeppelin
     * ERC721 rely on transferFrom to perform the actual transfer.
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        Position storage position = Positions[tokenId];
        StakingPool storage pool = Pools[position.poolID];
        if (!pool.transferable) {
            revert PositionNotTransferable(tokenId);
        }
        super.transferFrom(from, to, tokenId);
    }

    /// @notice Allows anybody to create a staking pool.
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

    /**
     * @notice Allows a pool administrator to modify the configuration of that pool.
     *
     * @notice This transaction allows for any subset of the pool configuration to be changed atomically.
     *
     * @param poolID The ID of the staking pool to update configuration of.
     * @param changeTransferability Specifies whether the current call is updating the transferability of the pool or not. If this is false, then the value of the `transferable` argument will be ignored.
     * @param transferable Whether or not the pool should be transferable. This argument is only applied if `changeTransferabiliy` is `true`.
     * @param changeLockup Specifies whether the current call is updating the `lockupSeconds` configuration of the pool or not. If this is false, then the value of the `lockupSeconds` argument will be ignored.
     * @param lockupSeconds The new value for the `lockupSeconds` member of the pool.  This argument is only applied if `changeLockup` is `true`.
     * @param changeCooldown Specifies whether the current call is updating the `cooldownSeconds` configuration of the pool or not. If this is false, then the value of the `cooldownSeconds` argument will be ignored.
     * @param cooldownSeconds The new value for the `cooldownSeconds` member of the pool.  This argument is only applied if `changeCooldown` is `true`.
     */
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

    /**
     * @notice Allows pool administrators to transfer administration privileges.
     *
     * @dev To make a pool immutable, transfer administration to the zero address: `0x0000000000000000000000000000000000000000`.
     */
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

    /**
     * @notice Allows anyone to open a position under a staking pool for native tokens.
     */
    function stakeNative(address positionHolder, uint256 poolID) external payable nonReentrant returns (uint256 positionTokenID) {
        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != NATIVE_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, NATIVE_TOKEN_TYPE);
        }

        if (msg.value == 0) {
            revert NothingToStake();
        }

        positionTokenID = TotalPositions++;
        _mint(positionHolder, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: msg.value,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        CurrentAmountInPool[poolID] += msg.value;
        CurrentPositionsInPool[poolID]++;

        emit Staked(positionTokenID, positionHolder, poolID, msg.value);
    }

    /**
     * @notice Allows anyone to open a position under a staking pool for ERC20 tokens.
     *
     * @notice `amount` should be the full, raw amount. The Staker contract does not account for the ERC20
     * contract's `decimals` value.
     *
     * @dev The user must have granted approval on the ERC20 contract for the Staker contract to transfer
     * `amount` tokens from their account. This can typically be done by calling the `approve` method on the
     * ERC20 contract.
     */
    function stakeERC20(address positionHolder, uint256 poolID, uint256 amount) external nonReentrant returns (uint256 positionTokenID) {

        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != ERC20_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, ERC20_TOKEN_TYPE);
        }


        if (amount == 0) {
            revert NothingToStake();
        }

        IERC20(pool.tokenAddress).safeTransferFrom(msg.sender, address(this), amount);

        positionTokenID = TotalPositions++;
        _mint(positionHolder, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: amount,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        CurrentAmountInPool[poolID] += amount;
        CurrentPositionsInPool[poolID]++;

        emit Staked(positionTokenID, positionHolder, poolID, amount);
    }

    /**
     * @notice Allows anyone to open a position under a staking pool for ERC721 tokens.
     *
     * @notice Each position represents a single ERC721 token on the ERC721 contract specified by the pool.
     *
     * @dev The user must have granted approval on the ERC721 contract for the Staker contract to transfer
     * the token with the given `tokenID` from their account. This can typically be done by calling the `approve`
     * or `setApprovalForAll` methods on the ERC721 contract.
     */
    function stakeERC721(address positionHolder, uint256 poolID, uint256 tokenID) external nonReentrant returns (uint256 positionTokenID) {

        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != ERC721_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, ERC721_TOKEN_TYPE);
        }

        IERC721(pool.tokenAddress).safeTransferFrom(msg.sender, address(this), tokenID);

        positionTokenID = TotalPositions++;
        _mint(positionHolder, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: tokenID,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        CurrentAmountInPool[poolID]++;
        CurrentPositionsInPool[poolID]++;

        emit Staked(positionTokenID, positionHolder, poolID, tokenID);
    }

    /**
     * @notice Allows anyone to open a position under a staking pool for ERC1155 tokens.
     *
     * @dev The user must have granted approval on the ERC1155 contract for the Staker contract to transfer
     * `amount` tokens with the given `tokenId` from their account. This can typically be done by calling
     * the `setApprovalForAll` method on the ERC1155 contract.
     */
    function stakeERC1155(address positionHolder, uint256 poolID, uint256 amount) external nonReentrant returns (uint256 positionTokenID) {
        StakingPool storage pool = Pools[poolID];
        if (pool.tokenType != ERC1155_TOKEN_TYPE) {
            revert IncorrectTokenType(poolID, pool.tokenType, ERC1155_TOKEN_TYPE);
        }

        if (amount == 0) {
            revert NothingToStake();
        }

        IERC1155(pool.tokenAddress).safeTransferFrom(msg.sender, address(this), pool.tokenID, amount, "");

        positionTokenID = TotalPositions++;
        _mint(positionHolder, positionTokenID);

        Positions[positionTokenID] = Position({
            poolID: poolID,
            amountOrTokenID: amount,
            stakeTimestamp: block.timestamp,
            unstakeInitiatedAt: 0
        });

        CurrentAmountInPool[poolID] += amount;
        CurrentPositionsInPool[poolID]++;

        emit Staked(positionTokenID, positionHolder, poolID, amount);
    }

    /**
     * @notice Allows a user to initiate an unstake on a position they hold.
     *
     * @notice This call will revert if the lockup period for the position has not yet expired.
     *
     * @notice This call is idempotent. If a user calls this method successfully multiple times, every
     * call after the first will have no further effect.
     *
     * @notice For positions under pools with no cooldown period, a user can directly unstake their tokens
     * from their position after the lockup period has expired. It is not necessary for them to call this
     * method at all.
     */
    function initiateUnstake(uint256 positionTokenID) external nonReentrant {
        address positionOwner = ownerOf(positionTokenID);
        Position storage position = Positions[positionTokenID];

        StakingPool storage pool = Pools[position.poolID];

        if (positionOwner != msg.sender && pool.administrator != msg.sender) {
            revert UnauthorizedForPosition(positionOwner, msg.sender);
        }

        // Enforce lockup period
        if (block.timestamp < position.stakeTimestamp + pool.lockupSeconds) {
            revert LockupNotExpired(position.stakeTimestamp + pool.lockupSeconds);
        }

        if (position.unstakeInitiatedAt == 0) {
            position.unstakeInitiatedAt = block.timestamp;
            emit UnstakeInitiated(positionTokenID, positionOwner);
        }
    }

    /**
     * @notice Unstakes a user's position.
     *
     * @notice Requires that the lockup period on the position has expired. If the staking pool has a positive
     * cooldown period, then the user must have called `initiateUnstake` and waited for the cooldown period to
     * expire before calling this method.
     */
    function unstake(uint256 positionTokenID) external nonReentrant {
        Position storage position = Positions[positionTokenID];
        StakingPool storage pool = Pools[position.poolID];

        address positionOwner = ownerOf(positionTokenID);

        if (positionOwner != msg.sender && pool.administrator != msg.sender) {
            revert UnauthorizedForPosition(positionOwner, msg.sender);
        }

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

        // Reduce statistics tracking tokens and positions open under each pool.
        if (pool.tokenType == ERC721_TOKEN_TYPE) {
            CurrentAmountInPool[position.poolID]--;
        } else {
            CurrentAmountInPool[position.poolID] -= position.amountOrTokenID;
        }
        CurrentPositionsInPool[position.poolID]--;

        // Delete position data and burn the position token
        uint256 amountOrTokenID = position.amountOrTokenID;
        emit Unstaked(positionTokenID, positionOwner, position.poolID, amountOrTokenID);
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

    /// @notice Returns the ERC721 token URI for a position on the Staker contract, encoded as a data URI.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        Position storage position = Positions[tokenId];
        StakingPool storage pool = Pools[position.poolID];

        (bool success, bytes memory resultBytes) = positionMetadataAddress.staticcall(
            abi.encodeCall(PositionMetadata.metadata, (tokenId, position, pool))
        );
        if (!success) {
            revert MetadataError();
        }
        return abi.decode(resultBytes, (string));
    }
}