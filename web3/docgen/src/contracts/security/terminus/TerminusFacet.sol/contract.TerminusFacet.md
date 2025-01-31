# TerminusFacet
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/security/terminus/TerminusFacet.sol)

**Inherits:**
[ERC1155WithTerminusStorage](/contracts/security/terminus/ERC1155WithTerminusStorage.sol/contract.ERC1155WithTerminusStorage.md), [TerminusInitializer](/contracts/security/terminus/TerminusInitializer.sol/contract.TerminusInitializer.md)

Authors: Moonstream Engineering (engineering@moonstream.to)
GitHub: https://github.com/bugout-dev/dao
This is an implementation of the Terminus decentralized authorization contract.
Terminus users can create authorization pools. Each authorization pool has the following properties:
1. Controller: The address that controls the pool. Initially set to be the address of the pool creator.
2. Pool URI: Metadata URI for the authorization pool.
3. Pool capacity: The total number of tokens that can be minted in that authorization pool.
4. Pool supply: The number of tokens that have actually been minted in that authorization pool.
5. Transferable: A boolean value which denotes whether or not tokens from that pool can be transfered
between addresses. (Note: Implemented by TerminusStorage.poolNotTransferable since we expect most
pools to be transferable. This negation is better for storage + gas since false is default value
in map to bool.)
6. Burnable: A boolean value which denotes whether or not tokens from that pool can be burned.


## Functions
### constructor


```solidity
constructor();
```

### setController


```solidity
function setController(address newController) external;
```

### poolMintBatch


```solidity
function poolMintBatch(uint256 id, address[] memory toAddresses, uint256[] memory amounts) public;
```

### terminusController


```solidity
function terminusController() external view returns (address);
```

### paymentToken


```solidity
function paymentToken() external view returns (address);
```

### setPaymentToken


```solidity
function setPaymentToken(address newPaymentToken) external;
```

### poolBasePrice


```solidity
function poolBasePrice() external view returns (uint256);
```

### setPoolBasePrice


```solidity
function setPoolBasePrice(uint256 newBasePrice) external;
```

### _paymentTokenContract


```solidity
function _paymentTokenContract() internal view returns (IERC20);
```

### withdrawPayments


```solidity
function withdrawPayments(address toAddress, uint256 amount) external;
```

### contractURI


```solidity
function contractURI() public view returns (string memory);
```

### setContractURI


```solidity
function setContractURI(string memory _contractURI) external;
```

### setURI


```solidity
function setURI(uint256 poolID, string memory poolURI) external;
```

### totalPools


```solidity
function totalPools() external view returns (uint256);
```

### setPoolController


```solidity
function setPoolController(uint256 poolID, address newController) external;
```

### terminusPoolController


```solidity
function terminusPoolController(uint256 poolID) external view returns (address);
```

### terminusPoolCapacity


```solidity
function terminusPoolCapacity(uint256 poolID) external view returns (uint256);
```

### terminusPoolSupply


```solidity
function terminusPoolSupply(uint256 poolID) external view returns (uint256);
```

### poolIsTransferable


```solidity
function poolIsTransferable(uint256 poolID) external view returns (bool);
```

### poolIsBurnable


```solidity
function poolIsBurnable(uint256 poolID) external view returns (bool);
```

### setPoolTransferable


```solidity
function setPoolTransferable(uint256 poolID, bool transferable) external;
```

### setPoolBurnable


```solidity
function setPoolBurnable(uint256 poolID, bool burnable) external;
```

### createSimplePool


```solidity
function createSimplePool(uint256 _capacity) external returns (uint256);
```

### createPoolV1


```solidity
function createPoolV1(uint256 _capacity, bool _transferable, bool _burnable) external returns (uint256);
```

### createPoolV2


```solidity
function createPoolV2(uint256 _capacity, bool _transferable, bool _burnable, string memory poolURI)
    external
    returns (uint256);
```

### mint


```solidity
function mint(address to, uint256 poolID, uint256 amount, bytes memory data) external;
```

### mintBatch


```solidity
function mintBatch(address to, uint256[] memory poolIDs, uint256[] memory amounts, bytes memory data) external;
```

### burn


```solidity
function burn(address from, uint256 poolID, uint256 amount) external;
```

## Events
### PoolMintBatch

```solidity
event PoolMintBatch(
    uint256 indexed id, address indexed operator, address from, address[] toAddresses, uint256[] amounts
);
```

