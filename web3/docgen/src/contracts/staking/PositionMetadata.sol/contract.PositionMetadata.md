# PositionMetadata
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/staking/PositionMetadata.sol)


## Functions
### metadataBytes


```solidity
function metadataBytes(uint256 positionTokenID, Position memory position, StakingPool memory pool)
    public
    view
    returns (bytes memory);
```

### metadataJSON

Returns a JSON string representing a position's on-chain metadata.


```solidity
function metadataJSON(uint256 positionTokenID, Position memory position, StakingPool memory pool)
    public
    view
    returns (string memory);
```

### metadata


```solidity
function metadata(uint256 positionTokenID, Position memory position, StakingPool memory pool)
    public
    view
    returns (string memory);
```

### formatDateTime


```solidity
function formatDateTime(DateTime._DateTime memory dt) internal pure returns (string memory);
```

### generateSVG


```solidity
function generateSVG(Position memory position, StakingPool memory pool) internal view returns (string memory svg);
```

### generateSVGForeground


```solidity
function generateSVGForeground(Position memory position, StakingPool memory pool)
    private
    view
    returns (string memory svg);
```

### generateLogo


```solidity
function generateLogo() public pure returns (string memory);
```

### generateTokenSymbol


```solidity
function generateTokenSymbol(string memory tokenSymbolString) public pure returns (string memory);
```

### generateTokenIdOrAmountElement


```solidity
function generateTokenIdOrAmountElement(string memory tokenIdOrAmountString, string memory amountOrTokenIDString)
    public
    pure
    returns (string memory);
```

### generateTokenTypeElement


```solidity
function generateTokenTypeElement(
    string memory tokenTypeString,
    string memory tokenAddressString,
    string memory amountOrTokenIdString,
    string memory poolIdString
) public pure returns (string memory);
```

### generateStakingPeriodElements


```solidity
function generateStakingPeriodElements(
    string memory stakeTimestampStr,
    string memory unlockTimestampStr,
    string memory cooldownStr
) public pure returns (string memory);
```

### generateDefs


```solidity
function generateDefs() public pure returns (string memory);
```

### returnTokenSymbolNative


```solidity
function returnTokenSymbolNative() public view returns (string memory);
```

### returnTokenSymbol


```solidity
function returnTokenSymbol(uint256 tokenType, address tokenAddress) public view returns (string memory);
```

### getAddressSlice


```solidity
function getAddressSlice(address tokenAddress) public pure returns (string memory);
```

