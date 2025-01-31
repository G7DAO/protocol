# TokenSender
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/faucet/TokenSender.sol)

**Author:**
Game7 Engineering Team - worldbuilder@game7.io

Contract used by the Game7 testnet faucet accounts to apply validations before sending tokens.


## State Variables
### faucetTimeInterval

```solidity
uint256 public faucetTimeInterval;
```


### lastSentTimestamp

```solidity
mapping(address => uint256) public lastSentTimestamp;
```


## Functions
### constructor


```solidity
constructor(uint256 _faucetTimeInterval);
```

### send

Send msg.value native tokens to the given recipient, applying the validations from this
TokenSender contract


```solidity
function send(address recipient) external payable;
```

## Events
### TokensSent

```solidity
event TokensSent(address indexed sender, address indexed recipient, uint256 amount);
```

## Errors
### TokenSenderClaimIntervalNotPassed

```solidity
error TokenSenderClaimIntervalNotPassed(address recipient);
```

