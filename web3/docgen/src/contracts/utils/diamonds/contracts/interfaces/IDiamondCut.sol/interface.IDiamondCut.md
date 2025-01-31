# IDiamondCut
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/utils/diamonds/contracts/interfaces/IDiamondCut.sol)

\
Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/*****************************************************************************


## Functions
### diamondCut

Add/replace/remove any number of functions and optionally execute
a function with delegatecall


```solidity
function diamondCut(FacetCut[] calldata _diamondCut, address _init, bytes calldata _calldata) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_diamondCut`|`FacetCut[]`|Contains the facet addresses and function selectors|
|`_init`|`address`|The address of the contract or facet to execute _calldata|
|`_calldata`|`bytes`|A function call, including function selector and arguments _calldata is executed with delegatecall on _init|


## Events
### DiamondCut

```solidity
event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);
```

## Structs
### FacetCut

```solidity
struct FacetCut {
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
}
```

## Enums
### FacetCutAction

```solidity
enum FacetCutAction {
    Add,
    Replace,
    Remove
}
```

