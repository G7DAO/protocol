// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @notice StakingPool represents a staking position that users can adopt.
 *
 * @notice Anybody can permissionlessly create a staking pool on the Staker contract. The creator
 * of a pool is automatically designated as its administrator. The current administrator of a pool
 * can transfer its administration privileges to another account.
 *
 * @notice The administrator of a staking pool is the only account that can change certain parameters
 * of the pool, such as whether positions under that staking pool are transferable, the length of
 * the lockup period for positions staked under that pool, and the length of the cooldown period for
 * withdrawals for positions staked under that pool.
 */
struct StakingPool {
    address administrator;
    uint256 tokenType;
    address tokenAddress;
    uint256 tokenID;
    bool transferable;
    uint256 lockupSeconds;
    uint256 cooldownSeconds;
}

/**
 * @notice Position represents the parameters of a staking position:
 * - the staking pool ID under which the deposit was made
 * - the amount of tokens deposited under that staking pool (for non-ERC721 token types),
 *   or the tokenID for staking positions involving ERC721 tokens
 * - the timestamp at which the deposit was made
 *
 * @notice The address of the depositor is the owner of the ERC721 token representing this deposit, and
 * is not stored within this struct.
 */
struct Position {
    uint256 poolID;
    uint256 amountOrTokenID;
    uint256 stakeTimestamp;
    uint256 unstakeInitiatedAt;
}
