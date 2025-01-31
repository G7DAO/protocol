# MockStandardGateway
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/mock/bridge.sol)


## State Variables
### calls

```solidity
bytes[] public calls;
```


## Functions
### fallback


```solidity
fallback() external payable;
```

### receive


```solidity
receive() external payable;
```

### getCalls


```solidity
function getCalls() external view returns (bytes[] memory);
```

