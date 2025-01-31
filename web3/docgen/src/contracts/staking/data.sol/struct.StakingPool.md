# StakingPool
[Git Source](https://github.com/G7DAO/protocol/blob/ef7b24f4a26e9671edc818362f455c3e2801e1d7/contracts/staking/data.sol)

StakingPool represents a staking position that users can adopt.

Anybody can permissionlessly create a staking pool on the Staker contract. The creator
of a pool is automatically designated as its administrator. The current administrator of a pool
can transfer its administration privileges to another account.

The administrator of a staking pool is the only account that can change certain parameters
of the pool, such as whether positions under that staking pool are transferable, the length of
the lockup period for positions staked under that pool, and the length of the cooldown period for
withdrawals for positions staked under that pool.


```solidity
struct StakingPool {
    address administrator;
    uint256 tokenType;
    address tokenAddress;
    uint256 tokenID;
    bool transferable;
    uint256 lockupSeconds;
    uint256 cooldownSeconds;
}
```

