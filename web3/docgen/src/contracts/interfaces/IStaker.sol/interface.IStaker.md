# IStaker
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/interfaces/IStaker.sol)


## Functions
### positionMetadataAddress


```solidity
function positionMetadataAddress() external view returns (address);
```

### TotalPools


```solidity
function TotalPools() external view returns (uint256);
```

### TotalPositions


```solidity
function TotalPositions() external view returns (uint256);
```

### CurrentAmountInPool


```solidity
function CurrentAmountInPool(uint256 poolID) external view returns (uint256);
```

### CurrentPositionsInPool


```solidity
function CurrentPositionsInPool(uint256 poolID) external view returns (uint256);
```

### Pools


```solidity
function Pools(uint256 poolID)
    external
    view
    returns (
        address administrator,
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    );
```

### Positions


```solidity
function Positions(uint256 positionTokenID)
    external
    view
    returns (uint256 poolID, uint256 amountOrTokenID, uint256 stakeTimestamp, uint256 unstakeInitiatedAt);
```

### createPool


```solidity
function createPool(
    uint256 tokenType,
    address tokenAddress,
    uint256 tokenID,
    bool transferable,
    uint256 lockupSeconds,
    uint256 cooldownSeconds,
    address adminstrator
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
function stakeNative(address positionHolder, uint256 poolID) external payable returns (uint256 positionTokenID);
```

### stakeERC20


```solidity
function stakeERC20(address positionHolder, uint256 poolID, uint256 amount)
    external
    returns (uint256 positionTokenID);
```

### stakeERC721


```solidity
function stakeERC721(address positionHolder, uint256 poolID, uint256 tokenID)
    external
    returns (uint256 positionTokenID);
```

### stakeERC1155


```solidity
function stakeERC1155(address positionHolder, uint256 poolID, uint256 amount)
    external
    returns (uint256 positionTokenID);
```

### initiateUnstake


```solidity
function initiateUnstake(uint256 positionTokenID) external;
```

### unstake


```solidity
function unstake(uint256 positionTokenID) external;
```

### tokenURI


```solidity
function tokenURI(uint256 tokenId) external view returns (string memory);
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

