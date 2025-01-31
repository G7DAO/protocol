# IERC20Bridge
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/interfaces/IERC20Bridge.sol)


## Functions
### nativeToken

*token that is escrowed in bridge on L1 side and minted on L2 as native currency.
Fees are paid in this token. There are certain restrictions on the native token:
- The token can't be rebasing or have a transfer fee
- The token must only be transferrable via a call to the token address itself
- The token must only be able to set allowance via a call to the token address itself
- The token must not have a callback on transfer, and more generally a user must not be able to make a transfer to themselves revert*


```solidity
function nativeToken() external view returns (address);
```

### nativeTokenDecimals

*number of decimals used by the native token
This is set on bridge initialization using nativeToken.decimals()
If the token does not have decimals() method, we assume it have 0 decimals*


```solidity
function nativeTokenDecimals() external view returns (uint8);
```

### enqueueDelayedMessage

*Enqueue a message in the delayed inbox accumulator.
These messages are later sequenced in the SequencerInbox, either
by the sequencer as part of a normal batch, or by force inclusion.*


```solidity
function enqueueDelayedMessage(uint8 kind, address sender, bytes32 messageDataHash, uint256 tokenFeeAmount)
    external
    returns (uint256);
```

### initialize


```solidity
function initialize(address rollup_, address nativeToken_) external;
```

