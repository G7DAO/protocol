# Mock tokens on the Game7 testnet

### Details

#### Mock ERC20

Contract address: [`0xD80A8A36882431b35b05C2b6A9bc8A6a6a98b536`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/address/0xD80A8A36882431b35b05C2b6A9bc8A6a6a98b536)

Deployment transaction: [`0xcc52156e864c25285769827d97c80e314af7c456121265db6f5e326adf810078`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/tx/0xcc52156e864c25285769827d97c80e314af7c456121265db6f5e326adf810078).


#### Mock ERC721

Contract address: [`0x008dB85178d557a5612941131FDF75028422Df33`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/address/0x008dB85178d557a5612941131FDF75028422Df33)

Deployment transaction: [`0x6207252b8848492163912e71b45d62753fe13ddf40e777345c807fe47a0e81fe`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/tx/0x6207252b8848492163912e71b45d62753fe13ddf40e777345c807fe47a0e81fe)

#### Mock ERC1155

Contract address: [`0x4c2c80e157B3E348FAd4ee749E885888a90C44a3`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/address/0x4c2c80e157B3E348FAd4ee749E885888a90C44a3)

Deployment transaction: [`0x036c8cb7d159f7e3d747d2fb6031360818273a1e27d540539c2da74dc7425a99`](https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz/tx/0x036c8cb7d159f7e3d747d2fb6031360818273a1e27d540539c2da74dc7425a99)


### Set up environment variables

```bash
export RPC="https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz"
export SENDER="<path to keyfile>"
export SENDER_ADDRESS="$(jq -r .address $SENDER)"
# The following lines were added in the course of this script
export MOCK_ERC20="0xD80A8A36882431b35b05C2b6A9bc8A6a6a98b536"
export MOCK_ERC721="0x008dB85178d557a5612941131FDF75028422Df33"
export MOCK_ERC1155="0x4c2c80e157B3E348FAd4ee749E885888a90C44a3"
```

### Setup

- [x] Deploy mock ERC20 contract

```bash
bin/game7 mock erc20 deploy \
    --rpc $RPC \
    --keyfile $SENDER
```

- [x] Mint 1000000000000000000000 ERC20 tokens to self

```bash
bin/game7 mock erc20 mint \
    --rpc $RPC \
    --keyfile $SENDER \
    --contract $MOCK_ERC20 \
    --account $SENDER_ADDRESS \
    --amount 1000000000000000000000
```

- [x] Check ERC20 balance

```bash
bin/game7 mock erc20 balance-of \
    --rpc $RPC \
    --contract $MOCK_ERC20 \
    --account $SENDER_ADDRESS
```

Result:

```
0: 1000000000000000000000
```

- [x] Deploy mock ERC721 contract

```bash
bin/game7 mock erc721 deploy \
    --rpc $RPC \
    --keyfile $SENDER
```

- [x] Mint a token to self

```bash
bin/game7 mock erc721 mint \
    --rpc $RPC \
    --keyfile $SENDER \
    --contract $MOCK_ERC721 \
    --account $SENDER_ADDRESS \
    --token-id 0
```

- [x] Check owner of token 0

```bash
bin/game7 mock erc721 owner-of \
    --rpc $RPC \
    --contract $MOCK_ERC721 \
    --token-id 0
```

Result:

```
0: 0x9ed191DB1829371F116Deb9748c26B49467a592A
```

- [x] Deploy mock ERC1155 contract

```bash
bin/game7 mock erc1155 deploy \
    --rpc $RPC \
    --keyfile $SENDER
```

- [x] Mint 1000 tokens from token ID 0 to self

```bash
bin/game7 mock erc1155 mint \
    --rpc $RPC \
    --keyfile $SENDER \
    --contract $MOCK_ERC1155 \
    --account $SENDER_ADDRESS \
    --amount 1000 \
    --token-id 0
```

- [x] Check token ID 0 balance

```bash
bin/game7 mock erc1155 balance-of \
    --rpc $RPC \
    --contract $MOCK_ERC1155 \
    --account $SENDER_ADDRESS \
    --id 0
```

Result:

```
0: 1000
```
