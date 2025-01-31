# TokenFaucet
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/faucet/TokenFaucet.sol)

**Inherits:**
Ownable

**Author:**
Game7 Engineering Team - worldbuilder@game7.io


## State Variables
### tokenAddress

```solidity
address public tokenAddress;
```


### inboxAddress

```solidity
address public inboxAddress;
```


### faucetAmount

```solidity
uint256 public faucetAmount;
```


### faucetTimeInterval

```solidity
uint256 public faucetTimeInterval;
```


### DEFAULT_GAS_LIMIT

```solidity
uint256 public DEFAULT_GAS_LIMIT = 21000;
```


### lastClaimedL2Timestamp

```solidity
mapping(address => uint256) public lastClaimedL2Timestamp;
```


### lastClaimedL3Timestamp

```solidity
mapping(address => uint256) public lastClaimedL3Timestamp;
```


## Functions
### constructor


```solidity
constructor(
    address _tokenAddress,
    address _owner,
    address _inboxAddress,
    uint256 _faucetAmount,
    uint256 _faucetTimeInterval
) Ownable(_owner);
```

### claim

Claim tokens from the faucet


```solidity
function claim() public;
```

### claimL3

Claim tokens from the faucet on L3


```solidity
function claimL3() public;
```

### setFaucetTimeInterval

Set the faucet time interval

*Only the owner can call this function*


```solidity
function setFaucetTimeInterval(uint256 _faucetTimeInterval) public onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_faucetTimeInterval`|`uint256`|The time interval between claims|


### setFaucetAmount

Set the faucet amount

*Only the owner can call this function*


```solidity
function setFaucetAmount(uint256 _faucetAmount) public onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_faucetAmount`|`uint256`|The amount of tokens to send|


### setTokenAddress

Set the token address

*Only the owner can call this function*


```solidity
function setTokenAddress(address _tokenAddress) public onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_tokenAddress`|`address`|The address of the token to set|


### setInboxAddress

Deposit eth from L2 to L3 to address of the sender if sender is an EOA, and to its aliased address if the sender is a contract

*This does not trigger the fallback function when receiving in the L3 side.
Look into retryable tickets if you are interested in this functionality.*

*This function should not be called inside contract constructors*


```solidity
function setInboxAddress(address _inboxAddress) public onlyOwner;
```

### rescueTokens

Rescue tokens from the contract

*Only the owner can call this function*


```solidity
function rescueTokens(address _token, address _to, uint256 _amount) public onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_token`|`address`|The address of the token to rescue|
|`_to`|`address`|The address to send the rescued tokens to|
|`_amount`|`uint256`|The amount of tokens to rescue|


## Errors
### TokenFaucetClaimIntervalNotPassed

```solidity
error TokenFaucetClaimIntervalNotPassed();
```

