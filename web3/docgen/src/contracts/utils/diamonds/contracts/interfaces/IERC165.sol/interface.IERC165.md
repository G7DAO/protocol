# IERC165
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/utils/diamonds/contracts/interfaces/IERC165.sol)


## Functions
### supportsInterface

Query if a contract implements an interface

*Interface identification is specified in ERC-165. This function
uses less than 30,000 gas.*


```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`interfaceId`|`bytes4`|The interface identifier, as specified in ERC-165|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`bool`|`true` if the contract implements `interfaceID` and `interfaceID` is not 0xffffffff, `false` otherwise|


