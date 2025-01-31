# ControllableWithTerminus
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/security/terminus/ControllableWithTerminus.sol)

**Inherits:**
Ownable

Authors: Moonstream Engineering (engineering@moonstream.to)
GitHub: https://github.com/bugout-dev/dao


## State Variables
### terminus

```solidity
TerminusFacet private terminus;
```


### administratorPoolId

```solidity
uint256 public administratorPoolId;
```


## Functions
### constructor


```solidity
constructor(address _terminusContractAddress, uint256 _administratorPoolId) Ownable(msg.sender);
```

### onlyAdministrator

*throws if called by account that doesn't hold the administrator pool token
or is the contract owner*


```solidity
modifier onlyAdministrator();
```

### changeAdministratorPoolId


```solidity
function changeAdministratorPoolId(uint256 _administratorPoolId) public onlyOwner;
```

### grantAdminRole


```solidity
function grantAdminRole(address to) public onlyOwner;
```

### revokeAdminRole


```solidity
function revokeAdminRole(address from) public onlyOwner;
```

