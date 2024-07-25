# `STAKER`: Execution flows for Staker, Game7's permissionless staking protocol

This document enumerates the known execution flows for the [`Staker`](../contracts/staking/Staker.sol)
contract.

This document is used as part of the World Builder team's testing process: https://docs.google.com/document/d/1OEW46qwIq1_W3V8u8JDZvrM1ElxwiGEs6LLPdsYXndA/edit?usp=sharing

## Flows

### Deployment and setup

#### `STAKER-1`: Anybody should be able to deploy a Staker contract.

Any account should be able to deploy a `Staker` contract. The constructor should not revert.

#### `STAKER-2`: The `Staker` implements ERC721

`Staker` implements the ERC721 token standard. Specifically, it implements the following interfaces:
1. `ERC721`
2. `ERC721Metadata`
3. `ERC721Enumerable`

After deployment, its `supportsInterface` method should return `true` when queried with the following interface IDs:
1. `0x80ac58cd` (interface ID for `ERC721`)
2. `0x5b5e139f` (interface ID for `ERC721Metadata`)
3. `0x780e9d63` (interface ID for `ERC721Enumerable`)

The ERC721 metadata must also be set correctly. The `name()` method should return `"Game7 Staker"`, and
the `symbol()` method should return `"G7STAKER"`.

#### `STAKER-3`: Token types

`Staker` uses special `uint256` values to denote the different types of tokens it accepts as stakes.

These special values are:
1. `1` for native token staking - this is signified by the `NATIVE_TOKEN_TYPE()` method on the `Staker`
2. `20` for ERC20 token staking - this is signified by the `ERC20_TOKEN_TYPE()` method on the `Staker`
3. `721` for ERC721 token staking - this is signified by the `ERC721_TOKEN_TYPE()` method on the `Staker`
4. `1155` for ERC1155 token staking - this is signified by the `ERC1155_TOKEN_TYPE()` method on the `Staker`

## Creating staking pools

#### `STAKER-4`: Any account should be able to create a staking pool for native tokens

Any account should be able to create a staking pool for native tokens. That the staking pool is for
native tokens should be reflected in the pool parameters.

The account which created the pool should be marked as the administrator of that pool on creation.

The creation of the staking pool should emit a `StakingPoolCreated` event of the signature:

```
    event StakingPoolCreated(
        uint256 indexed poolID,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 tokenID
    );
```

#### `STAKER-5`: Any account should be able to create a staking pool for ERC20 tokens

Any account should be able to create a staking pool for ERC20 tokens. That the staking pool is for
ERC20 tokens should be reflected in the pool parameters.

The account which created the pool should be marked as the administrator of that pool on creation.

The creation of the staking pool should emit a `StakingPoolCreated` event of the signature:

```
    event StakingPoolCreated(
        uint256 indexed poolID,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 tokenID
    );
```

#### `STAKER-6`: Any account should be able to create a staking pool for ERC721 tokens

Any account should be able to create a staking pool for ERC721 tokens. That the staking pool is for
ERC721 tokens should be reflected in the pool parameters.

The account which created the pool should be marked as the administrator of that pool on creation.

The creation of the staking pool should emit a `StakingPoolCreated` event of the signature:

```
    event StakingPoolCreated(
        uint256 indexed poolID,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 tokenID
    );
```

#### `STAKER-7`: Any account should be able to create a staking pool for ERC1155 tokens

Any account should be able to create a staking pool for ERC1155 tokens. That the staking pool is for
ERC1155 tokens should be reflected in the pool parameters.

The account which created the pool should be marked as the administrator of that pool on creation.

The creation of the staking pool should emit a `StakingPoolCreated` event of the signature:

```
    event StakingPoolCreated(
        uint256 indexed poolID,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 tokenID
    );
```

#### `STAKER-8`: Staking pool IDs should start at `0` and increase sequentially

This behavior should not depend on the pool configuration.

#### `STAKER-9`: It should not be possible to create a staking pool for a token of an unknown type

If a user tries to call `createPool` using a type that isn't one of `1` (native token), `20` (ERC20),
`721` (ERC721), or `1155` (ERC1155), the message should revert with an error having the following signature:

