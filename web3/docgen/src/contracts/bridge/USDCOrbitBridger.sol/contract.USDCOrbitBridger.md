# USDCOrbitBridger
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/bridge/USDCOrbitBridger.sol)

**Author:**
Game7 Engineering - worldbuilder@game7.io

This contract is used to bridge any ERC20 token to Orbit Chains in a single transaction.

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


### gateway

```solidity
address public gateway;
```


### router

```solidity
address public router;
```


### customNativeToken

```solidity
address public customNativeToken;
```


### usdc

```solidity
address public usdc;
```


## Functions
### constructor

Constructor


```solidity
constructor(address _gateway, address _router, address _usdc, address _customNativeToken);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_gateway`|`address`|Address of the token gateway|
|`_router`|`address`|Address of the router|
|`_usdc`|`address`|Address of the USDC token|
|`_customNativeToken`|`address`|Address of the custom native token|


### bridgeUSDC

Bridge USDC to Orbit Chain


```solidity
function bridgeUSDC(address _receiver, uint256 _amount) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_receiver`|`address`|Address of the recipient on the destination chain|
|`_amount`|`uint256`|Amount of USDC to bridge|


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


