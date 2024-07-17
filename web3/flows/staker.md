# `STAKER`: Execution flows for Staker, Game7's permissionless staking protocol

This document enumerates the known execution flows for the [`Staker`](../contracts/staking/Staker.sol)
contract.

This document is used as part of the World Builder team's testing process: https://docs.google.com/document/d/1OEW46qwIq1_W3V8u8JDZvrM1ElxwiGEs6LLPdsYXndA/edit?usp=sharing

## Deployment and setup

### `STAKER-*`: Anybody should be able to deploy a Staker contract.

Any account should be able to deploy a `Staker` contract. The constructor should not revert.

### `STAKER-*`: The `Staker` implements ERC721

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

### `STAKER-*`: Token types

`Staker` uses special `uint256` values to denote the different types of tokens it accepts as stakes.

These special values are:
1. `1` for native token staking - this is signified by the `NATIVE_TOKEN_TYPE()` method on the `Staker`
2. `20` for ERC20 token staking - this is signified by the `ERC20_TOKEN_TYPE()` method on the `Staker`
3. `721` for ERC721 token staking - this is signified by the `ERC721_TOKEN_TYPE()` method on the `Staker`
4. `1155` for ERC1155 token staking - this is signified by the `ERC1155_TOKEN_TYPE()` method on the `Staker`

## Creating staking pools

### `STAKER-*`: Any account should be able to create a staking pool for native tokens

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

### `STAKER-*`: Any account should be able to create a staking pool for ERC20 tokens

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

### `STAKER-*`: Any account should be able to create a staking pool for ERC721 tokens

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

### `STAKER-*`: Any account should be able to create a staking pool for ERC1155 tokens

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

### `STAKER-*`: Staking pool IDs should start at `0` and increase sequentially

This behavior should not depend on the pool configuration.

### `STAKER-*`: It should not be possible to create a staking pool for a token of an unknown type

If a user tries to call `createPool` using a type that isn't one of `1` (native token), `20` (ERC20),
`721` (ERC721), or `1155` (ERC1155), the message should revert with an error having the following signature:

```
    error InvalidTokenType();
```

### `STAKER-*`: It should not be possible to create native token staking pools with non-zero token address or token ID

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

### `STAKER-*`: It should not be possible to create ERC20 token staking pools with zero token address or non-zero token ID

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

### `STAKER-*`:  It should not be possible to create ERC721 token staking pools with zero token address or non-zero token ID

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

### `STAKER-*`:  It should not be possible to create ERC1155 token staking pools with zero token address

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

### `STAKER-*`: It should be possible to create ERC1155 token staking pools in which the token ID is zero

This is a specific test that there is no check for the non-zeroness of the token ID being performed on the
creation of ERC1155 staking pools.

## Administration of staking pools

### `STAKER-*`: An administrator should be able to modify any subset of the configuration parameters on a pool in a single transaction

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

### `STAKER-*`: A non-administrator (of any pool) should not be able to change any of the parameters of a staking pool

Messages from a non-administrator to make such a change should revert with the following error:

```
    error NonAdministrator();
```

### `STAKER-*`: A non-administrator (of any pool) should not be able to change any of the parameters of a staking pool, even if they are administrators of a different pool

Messages from a non-administrator to make such a change should revert with the following error:

```
    error NonAdministrator();
```

### `STAKER-*`: An administrator of a staking pool should be able to transfer administration of that pool to another account

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

## Staking tokens

