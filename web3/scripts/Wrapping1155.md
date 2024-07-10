# Deploy Game7 Dex contract

This checklist describes how to deploy the Game7 Dex-Demo using uniswap verison 2 of proof of liquidity.
## RPC urls

```json
{
    "rpcUrls": {
        "Game7 Test net": "https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz",
        "ArbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc",
        "ArbitrumOrbitConduit": "https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz",
        "ArbitrumOrbitCaldera": "https://game7-testnet.hub.caldera.xyz/",
    },
    "WrappedNativeTokens": {
        "Game7 Test net" : "0x6B885D96916D18CD78E44B42C6489CA6f8794565",
    },
    "ETHERMeasurments": {
        "ether": "1000000000000000000",
    },
}
```

## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export DAO=<path to keyfile of caller account>`
- [ ] `export TOKEN0=<address of the Token contract>` 
- [ ] `export TOKEN1=<address of the Token contract>`
- [ ] `export WRAPPERFACTORY=<address of the Factory contract>`
- [ ] `export ERC1155=<address of erc1155>`
- [ ] `export ERC1155TOKENID=<TOKENID of FT>`
- [ ] `export MINTAMOUNT=<amount to mint for single ID>`
- [ ] `export WRAPPINGFUNCTIONS=<address of functions to wrap>`
- [ ] `export DEXW1155=<address of a 1155 wrapped token id>`


- [ ] Deploy Wrapper Factory

```Bash
bin/game7 wrapper-1155-factory deploy \
  --rpc $RPC \
  --keyfile $KEY
```

- [ ] Deploy Wrapper Functions
```Bash
bin/game7 wrapper-functions deploy \
  --rpc $RPC \
  --keyfile $KEY
  --factory $FACTORY

```

- [ ] Deploy TestERC1155 just for testing

```Bash
bin/game7 test-erc-1155 deploy \
  --rpc $RPC \
  --keyfile $KEY
```

- [ ] Mint test 1155
```bash
bin/game7 test-erc-1155 mint \
  --rpc $RPC \
  --keyfile $KEY \
  --contract $ERC1155 \
  --id $ERC1155TOKENID \
  --value-0 $MINTAMOUNT
```

 - [ ] Create a Wrapped1155
 ```bash
bin/game7 wrapper-1155-factory create-20 \
    --rpc $RPC \
    --keyfile $KEY \
    --contract $FACTORY \
    ---contract-0 $ERC1155 \
    --token-id $ERC1155TOKENID
 ```

- [ ] Check for DEXW1155
```bash
bin/game7 wrapper-1155-factory get-1155-wrapper \
    --contract $FACTORY \
    ---contract $ERC1155 \
    --token-id $ERC1155TOKENID
```

- [ ] Wrapp 1155s into 20s
```Bash
bin/game7 wrapper-functions wrap-1155 \
    --rpc $RPC \
    --keyfile $KEY \
    --contract WRAPPINGFUNCTIONS \
    --erc-1155-contract $ERC1155 \
    --token-id $ERC1155TOKENID \
    --amount $MINTAMOUNT \
    --to-0 $DAO
```

