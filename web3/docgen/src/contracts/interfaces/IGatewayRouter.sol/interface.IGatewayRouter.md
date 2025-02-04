# IGatewayRouter
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/interfaces/IGatewayRouter.sol)

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

