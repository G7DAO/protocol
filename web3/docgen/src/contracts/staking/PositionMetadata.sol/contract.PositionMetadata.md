# PositionMetadata
[Git Source](https://github.com/G7DAO/protocol/blob/fccfcc8a0536e9213636bc700d12b3bd8562130f/contracts/staking/PositionMetadata.sol)


## Functions
### metadataBytes


```solidity
function metadataBytes(uint256, StakingPool memory pool, uint256 positionTokenID, Position memory position)
    public
    pure
    returns (bytes memory);
```

### metadataJSON

Returns a JSON string representing a position's on-chain metadata.


```solidity
function metadataJSON(uint256 poolID, StakingPool memory pool, uint256 positionTokenID, Position memory position)
    public
    pure
    returns (string memory);
```

### metadata


```solidity
function metadata(uint256 poolID, StakingPool memory pool, uint256 positionTokenID, Position memory position)
    public
    pure
    returns (string memory);
```

