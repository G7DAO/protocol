# Staker
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/staking/Staker.sol)

**Inherits:**
ERC721Enumerable, ReentrancyGuard

The Staker contract allows users to permissionlessly create staking pools by specifying various parameters
for each pool, such as:
- the tokens it accepts
- whether or not positions from that pool are transferable
- the period for which those tokens will be locked up
- a cooldown period on withdrawals for tokens in that pool

Users can stake tokens into these pools - this is called "opening a position under a pool".

Each position is represented by an ERC721 token, which is minted to the user when they open a position.
This ERC721 token is burned from its holder when they close their position.

Built by the Game7 World Builder team: worldbuilder - at - game7.io


## State Variables
### NATIVE_TOKEN_TYPE

```solidity
uint256 public constant NATIVE_TOKEN_TYPE = 1;
```


### ERC20_TOKEN_TYPE

```solidity
uint256 public constant ERC20_TOKEN_TYPE = 20;
```


### ERC721_TOKEN_TYPE

```solidity
uint256 public constant ERC721_TOKEN_TYPE = 721;
```


### ERC1155_TOKEN_TYPE

```solidity
uint256 public constant ERC1155_TOKEN_TYPE = 1155;
```


### positionMetadataAddress
Address of the contract that calculates position NFT metadata.


```solidity
address public immutable positionMetadataAddress;
```


### TotalPools
The total number of staking pools created on this contract.


```solidity
uint256 public TotalPools;
```


### TotalPositions
The total number of staking positions that have ever been opened on this contract.


```solidity
uint256 public TotalPositions;
```


### CurrentAmountInPool
The total amount of tokens currently staked in each pool.


```solidity
mapping(uint256 => uint256) public CurrentAmountInPool;
```


### CurrentPositionsInPool
The total number of positions currently open under each pool.


```solidity
mapping(uint256 => uint256) public CurrentPositionsInPool;
```


### Pools
Pool ID => StakingPool struct


```solidity
mapping(uint256 => StakingPool) public Pools;
```


### Positions
Token ID of position tokens on this ERC721 contract => Position struct


```solidity
mapping(uint256 => Position) public Positions;
```


## Functions
### constructor

Deploys a Staker contract. Note that the constructor doesn't do much as Staker contracts
are permissionless.


```solidity
constructor(address positionMetadata) ERC721("Game7 Staker", "G7STAKER");
```

### onERC721Received

Allows the Staker to receive ERC721 tokens through safeTransferFrom.


```solidity
function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4);
```

### onERC1155Received

Allows the Staker to receive ERC1155 tokens.

*We don't implement onERC1155BatchReceived because staking operates on a single tokenID.*


```solidity
function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4);
```

### transferFrom

If a pool is configured so that its positions are non-transferable, then we must disable transfer
functionality on the position tokens.

*Since our ERC721 functionality is inherited from OpenZeppelin's ERC721 contract, we can override
this functionality in the transferFrom function. Both safeTransferFrom methods on the OpenZeppelin
ERC721 rely on transferFrom to perform the actual transfer.*


```solidity
function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721);
```

### createPool

Allows anybody to create a staking pool.


```solidity
function createPool(
    uint256 tokenType,
    address tokenAddress,
    uint256 tokenID,
    bool transferable,
    uint256 lockupSeconds,
    uint256 cooldownSeconds,
    address administrator
) external;
```

### updatePoolConfiguration

Allows a pool administrator to modify the configuration of that pool.

This transaction allows for any subset of the pool configuration to be changed atomically.


```solidity
function updatePoolConfiguration(
    uint256 poolID,
    bool changeTransferability,
    bool transferable,
    bool changeLockup,
    uint256 lockupSeconds,
    bool changeCooldown,
    uint256 cooldownSeconds
) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`poolID`|`uint256`|The ID of the staking pool to update configuration of.|
|`changeTransferability`|`bool`|Specifies whether the current call is updating the transferability of the pool or not. If this is false, then the value of the `transferable` argument will be ignored.|
|`transferable`|`bool`|Whether or not the pool should be transferable. This argument is only applied if `changeTransferability` is `true`.|
|`changeLockup`|`bool`|Specifies whether the current call is updating the `lockupSeconds` configuration of the pool or not. If this is false, then the value of the `lockupSeconds` argument will be ignored.|
|`lockupSeconds`|`uint256`|The new value for the `lockupSeconds` member of the pool.  This argument is only applied if `changeLockup` is `true`.|
|`changeCooldown`|`bool`|Specifies whether the current call is updating the `cooldownSeconds` configuration of the pool or not. If this is false, then the value of the `cooldownSeconds` argument will be ignored.|
|`cooldownSeconds`|`uint256`|The new value for the `cooldownSeconds` member of the pool.  This argument is only applied if `changeCooldown` is `true`.|


### transferPoolAdministration

Allows pool administrators to transfer administration privileges.

*To make a pool immutable, transfer administration to the zero address: `0x0000000000000000000000000000000000000000`.*


```solidity
function transferPoolAdministration(uint256 poolID, address newAdministrator) external;
```

### stakeNative

Allows anyone to open a position under a staking pool for native tokens.


```solidity
function stakeNative(address positionHolder, uint256 poolID)
    external
    payable
    nonReentrant
    returns (uint256 positionTokenID);