```
    error InvalidTokenType();
```

#### `STAKER-10`: It should not be possible to create native token staking pools with non-zero token address or token ID

`createPool` has the following signature:

```solidity
    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external;
```

If `tokenType == 1`, then `tokenAddress` and `tokenID` must both be zero. If either one is non-zero, the
message should revert with an error having the following signature:

```
    error InvalidConfiguration();
```

#### `STAKER-11`: It should not be possible to create ERC20 token staking pools with zero token address or non-zero token ID

`createPool` has the following signature:

```solidity
    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external;
```

If `tokenType == 20`, then `tokenAddress` must be non-zero and `tokenID` must be zero. If either condition is violated,
the message should revert with an error having the following signature:

```
    error InvalidConfiguration();
```

#### `STAKER-12`:  It should not be possible to create ERC721 token staking pools with zero token address or non-zero token ID

`createPool` has the following signature:

```solidity
    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external;
```

If `tokenType == 721`, then `tokenAddress` must be non-zero and `tokenID` must be zero. If either condition is violated,
the message should revert with an error having the following signature:

```
    error InvalidConfiguration();
```

#### `STAKER-13`:  It should not be possible to create ERC1155 token staking pools with zero token address

`createPool` has the following signature:

```solidity
    function createPool(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenID,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    ) external;
```

If `tokenType == 1155`, then `tokenAddress` must be non-zero. If this condition is violated, the message
should revert with an error having the following signature:

```
    error InvalidConfiguration();
```

#### `STAKER-14`: It should be possible to create ERC1155 token staking pools in which the token ID is zero

This is a specific test that there is no check for the non-zeroness of the token ID being performed on the
creation of ERC1155 staking pools.

### Administration of staking pools

#### `STAKER-15`: An administrator should be able to modify any subset of the configuration parameters on a pool in a single transaction

The current configuration of the staking pool with ID `poolID` can be viewed by calling `Pools(poolID)`. The return value is
a struct of this form:

```
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

Administrators should be able to change the value of the following parameters:

1. `transferable`
2. `lockupSeconds`
3. `cooldownSeconds`

This should be possible using the following method:

```
    function updatePoolConfiguration(
        uint256 poolID,
        bool changeTransferability,
        bool transferable,
        bool changeLockup,
        uint256 lockupSeconds,
        bool changeCooldown,
        uint256 cooldownSeconds
    ) external;
```

Successful configuration changes should emit an event with the following signature:

```
    event StakingPoolConfigured(
        uint256 indexed poolID,
        address indexed administrator,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    );
```

#### `STAKER-16`: A non-administrator (of any pool) should not be able to change any of the parameters of a staking pool

Messages from a non-administrator to make such a change should revert with the following error:

```
    error NonAdministrator();
```

#### `STAKER-17`: A non-administrator (of any pool) should not be able to change any of the parameters of a staking pool, even if they are administrators of a different pool

Messages from a non-administrator to make such a change should revert with the following error:

```
    error NonAdministrator();
```

#### `STAKER-18`: An administrator of a staking pool should be able to transfer administration of that pool to another account

This should emit a `StakingPoolConfigured` event, which has the following signature:

```
    event StakingPoolConfigured(
        uint256 indexed poolID,
        address indexed administrator,
        bool transferable,
        uint256 lockupSeconds,
        uint256 cooldownSeconds
    );
```

The new administrator must be able to configure the pool.

The old administrator should no longer be able to configure the pool. After they have transferred ownership,
any attempt they make to configure the pool should raise an error with signature:

```
    error NonAdministrator();
```

#### `STAKER-113`: A non-administrator (of any pool) should not be able to transfer administration of that pool to another account

Any attempt should revert with

```
    error NonAdministrator();
```

#### `STAKER-114`: A non-administrator of a staking pool should not be able to transfer administration of that pool to another account, even if they are an administrator of another pool

Any attempt should revert with

```
    error NonAdministrator();
