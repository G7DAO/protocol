# Staker
[Git Source](https://github.com/G7DAO/protocol/blob/1fa20e44ab50858e3adc7f6902f74516fb46348a/contracts/staking/Staker.sol)

**Inherits:**
ERC721Enumerable, ReentrancyGuard

The Staker contract allows users to permissionlessly create staking pools by specifying various parameters
for each pool, such as:
- the tokens it accepts
- whether or not positions from that pool are transferable
- the period for which those tokens will be locked up
- a cooldown period on withdrawals for tokens in that pool

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


### TotalPools

```solidity
uint256 public TotalPools;
```


### TotalPositions

```solidity
uint256 public TotalPositions;
```


### CurrentAmountInPool

```solidity
mapping(uint256 => uint256) public CurrentAmountInPool;
```


### CurrentPositionsInPool

```solidity
mapping(uint256 => uint256) public CurrentPositionsInPool;
```


### Pools

```solidity
mapping(uint256 => StakingPool) public Pools;
```


### Positions

```solidity
mapping(uint256 => Position) public Positions;
```


## Functions
### constructor


```solidity
constructor() ERC721("Game7 Staker", "G7STAKER");
```

### onERC721Received


```solidity
function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4);
```

### onERC1155Received


```solidity
function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4);
```

### transferFrom


```solidity
function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721);
```

### createPool


```solidity
function createPool(
    uint256 tokenType,
    address tokenAddress,
    uint256 tokenID,
    bool transferable,
    uint256 lockupSeconds,
    uint256 cooldownSeconds
) external;
```

### updatePoolConfiguration


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

### transferPoolAdministration


```solidity
function transferPoolAdministration(uint256 poolID, address newAdministrator) external;
```

### stakeNative


```solidity
function stakeNative(uint256 poolID) external payable nonReentrant returns (uint256 positionTokenID);
```

### stakeERC20


```solidity
function stakeERC20(uint256 poolID, uint256 amount) external nonReentrant returns (uint256 positionTokenID);
```

### stakeERC721


```solidity
function stakeERC721(uint256 poolID, uint256 tokenID) external nonReentrant returns (uint256 positionTokenID);
```

### stakeERC1155


```solidity
function stakeERC1155(uint256 poolID, uint256 amount) external nonReentrant returns (uint256 positionTokenID);
```

### initiateUnstake


```solidity
function initiateUnstake(uint256 positionTokenID) external nonReentrant;
```

### unstake


```solidity
function unstake(uint256 positionTokenID) external nonReentrant;
```

### metadataBytes


```solidity
function metadataBytes(uint256 positionTokenID) public view returns (bytes memory metadata);
```

### metadataJSON


```solidity
function metadataJSON(uint256 positionTokenID) public view returns (string memory);
```

### tokenURI


```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory);
```

## Events
### StakingPoolCreated

```solidity
event StakingPoolCreated(
    uint256 indexed poolID, uint256 indexed tokenType, address indexed tokenAddress, uint256 tokenID
);
```

### StakingPoolConfigured

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

```solidity
event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

### UnstakeInitiated

```solidity
event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
```

### Unstaked

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

## Structs
### StakingPool
StakingPool represents a staking position that users can adopt.

Anybody can permissionlessly create a staking pool on the Staker contract. The creator
of a pool is automatically designated as its administrator. The current administrator of a pool
can transfer its administration privileges to another account.

The administrator of a staking pool is the only account that can change certain parameters
of the pool, such as whether positions under that staking pool are transferable, the length of
the lockup period for positions staked under that pool, and the length of the cooldown period for
withdrawals for positions staked under that pool.


```solidity
struct StakingPool {
    address administrator;
    uint256 tokenType;
    address tokenAddress;
    uint256 tokenID;
    bool transferable;
    uint256 lockupSeconds;
    uint256 cooldownSeconds;
}
```

### Position
Position represents the parameters of a staking position:
- the staking pool ID under which the deposit was made
- the amount of tokens deposited under that staking pool (for non-ERC721 token types),
or the tokenID for staking positions involving ERC721 tokens
- the timestamp at which the deposit was made

The address of the depositor is the owner of the ERC721 token representing this deposit, and
is not stored within this struct.


```solidity
struct Position {
    uint256 poolID;
    uint256 amountOrTokenID;
    uint256 stakeTimestamp;
    uint256 unstakeInitiatedAt;
}
```

