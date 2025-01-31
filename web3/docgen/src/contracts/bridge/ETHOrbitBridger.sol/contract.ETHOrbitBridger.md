# ETHOrbitBridger
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/bridge/ETHOrbitBridger.sol)

**Author:**
Game7 Engineering - worldbuilder@game7.io

This contract is used to bridge ETH to Orbit Chains in a single transaction.


## State Variables
### DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE

```solidity
uint256 public constant DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = 300;
```


### DEFAULT_GAS_LIMIT

```solidity
uint256 public constant DEFAULT_GAS_LIMIT = 300_000;
```


### standardGateway

```solidity
address public standardGateway;
```


### router

```solidity
address public router;
```


### weth

```solidity
address public weth;
```


### customNativeToken

```solidity
address public customNativeToken;
```


## Functions
### constructor


```solidity
constructor(address _standardGateway, address _router, address _weth, address _customNativeToken);
```

### bridge


```solidity
function bridge(address _receiver) external payable;
```

### calculateRetryableSubmissionFee


```solidity
function calculateRetryableSubmissionFee(bytes memory _calldata, uint256 _baseFee) public pure returns (uint256);
```

