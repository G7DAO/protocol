# IERC173
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/utils/diamonds/contracts/interfaces/IERC173.sol)


## Functions
### owner

Get the address of the owner


```solidity
function owner() external view returns (address owner_);
```
**Returns**

|Name|Type|Description|
|----|----|-----------|
|`owner_`|`address`|The address of the owner.|


### transferOwnership

Set the address of the new owner of the contract

*Set _newOwner to address(0) to renounce any ownership.*


```solidity
function transferOwnership(address _newOwner) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_newOwner`|`address`|The address of the new owner of the contract|


## Events
### OwnershipTransferred
*This emits when ownership of a contract changes.*


```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