```


### Staking and unstaking tokens

#### `STAKER-19`: A holder should be able to stake any number of native tokens into a native token staking position.

The amount of native token staked should be transferred from the holder's account to the `Staker` contract.

This should emit a `Staked` event:

```
    event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

It should also emit an ERC721 `Transfer` event representing the staking position token being minted to the holder.


#### `STAKER-20`: A holder should be able to stake any number of ERC20 tokens into an ERC20 staking position.

The amount of ERC20 token staked should be transferred from the holder's account to the `Staker` contract.

This should emit a `Staked` event:

```
    event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

It should also emit an ERC721 `Transfer` event representing the staking position token being minted to the holder.


#### `STAKER-21`: A holder should be able to stake an ERC721 token into an ERC721 staking position.

The ERC721 token staked should be transferred from the holder's account to the `Staker` contract.

This should emit a `Staked` event:

```
    event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

It should also emit an ERC721 `Transfer` event representing the staking position token being minted to the holder.


#### `STAKER-22`: A holder should be able to stake any number of ERC1155 tokens into an ERC1155 staking position.

The amount of ERC1155 token staked should be transferred from the holder's account to the `Staker` contract.

This should emit a `Staked` event:

```
    event Staked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

It should also emit an ERC721 `Transfer` event representing the staking position token being minted to the holder.

#### `STAKER-23`: Staking position tokens for transferable staking pools should be transferable

If a staking pool is marked as transferable, the ERC721 tokens representing staking positions in that pool should
be transferable.

#### `STAKER-24`: Staking position tokens for non-transferable staking pools should not be transferable

If a staking pool is marked as non-transferable, the ERC721 tokens representing staking positions in that pool should not
be transferable.

Any attempt to transfer such a token should fail with the following error:

```
    error PositionNotTransferable(uint256 positionTokenID);
```

#### `STAKER-25`: If a native token staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token

Unstaking should transfer the position's amount worth of native tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-26`: If an ERC20 staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token

Unstaking should transfer the position's amount worth of ERC20 tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-27`: If an ERC721 staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token

Unstaking should transfer the position's amount worth of ERC721 tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-28`: If an ERC1155 staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token

Unstaking should transfer the position's amount worth of ERC1155 tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-29`: If a native token staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period

Unstaking should transfer the position's amount worth of native tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-30`: If an ERC20 staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period

Unstaking should transfer the position's amount worth of ERC20 tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-31`: If an ERC721 staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period

Unstaking should transfer the position's amount worth of ERC721 tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-32`: If an ERC1155 staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period

Unstaking should transfer the position's amount worth of ERC1155 tokens from the `Staker` contract back to the holder.

The staking position ERC721 token should be burned in the process, emitting the appropriate ERC721 transfer
event.

The unstake operation should emit the `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

#### `STAKER-33`: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-34`: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-35`: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-36`: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-37`: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-38`: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-39`: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-40`: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-49`: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-50`: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-51`: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-52`: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-53`: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-54`: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-55`: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-56`: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period, even if they were the original holder

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-57`: If a native token staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period expires

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-58`: If an ERC20 staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period expires

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-59`: If an ERC721 staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-60`: If an ERC1155 staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-41`: If a native token staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-42`: If an ERC20 staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-43`: If an ERC721 staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-44`: If an ERC1155 staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-45`: If a native token staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-46`: If an ERC20 staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-47`: If an ERC721 staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-48`: If an ERC1155 staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period

Any attempt to do so should result in the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-61`: If a native token staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-62`: If an ERC20 staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-63`: If an ERC721 staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-64`: If an ERC1155 staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-65`: If a native token staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-66`: If an ERC20 staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-67`: If an ERC721 staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-68`: If an ERC1155 staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error LockupNotExpired(uint256 expiresAt);
```

#### `STAKER-69`: If a native token staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-70`: If an ERC20 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-71`: If an ERC721 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-72`: If an ERC1155 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-73`: If a native token staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-74`: If an ERC20 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-75`: If an ERC721 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-76`: If an ERC1155 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired

