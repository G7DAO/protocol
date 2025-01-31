# ControllableWithTerminus
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/security/terminus/ControllableWithTerminus.sol)

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

