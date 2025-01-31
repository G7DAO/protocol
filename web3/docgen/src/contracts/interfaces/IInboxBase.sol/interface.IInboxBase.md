# IInboxBase
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/interfaces/IInboxBase.sol)


## Functions
### bridge


```solidity
function bridge() external view returns (address);
```

### sequencerInbox


```solidity
function sequencerInbox() external view returns (address);
```

### maxDataSize


```solidity
function maxDataSize() external view returns (uint256);
```

### sendL2MessageFromOrigin

Send a generic L2 message to the chain

*This method is an optimization to avoid having to emit the entirety of the messageData in a log. Instead validators are expected to be able to parse the data from the transaction's input*


```solidity
function sendL2MessageFromOrigin(bytes calldata messageData) external returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`messageData`|`bytes`|Data of the message being sent|


### sendL2Message

Send a generic L2 message to the chain

*This method can be used to send any type of message that doesn't require L1 validation*


```solidity
function sendL2Message(bytes calldata messageData) external returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`messageData`|`bytes`|Data of the message being sent|


### sendUnsignedTransaction


```solidity
function sendUnsignedTransaction(
    uint256 gasLimit,
    uint256 maxFeePerGas,
    uint256 nonce,
    address to,
    uint256 value,
    bytes calldata data
) external returns (uint256);
```

### sendContractTransaction


```solidity
function sendContractTransaction(uint256 gasLimit, uint256 maxFeePerGas, address to, uint256 value, bytes calldata data)
    external
    returns (uint256);
```

### calculateRetryableSubmissionFee

Get the L1 fee for submitting a retryable

*This fee can be paid by funds already in the L2 aliased address or by the current message value*

*This formula may change in the future, to future proof your code query this method instead of inlining!!*


```solidity
function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) external view returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`dataLength`|`uint256`|The length of the retryable's calldata, in bytes|
|`baseFee`|`uint256`|The block basefee when the retryable is included in the chain, if 0 current block.basefee will be used|


### pause

pauses all inbox functionality


```solidity
function pause() external;
```

### unpause

unpauses all inbox functionality


```solidity
function unpause() external;
```

### setAllowList

add or remove users from allowList


```solidity
function setAllowList(address[] memory user, bool[] memory val) external;
```

### setAllowListEnabled

enable or disable allowList


```solidity
function setAllowListEnabled(bool _allowListEnabled) external;
```

### isAllowed

check if user is in allowList


```solidity
function isAllowed(address user) external view returns (bool);
```

### allowListEnabled

check if allowList is enabled


```solidity
function allowListEnabled() external view returns (bool);
```

### initialize


```solidity
function initialize(address _bridge, address _sequencerInbox) external;
```

### getProxyAdmin

returns the current admin


```solidity
function getProxyAdmin() external view returns (address);
```

