# MockRouter
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/mock/bridge.sol)


## State Variables
### calls

```solidity
bytes[] public calls;
```


## Functions
### receive


```solidity
receive() external payable;
```

### getOutboundCalldata


```solidity
function getOutboundCalldata(address _token, address _from, address _to, uint256 _amount, bytes memory _data)
    external
    pure
    returns (bytes memory);
```

### outboundTransfer


```solidity
function outboundTransfer(
    address _token,
    address _to,
    uint256 _amount,
    uint256 _maxGas,
    uint256 _gasPriceBid,
    bytes calldata _data
) external payable returns (bytes memory);
```

### getCalls


```solidity
function getCalls() external view returns (bytes[] memory);
```

