# IGatewayRouter
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/interfaces/IGatewayRouter.sol)

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

