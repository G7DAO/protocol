# IGatewayRouter
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/interfaces/IGatewayRouter.sol)

**Inherits:**
[ITokenGateway](/contracts/interfaces/ITokenGateway.sol/interface.ITokenGateway.md)


## Functions
### defaultGateway


```solidity
function defaultGateway() external view returns (address gateway);
```

### getGateway


```solidity
function getGateway(address _token) external view returns (address gateway);
```

## Events
### TransferRouted

```solidity
event TransferRouted(address indexed token, address indexed _userFrom, address indexed _userTo, address gateway);
```

### GatewaySet

```solidity
event GatewaySet(address indexed l1Token, address indexed gateway);
```

### DefaultGatewayUpdated

```solidity
event DefaultGatewayUpdated(address newDefaultGateway);
```

