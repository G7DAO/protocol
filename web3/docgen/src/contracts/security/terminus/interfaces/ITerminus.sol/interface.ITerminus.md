# ITerminus
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/security/terminus/interfaces/ITerminus.sol)


## Functions
### approveForPool


```solidity
function approveForPool(uint256 poolID, address operator) external;
```

### balanceOf


```solidity
function balanceOf(address account, uint256 id) external view returns (uint256);
```

### balanceOfBatch


```solidity
function balanceOfBatch(address[] memory accounts, uint256[] memory ids) external view returns (uint256[] memory);
```

### burn


```solidity
function burn(address from, uint256 poolID, uint256 amount) external;
```

### contractURI


```solidity
function contractURI() external view returns (string memory);
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

### createSimplePool


```solidity
function createSimplePool(uint256 _capacity) external returns (uint256);
```

### isApprovedForAll


```solidity
function isApprovedForAll(address account, address operator) external view returns (bool);
```

### isApprovedForPool


```solidity
function isApprovedForPool(uint256 poolID, address operator) external view returns (bool);
```

### mint


```solidity
function mint(address to, uint256 poolID, uint256 amount, bytes memory data) external;
```

### mintBatch


```solidity
function mintBatch(address to, uint256[] memory poolIDs, uint256[] memory amounts, bytes memory data) external;
```

### paymentToken


```solidity
function paymentToken() external view returns (address);
```

### poolBasePrice


```solidity
function poolBasePrice() external view returns (uint256);
```

### poolIsBurnable


```solidity
function poolIsBurnable(uint256 poolID) external view returns (bool);
```

### poolIsTransferable


```solidity
function poolIsTransferable(uint256 poolID) external view returns (bool);
```

### poolMintBatch


```solidity
function poolMintBatch(uint256 id, address[] memory toAddresses, uint256[] memory amounts) external;
```

### safeBatchTransferFrom


```solidity
function safeBatchTransferFrom(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) external;
```

### safeTransferFrom


```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;
```

### setApprovalForAll


```solidity
function setApprovalForAll(address operator, bool approved) external;
```

### setContractURI


```solidity
function setContractURI(string memory _contractURI) external;
```

### setController


```solidity
function setController(address newController) external;
```

### setPaymentToken


```solidity
function setPaymentToken(address newPaymentToken) external;
```

### setPoolBasePrice


```solidity
function setPoolBasePrice(uint256 newBasePrice) external;
```

### setPoolBurnable


```solidity
function setPoolBurnable(uint256 poolID, bool burnable) external;
```

### setPoolController


```solidity
function setPoolController(uint256 poolID, address newController) external;
```

### setPoolTransferable


```solidity
function setPoolTransferable(uint256 poolID, bool transferable) external;
```

### setURI


```solidity
function setURI(uint256 poolID, string memory poolURI) external;
```

### supportsInterface


```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool);
```

### terminusController


```solidity
function terminusController() external view returns (address);
```

### terminusPoolCapacity


```solidity
function terminusPoolCapacity(uint256 poolID) external view returns (uint256);
```

### terminusPoolController


```solidity
function terminusPoolController(uint256 poolID) external view returns (address);
```

### terminusPoolSupply


```solidity
function terminusPoolSupply(uint256 poolID) external view returns (uint256);
```

### totalPools


```solidity
function totalPools() external view returns (uint256);
```

### unapproveForPool


```solidity
function unapproveForPool(uint256 poolID, address operator) external;
```

### uri


```solidity
function uri(uint256 poolID) external view returns (string memory);
```

### withdrawPayments


```solidity
function withdrawPayments(address toAddress, uint256 amount) external;
```

## Events
### ApprovalForAll

```solidity
event ApprovalForAll(address account, address operator, bool approved);
```

### PoolMintBatch

```solidity
event PoolMintBatch(uint256 id, address operator, address from, address[] toAddresses, uint256[] amounts);
```

### TransferBatch

```solidity
event TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values);
```

### TransferSingle

```solidity
event TransferSingle(address operator, address from, address to, uint256 id, uint256 value);
```

### URI

```solidity
event URI(string value, uint256 id);
```

