# Diamond
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/utils/diamonds/contracts/Diamond.sol)

\
Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
Implementation of a diamond.
/*****************************************************************************


## Functions
### constructor


```solidity
constructor(address _contractOwner, address _diamondCutFacet) payable;
```

### fallback


```solidity
fallback() external payable;
```

### receive


```solidity
receive() external payable;
```