```

### stakeERC20

Allows anyone to open a position under a staking pool for ERC20 tokens.

`amount` should be the full, raw amount. The Staker contract does not account for the ERC20
contract's `decimals` value.

*The user must have granted approval on the ERC20 contract for the Staker contract to transfer
`amount` tokens from their account. This can typically be done by calling the `approve` method on the
ERC20 contract.*


```solidity
function stakeERC20(address positionHolder, uint256 poolID, uint256 amount)
    external
    nonReentrant
    returns (uint256 positionTokenID);
```

### stakeERC721

Allows anyone to open a position under a staking pool for ERC721 tokens.

Each position represents a single ERC721 token on the ERC721 contract specified by the pool.

*The user must have granted approval on the ERC721 contract for the Staker contract to transfer
the token with the given `tokenID` from their account. This can typically be done by calling the `approve`
or `setApprovalForAll` methods on the ERC721 contract.*


```solidity
function stakeERC721(address positionHolder, uint256 poolID, uint256 tokenID)
    external
    nonReentrant
    returns (uint256 positionTokenID);
```

### stakeERC1155

Allows anyone to open a position under a staking pool for ERC1155 tokens.

*The user must have granted approval on the ERC1155 contract for the Staker contract to transfer
`amount` tokens with the given `tokenId` from their account. This can typically be done by calling
the `setApprovalForAll` method on the ERC1155 contract.*


```solidity
function stakeERC1155(address positionHolder, uint256 poolID, uint256 amount)
    external
    nonReentrant
    returns (uint256 positionTokenID);
```

### initiateUnstake

Allows a user to initiate an unstake on a position they hold.

This call will revert if the lockup period for the position has not yet expired.

This call is idempotent. If a user calls this method successfully multiple times, every
call after the first will have no further effect.

For positions under pools with no cooldown period, a user can directly unstake their tokens
from their position after the lockup period has expired. It is not necessary for them to call this
method at all.


```solidity
function initiateUnstake(uint256 positionTokenID) external nonReentrant;
```

### unstake

Unstakes a user's position.

Requires that the lockup period on the position has expired. If the staking pool has a positive
cooldown period, then the user must have called `initiateUnstake` and waited for the cooldown period to
expire before calling this method.


```solidity
function unstake(uint256 positionTokenID) external nonReentrant;
```

### tokenURI

Returns the ERC721 token URI for a position on the Staker contract, encoded as a data URI.


```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory);
```

## Events
### StakingPoolCreated
This event is emitted when a staking pool is created.


```solidity
event StakingPoolCreated(
    uint256 indexed poolID, uint256 indexed tokenType, address indexed tokenAddress, uint256 tokenID
);
```

### StakingPoolConfigured
This event is emitted whenever the administrator of a staking pool changes its configuration
(transferability, lockup period, cooldown period). The arguments of the event represent the
pool's configuration after the change.


```solidity
event StakingPoolConfigured(
    uint256 indexed poolID,
    address indexed administrator,
    bool transferable,
    uint256 lockupSeconds,
    uint256 cooldownSeconds
);
```

### Staked
Emitted when a user opens a position under a given pool.


```solidity
event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

### UnstakeInitiated
Emitted when a user initiates an unstake on a position they hold.


```solidity
event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
```

### Unstaked
Emitted when a user unstakes a position they hold.


```solidity
event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

## Errors
### InvalidTokenType

```solidity
error InvalidTokenType();
```

### InvalidConfiguration

```solidity
error InvalidConfiguration();
```

### NonAdministrator

```solidity
error NonAdministrator();
```

### IncorrectTokenType

```solidity
error IncorrectTokenType(uint256 poolID, uint256 poolTokenType, uint256 tokenTypeArg);
```

### NothingToStake

```solidity
error NothingToStake();
```

### UnauthorizedForPosition

```solidity
error UnauthorizedForPosition(address owner, address sender);
```

### InitiateUnstakeFirst

```solidity
error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

### LockupNotExpired

```solidity
error LockupNotExpired(uint256 expiresAt);
```

### PositionNotTransferable

```solidity
error PositionNotTransferable(uint256 positionTokenID);
```

### MetadataError

```solidity
error MetadataError();
```

