# Deploy Game7 Token Faucet contract

This checklist describes how to deploy the Game7 Token Faucet.
## RPC urls

```json
{
    "rpcUrls": {
        "Game7 Test net": "https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz",
        "ArbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc",
        "ArbitrumOrbitConduit": "https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz",
        "ArbitrumOrbitCaldera": "https://game7-testnet.hub.caldera.xyz/",
    },
}
```

## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=./.secrets/dao-dev.json`
- [ ] `export DAO=<path to keyfile of caller account>`
- [ ] `export TOKEN0=<address of the Token contract>`
- [ ] `export TOKEN1=<address of the Token contract>`
- [ ] `export FACTORYV2=<address of the Factory contract>`
- [ ] `export IWETH=<address of the IWETH contract>`
- [ ] `export ROUTER02=<address of the ROUTER02>`


## Deployment

- [ ] Deploy Token contract if need to

```bash
bin/game7 token deploy \
  --token-name 'Token 0' \
  --symbol 'TKN0' \
  --decimals 18 \
  --total-supply 100000000000000000000000000000 \
  --rpc $RPC \
  --keyfile $KEY
```

- [ ] Deploy Token contract if need to

```bash
bin/game7 token deploy \
  --token-name 'Token 1' \
  --symbol 'TKN1' \
  --decimals 18 \
  --total-supply 100000000000000000000000000000 \
  --rpc $RPC \
  --keyfile $KEY
```
- [ ] Deploy UniswapV2Factory contract

```bash
bin/game7 uniswap-v2-factory deploy \
    --fee-to-setter $DAO \
    --rpc $RPC \
    --keyfile $KEY
```

- [ ] Deploy UniswapV2Router02

```bash

```

- [ ] Create Pair with UniswapV2Factory contract

```bash
bin/game7 uniswap-v2-factory create-pair \
    --contract $FACTORYV2 \
    --token-a $TOKEN0 \
    --token-b $TOKEN1 \
    --rpc $RPC \
    --keyfile $KEY
```

```bash
bin/game7 uniswap-v2-factory get-pair \
    --contract $FACTORYV2 \
    --arg-0 $TOKEN0 \
    --arg-1 $TOKEN1 \
    --rpc $RPC
```