Any attempt to do so should result in the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-77`: If a native token staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired

The position's `unstakeInitiatedAt` member should reflect the block timestamp of when the unstake was initiated:

```
    struct Position {
        uint256 poolID;
        uint256 amountOrTokenID;
        uint256 stakeTimestamp;
        uint256 unstakeInitiatedAt;
    }
```

The transaction should emit an `UnstakeInitiated` event:

```
    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
```

#### `STAKER-78`: If an ERC20 staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired

The position's `unstakeInitiatedAt` member should reflect the block timestamp of when the unstake was initiated:

```
    struct Position {
        uint256 poolID;
        uint256 amountOrTokenID;
        uint256 stakeTimestamp;
        uint256 unstakeInitiatedAt;
    }
```

The transaction should emit an `UnstakeInitiated` event:

```
    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
```

#### `STAKER-79`: If an ERC721 staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired

The position's `unstakeInitiatedAt` member should reflect the block timestamp of when the unstake was initiated:

```
    struct Position {
        uint256 poolID;
        uint256 amountOrTokenID;
        uint256 stakeTimestamp;
        uint256 unstakeInitiatedAt;
    }
```

The transaction should emit an `UnstakeInitiated` event:

```
    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
```

#### `STAKER-80`: If an ERC1155 staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired

The position's `unstakeInitiatedAt` member should reflect the block timestamp of when the unstake was initiated:

```
    struct Position {
        uint256 poolID;
        uint256 amountOrTokenID;
        uint256 stakeTimestamp;
        uint256 unstakeInitiatedAt;
    }
```

The transaction should emit an `UnstakeInitiated` event:

```
    event UnstakeInitiated(uint256 positionTokenID, address indexed owner);
```

#### `STAKER-81`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent

This means that the `unstakeInitiatedAt` member of the position will not change, and will reflect the block
timestamp of the original `initiateUnstake` transaction. No `UnstakeInitiated` event will be emitted.

#### `STAKER-82`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent

This means that the `unstakeInitiatedAt` member of the position will not change, and will reflect the block
timestamp of the original `initiateUnstake` transaction. No `UnstakeInitiated` event will be emitted.

#### `STAKER-83`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent

This means that the `unstakeInitiatedAt` member of the position will not change, and will reflect the block
timestamp of the original `initiateUnstake` transaction. No `UnstakeInitiated` event will be emitted.

#### `STAKER-84`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent

This means that the `unstakeInitiatedAt` member of the position will not change, and will reflect the block
timestamp of the original `initiateUnstake` transaction. No `UnstakeInitiated` event will be emitted.

#### `STAKER-85`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-86`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-87`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-88`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error InitiateUnstakeFirst(uint256 cooldownSeconds);
```

#### `STAKER-89`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-90`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-91`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-92`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-93`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-94`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-95`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-96`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-97`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable

The amount of native token staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-98`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable

The amount of ERC20 tokens staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-99`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable

The ERC721 token staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-100`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable

The amount of ERC1155 tokens staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-101`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable

The amount of native token staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-102`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable

The amount of ERC20 tokens staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-103`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable

The ERC721 token staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.

#### `STAKER-104`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable

The amount of ERC1155 tokens staked into the position should be transferred from the `Staker` contract to
the position holder.

The position token should be burned.

The transaction shoul emit an `Unstaked` event:

```
    event Unstaked(uint256 positionTokenID, address indexed owner, uint256 indexed poolID, uint256 amountOrTokenID);
```

The transaction should emit an ERC721 `Transfer` event signifying that the poition token was burned.


#### `STAKER-105`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-106`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-107`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-108`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-109`: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-110`: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-111`: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

#### `STAKER-112`: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position

Any attempt to do so should raise the following error:

```
    error UnauthorizedForPosition(address owner, address sender);
