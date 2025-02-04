# IERC20Inbox
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/interfaces/IERC20Inbox.sol)


## Functions
### depositERC20

Deposit native token from L1 to L2 to address of the sender if sender is an EOA, and to its aliased address if the sender is a contract

*This does not trigger the fallback function when receiving in the L2 side.
Look into retryable tickets if you are interested in this functionality.*

*This function should not be called inside contract constructors*


```solidity
function depositERC20(uint256 amount) external returns (uint256);
```

### createRetryableTicket

Put a message in the L2 inbox that can be reexecuted for some fixed amount of time if it reverts

*all tokenTotalFeeAmount will be deposited to callValueRefundAddress on L2*

*Gas limit and maxFeePerGas should not be set to 1 as that is used to trigger the RetryableData error*


```solidity
function createRetryableTicket(
    address to,
    uint256 l2CallValue,
    uint256 maxSubmissionCost,
    address excessFeeRefundAddress,
    address callValueRefundAddress,
    uint256 gasLimit,
    uint256 maxFeePerGas,
    uint256 tokenTotalFeeAmount,
    bytes calldata data
) external returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`to`|`address`|destination L2 contract address|
|`l2CallValue`|`uint256`|call value for retryable L2 message|
|`maxSubmissionCost`|`uint256`|Max gas deducted from user's L2 balance to cover base submission fee|
|`excessFeeRefundAddress`|`address`|gasLimit x maxFeePerGas - execution cost gets credited here on L2 balance|
|`callValueRefundAddress`|`address`|l2Callvalue gets credited here on L2 if retryable txn times out or gets cancelled|
|`gasLimit`|`uint256`|Max gas deducted from user's L2 balance to cover L2 execution. Should not be set to 1 (magic value used to trigger the RetryableData error)|
|`maxFeePerGas`|`uint256`|price bid for L2 execution. Should not be set to 1 (magic value used to trigger the RetryableData error)|
|`tokenTotalFeeAmount`|`uint256`|amount of fees to be deposited in native token to cover for retryable ticket cost|
|`data`|`bytes`|ABI encoded data of L2 message|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`uint256`|unique message number of the retryable transaction|


### unsafeCreateRetryableTicket

Put a message in the L2 inbox that can be reexecuted for some fixed amount of time if it reverts

*Same as createRetryableTicket, but does not guarantee that submission will succeed by requiring the needed funds
come from the deposit alone, rather than falling back on the user's L2 balance*

*Advanced usage only (does not rewrite aliases for excessFeeRefundAddress and callValueRefundAddress).
createRetryableTicket method is the recommended standard.*

*Gas limit and maxFeePerGas should not be set to 1 as that is used to trigger the RetryableData error*


```solidity
function unsafeCreateRetryableTicket(
    address to,
    uint256 l2CallValue,
    uint256 maxSubmissionCost,
    address excessFeeRefundAddress,
    address callValueRefundAddress,
    uint256 gasLimit,
    uint256 maxFeePerGas,
    uint256 tokenTotalFeeAmount,
    bytes calldata data
) external returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`to`|`address`|destination L2 contract address|
|`l2CallValue`|`uint256`|call value for retryable L2 message|
|`maxSubmissionCost`|`uint256`|Max gas deducted from user's L2 balance to cover base submission fee|
|`excessFeeRefundAddress`|`address`|gasLimit x maxFeePerGas - execution cost gets credited here on L2 balance|
|`callValueRefundAddress`|`address`|l2Callvalue gets credited here on L2 if retryable txn times out or gets cancelled|
|`gasLimit`|`uint256`|Max gas deducted from user's L2 balance to cover L2 execution. Should not be set to 1 (magic value used to trigger the RetryableData error)|
|`maxFeePerGas`|`uint256`|price bid for L2 execution. Should not be set to 1 (magic value used to trigger the RetryableData error)|
|`tokenTotalFeeAmount`|`uint256`|amount of fees to be deposited in native token to cover for retryable ticket cost|
|`data`|`bytes`|ABI encoded data of L2 message|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`uint256`|unique message number of the retryable transaction|


