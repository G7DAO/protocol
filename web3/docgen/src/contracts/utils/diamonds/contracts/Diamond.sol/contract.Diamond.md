# Diamond
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/utils/diamonds/contracts/Diamond.sol)

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

