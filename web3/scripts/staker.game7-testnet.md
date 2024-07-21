# `Staker` on the Game7 testnet

### Details

`Staker` contract address on Game7 testnet is `0xA1D917972df7E88904A2aaFd92f5c0dF16ABA77e`.

Deployed in transaction [`0xfaaf6455fa781fb85e4dde990ffb951b7e367245817e5ad5cf5f36e93346dff7`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/tx/0xfaaf6455fa781fb85e4dde990ffb951b7e367245817e5ad5cf5f36e93346dff7).

Staking pool for native token with a 60 second lockup and no cooldown has pool ID `0`. Positions in this
staking pool are transferable. This pool is owned by the zero address, and cannot be modified.

### Set up environment variables

```bash
export RPC="https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz"
export SENDER="<path to keyfile>"
# The following lines were added in the course of this script
export STAKER="0xA1D917972df7E88904A2aaFd92f5c0dF16ABA77e"
export NATIVE_TOKEN_STAKING_POOL_ID="0"
```

### Deploy contract

- [x] Deploy contract

```bash
bin/game7 staker deploy \
    --rpc $RPC \
    --sender $SENDER
```

- [x] Record `Staker` contract address

```bash
export STAKER="0xA1D917972df7E88904A2aaFd92f5c0dF16ABA77e"
```

- [x] Update `Staker` contract address and deployment transaction hash at top of the file.

### Set up TG7 native token staking pool

- [x] Create staking pool for native tokens on the Game7 L3 testnet

```bash
bin/game7 staker create-pool \
    --contract $STAKER \
    --rpc $RPC \
    --keyfile $SENDER \
    --token-address 0x0000000000000000000000000000000000000000 \
    --token-id 0 \
    --token-type 1 \
    --transferable y \
    --lockup-seconds 60 \
    --cooldown-seconds 0
```

- [x] Total number of pools should now be 1

```bash
bin/game7 staker total-pools \
    --contract $STAKER \
    --rpc $RPC
```

Result:

```
0: 1
```

- [x] Pool details for pool 0

```bash
bin/game7 staker pools \
    --contract $STAKER \
    --rpc $RPC \
    --arg-0 0
```

Result:

```
0: {0x9ed191DB1829371F116Deb9748c26B49467a592A 1 0x0000000000000000000000000000000000000000 0 true 60 0}
```

- [x] Export default native token staking pool ID

```
export NATIVE_TOKEN_STAKING_POOL_ID="0"
```

- [x] Add this information to the top of this file.

- [x] Transfer administration of this pool to the zero address

```bash
bin/game7 staker transfer-pool-administration \
    --contract $STAKER \
    --rpc $RPC \
    --keyfile $SENDER \
    --pool-id 0 \
    --new-administrator 0x0000000000000000000000000000000000000000
```

- [x] Pool details for pool 0

```bash
bin/game7 staker pools \
    --contract $STAKER \
    --rpc $RPC \
    --arg-0 0
```

Result:

```
0: {0x0000000000000000000000000000000000000000 1 0x0000000000000000000000000000000000000000 0 true 60 0}
```
