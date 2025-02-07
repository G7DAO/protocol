# MockStandardGateway
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/mock/bridge.sol)


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

