# PositionMetadata
[Git Source](https://github.com/G7DAO/protocol/blob/0d286772d26e7f355ea5f6d3e0323d2491e1ebca/contracts/staking/PositionMetadata.sol)


## Functions
### metadataBytes


```solidity
function metadataBytes(uint256 positionTokenID, Position memory position, StakingPool memory pool)
    public
    pure
    returns (bytes memory);
```

### metadataJSON

Returns a JSON string representing a position's on-chain metadata.


```solidity
function metadataJSON(uint256 positionTokenID, Position memory position, StakingPool memory pool)
    public
    pure
    returns (string memory);
```

### metadata


```solidity
function metadata(uint256 positionTokenID, Position memory position, StakingPool memory pool)
    public
    pure
    returns (string memory);
```

