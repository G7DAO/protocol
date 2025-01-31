# ERC20OrbitBridger
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/bridge/ERC20OrbitBridger.sol)

**Author:**
Game7 Engineering - worldbuilder@game7.io

This contract is used to bridge any ERC20 token to Orbit Chains automatically calculating gas fees.

*This contract should not hold any funds.*


## State Variables
### DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE

```solidity
uint256 public constant DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = 300;
```


### DEFAULT_GAS_LIMIT

```solidity
uint256 public constant DEFAULT_GAS_LIMIT = 300_000;
```


### isReentrant

```solidity
bool public isReentrant;
```


## Functions
### nonReentrant


```solidity
modifier nonReentrant();
```

### constructor


```solidity
constructor();
```

### bridgeERC20

Bridge ERC20 token to Orbit Chain


```solidity
function bridgeERC20(address _token, uint256 _amount, address _to, address _router) external nonReentrant;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_token`|`address`|Address of the ERC20 token to bridge|
|`_amount`|`uint256`|Amount of the ERC20 token to bridge|
|`_to`|`address`|Address of the recipient on the destination chain|
|`_router`|`address`|Address of the L1ArbitrumGateway contract|


### calculateRetryableSubmissionFee

Calculate the retryable submission fee


```solidity
function calculateRetryableSubmissionFee(bytes memory _calldata, uint256 _baseFee) public pure returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_calldata`|`bytes`|Calldata of the message to be sent|
|`_baseFee`|`uint256`|Base fee of the chain|


