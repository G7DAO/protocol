# Position
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/staking/data.sol)

Position represents the parameters of a staking position:
- the staking pool ID under which the deposit was made
- the amount of tokens deposited under that staking pool (for non-ERC721 token types),
or the tokenID for staking positions involving ERC721 tokens
- the timestamp at which the deposit was made

The address of the depositor is the owner of the ERC721 token representing this deposit, and
is not stored within this struct.


```solidity
struct Position {
    uint256 poolID;
    uint256 amountOrTokenID;
    uint256 stakeTimestamp;
    uint256 unstakeInitiatedAt;
}
```

