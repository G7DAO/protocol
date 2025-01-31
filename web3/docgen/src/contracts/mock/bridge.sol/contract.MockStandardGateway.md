# MockStandardGateway
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/mock/bridge.sol)


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