```

### Position NFT metadata

#### `STAKER-113`: The ERC721 representing an ERC721 staking position have as its metadata URI a data URI representing an appropriate JSON object

The metadata should indicate:

1. The pool ID under which the position was opened
2. The token ID of the ERC721 token staked into the position
3. The time at which the positon was opened
4. The time at which the lockup on the position expires

#### `STAKER-114`: The ERC721 representing a non-ERC721 staking position have as its metadata URI a data URI representing an appropriate JSON object

The metadata should indicate:

1. The pool ID under which the position was opened
2. The amount of tokens
3. The time at which the positon was opened
4. The time at which the lockup on the position expires

#### `STAKER-115`: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under a native token staking pool

These functions are called via `CurrentAmountInPool(poolID)` and `CurrentPositionsInPool(poolID)`.

#### `STAKER-116`: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC20 staking pool

These functions are called via `CurrentAmountInPool(poolID)` and `CurrentPositionsInPool(poolID)`.

#### `STAKER-117`: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC721 staking pool

These functions are called via `CurrentAmountInPool(poolID)` and `CurrentPositionsInPool(poolID)`.

#### `STAKER-118`: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurately reflect the amount of tokens and number of positions currently open under an ERC1155 staking pool

These functions are called via `CurrentAmountInPool(poolID)` and `CurrentPositionsInPool(poolID)`.

### `STAKER-119`: `CurrentAmountInPool` and `CurrentPositionsInPool` should not be affected by positions opened under other pools

This should be true for all pairs of possible pools.

It can be tested with a single pair of pools.

### `STAKER-120`: For pools without cooldowns, changes to the `lockupSeconds` setting apply to all unstaked users

This tests that when an administrator changes a configuration on a staking pool, the change applies to all open positions immediately.

### `STAKER-121`: For pools with cooldowns, for users who have not yet initiated a cooldown, changes to the `lockupSeconds` setting apply to determine when it is possible for them to `initiateUnstake`

This tests that when an administrator changes a configuration on a staking pool, the change applies to all open positions immediately.

### `STAKER-122`: For pools with cooldowns, for users who have initiated a cooldown already, changes to the `cooldownSeconds` setting apply to their final unstake

This tests that when an administrator changes a configuration on a staking pool, the change applies to all open positions immediately.

### `STAKER-123`: If an administrator changes `transferable` from `true` to `false`, position tokens are no longer transferable even if they were transferable, and were transferred! before

This tests that when an administrator changes a configuration on a staking pool, the change applies to all open positions immediately.

### `STAKER-124`: If an administrator changes `transferable` from `true` to `false`, position tokens that were not transferable before become transferable if so configured

This tests that when an administrator changes a configuration on a staking pool, the change applies to all open positions immediately.

### `STAKER-125`: Position tokens from transferable pools can be staked back into the `Staker`

Because `Staker` positions are ERC721 tokens, as long as the pool under which a position has been opened is transferable,
the position can be staked back into the contract.

### `STAKER-126`: A user must call the correct `stake*` method to stake their tokens.

If a pool has a `tokenType` which doesn't match the `stake*` method that a user is calling, the contract
should revert with:

```
    error IncorrectTokenType(uint256 poolID, uint256 poolTokenType, uint256 tokenTypeArg);
```

### `STAKER-127`: When a user calls `stakeNative`, they must stake a non-zero number of tokens

Otherwise, their transaction should revert with:

```
    error NothingToStake();
```

### `STAKER-128`: When a user calls `stakeERC20`, they must stake a non-zero number of tokens

Otherwise, their transaction should revert with:

```
    error NothingToStake();
```

### `STAKER-129`: When a user calls `stakeERC1155`, they must stake a non-zero number of tokens

Otherwise, their transaction should revert with:

```
    error NothingToStake();
```

### `STAKER-130`: Calls to `tokenURI` for position tokens of unstaked positions should revert

With:

```
    error InvalidTokenType();
```

## Adding new flows

Label the new flows using the syntax `TAG-modifier` with `STAKER` as the `TAG` and `*` as the modifier.
Then run [`graffiti`](../../cmd/graffiti/cmd.go) on this file using:

```bash
graffiti number -i web3/flows/staker.md -o web3/flows/staker.md -t STAKER
```

This will automatically number the new flows while preserving the numbering of the existing flows.
