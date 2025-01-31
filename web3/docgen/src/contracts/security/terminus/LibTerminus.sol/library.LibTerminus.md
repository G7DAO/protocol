# LibTerminus
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/security/terminus/LibTerminus.sol)

Authors: Moonstream Engineering (engineering@moonstream.to)
GitHub: https://github.com/bugout-dev/dao
Common storage structure and internal methods for Moonstream DAO Terminus contracts.
As Terminus is an extension of ERC1155, this library can also be used to implement bare ERC1155 contracts
using the common storage pattern (e.g. for use in diamond proxies).


## State Variables
### TERMINUS_STORAGE_POSITION

```solidity
bytes32 constant TERMINUS_STORAGE_POSITION = keccak256("game7.storage.terminus");
```


## Functions
### terminusStorage


```solidity
function terminusStorage() internal pure returns (TerminusStorage storage es);
```

### setController


```solidity
function setController(address newController) internal;
```

### enforceIsController


```solidity
function enforceIsController() internal view;
```

### setTerminusActive


```solidity
function setTerminusActive(bool active) internal;
```

### setPoolController


```solidity
function setPoolController(uint256 poolID, address newController) internal;
```

### createSimplePool


```solidity
function createSimplePool(uint256 _capacity) internal returns (uint256);
```

### enforcePoolIsController


```solidity
function enforcePoolIsController(uint256 poolID, address maybeController) internal view;
```

### _isApprovedForPool


```solidity
function _isApprovedForPool(uint256 poolID, address operator) internal view returns (bool);
```

### _approveForPool


```solidity
function _approveForPool(uint256 poolID, address operator) internal;
```

### _unapproveForPool


```solidity
function _unapproveForPool(uint256 poolID, address operator) internal;
```

## Events
### ControlTransferred

```solidity
event ControlTransferred(address indexed previousController, address indexed newController);
```

### PoolControlTransferred

```solidity
event PoolControlTransferred(uint256 indexed poolID, address indexed previousController, address indexed newController);
```

## Structs
### TerminusStorage

```solidity
struct TerminusStorage {
    address controller;
    bool isTerminusActive;
    uint256 currentPoolID;
    address paymentToken;
    uint256 poolBasePrice;
    mapping(uint256 => address) poolController;
    mapping(uint256 => string) poolURI;
    mapping(uint256 => uint256) poolCapacity;
    mapping(uint256 => uint256) poolSupply;
    mapping(uint256 => mapping(address => uint256)) poolBalances;
    mapping(uint256 => bool) poolNotTransferable;
    mapping(uint256 => bool) poolBurnable;
    mapping(address => mapping(address => bool)) globalOperatorApprovals;
    mapping(uint256 => mapping(address => bool)) globalPoolOperatorApprovals;
    string contractURI;
}
```

