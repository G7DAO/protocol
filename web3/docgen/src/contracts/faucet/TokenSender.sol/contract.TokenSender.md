# TokenSender
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/faucet/TokenSender.sol)

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

