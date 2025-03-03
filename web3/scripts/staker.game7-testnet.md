# `Staker` on the Game7 testnet

### Details

`Staker` contract address on Game7 testnet is `0x8d89Efe97d40DE393d1A7c01ea0231529199fAf3`.

Deployed in transaction [`0xa4bbb9418397c208d96ed976dd3aabe566228071e98b1dcf986aa7fe3651b3a5`](https://testnet.game7.io/tx/0xa4bbb9418397c208d96ed976dd3aabe566228071e98b1dcf986aa7fe3651b3a5).

`PositionMetadata` contract address on Game7 testnet is `0x827b5A3f6705a9F15c514Ad6DD9BD45F1b096cb9`

Deployed in transaction [`0x6845f141dadca4f6a12801d9ae7aadf92e026c03110cd98fd547f6e17dca0f96`](https://testnet.game7.io/tx/0x6845f141dadca4f6a12801d9ae7aadf92e026c03110cd98fd547f6e17dca0f96).

Staking pool for native token with a 60 second lockup and no cooldown has pool ID `0`. Positions in this
staking pool are transferable. This pool is owned by the zero address, and cannot be modified.

### Set up environment variables

```bash
export RPC="https://testnet-rpc.game7.io"
export KEYFILE="<Path to keyfile>"
# The following lines were added in the course of this script
export STAKER="0x8d89Efe97d40DE393d1A7c01ea0231529199fAf3"
export NATIVE_TOKEN_STAKING_POOL_ID="0"
export POSITION_METADATA='0x827b5A3f6705a9F15c514Ad6DD9BD45F1b096cb9'
export ADMINISTRATOR='<Set as wallet address of creator>'
export NATIVESYMBOL="G7"
```

### Deploy Staker Metadata contract

- [x] Deploy contract
- [x] Verify contract

```bash
bin/game7 staker-metadata deploy \
    --rpc $RPC \
    --keyfile $KEYFILE \
    --display-native-symbol $NATIVESYMBOL
```

- [x] Record `PositionMetadata` contract address

```bash
export POSITION_METADATA='0x827b5A3f6705a9F15c514Ad6DD9BD45F1b096cb9'
```

- [x] Update `PositionMetadata` contract address and deployment transaction hash at top of the file.

### Deploy Staker contract

- [x] Deploy contract
- [x] Verify contract

```bash
bin/game7 staker deploy \
    --rpc $RPC \
    --keyfile $KEYFILE \
    --position-metadata $POSITION_METADATA
```

- [x] Record `Staker` contract address

```bash
export STAKER="0x8d89Efe97d40DE393d1A7c01ea0231529199fAf3"
```

- [x] Update `Staker` contract address and deployment transaction hash at top of the file.

### Set up TG7 native token staking pool

- [x] Create staking pool for native tokens on the Game7 L3 testnet

```bash
bin/game7 staker create-pool \
    --contract $STAKER \
    --rpc $RPC \
    --keyfile $KEYFILE \
    --token-address 0x0000000000000000000000000000000000000000 \
    --token-id 0 \
    --token-type 1 \
    --transferable y \
    --lockup-seconds 60 \
    --cooldown-seconds 0 \
    --administrator $ADMINISTRATOR
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
0: {0xfBca6F618BF24eB5FC1aC544ae2F70b24fFD0e15 1 0x0000000000000000000000000000000000000000 0 true 60 0}
```

- [x] Export default native token staking pool ID

```bash
export NATIVE_TOKEN_STAKING_POOL_ID="0"
```

- [x] Add this information to the top of this file.

- [x] Transfer administration of this pool to the zero address

```bash
bin/game7 staker transfer-pool-administration \
    --contract $STAKER \
    --rpc $RPC \
    --keyfile $KEYFILE \
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

### Staking into the pool

- [x] Check the number of staking positions that exist on the contract

```bash
bin/game7 staker total-supply \
    --contract $STAKER \
    --rpc $RPC
```

Result:

```
0: 0
```

- [x] Stake 100000000000000000 wei worth of TG7 into the pool

```bash
export POSITION_HOLDER='0xfbca6f618bf24eb5fc1ac544ae2f70b24ffd0e15'
```


```bash
bin/game7 staker stake-native \
    --contract $STAKER \
    --rpc $RPC \
    --keyfile $KEYFILE \
    --pool-id $NATIVE_TOKEN_STAKING_POOL_ID \
    --position-holder $POSITION_HOLDER \
    --value 111111111111111111
```

Transaction: [`0x26f0b702bdbef7d34aa5021e9c32e940ebbae0426f9d2214d8f105a8f5606beb`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/tx/0x26f0b702bdbef7d34aa5021e9c32e940ebbae0426f9d2214d8f105a8f5606beb)

- [x] Check the number of staking positions that exist on the contract

```bash
bin/game7 staker total-supply \
    --contract $STAKER \
    --rpc $RPC
```

Result:

```
0: 1
```

- [x] Check the owner of position token with ID 0

```bash
bin/game7 staker owner-of \
    --contract $STAKER \
    --rpc $RPC \
    --token-id 0
```

Result:

```
0: 0xfBca6F618BF24eB5FC1aC544ae2F70b24fFD0e15
```

- [x] Read the position information for this position

```bash
bin/game7 staker positions \
    --contract $STAKER \
    --rpc $RPC \
    --arg-0 0
```

Result:

```
0: {0 100000000000000000 1732046370 0}
```

- [x] Unstake the position

```bash
bin/game7 staker unstake \
    --contract $STAKER \
    --rpc $RPC \
    --keyfile $KEYFILE \
    --position-token-id 0
```

Transaction: [`0xc164c8f5db6a197577f44018daee43ba9b67c4d43080e2e41cb63fb02c123c3a`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/tx/0xc164c8f5db6a197577f44018daee43ba9b67c4d43080e2e41cb63fb02c123c3a)
