# Deploy terminus diamond contract

This checklist describes how to deploy the Terminus diamond contract.

## RPC urls

```json
{
    "rpcUrls": {
        "ArbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc",
        "ArbitrumOrbitConduit": "https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz",
        "ArbitrumOrbitCaldera": "https://game7-testnet.hub.caldera.xyz/",
    },
}
```

## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export OWNER=<Owner Of Diamond>`
- [ ] `export BADGE=<image-url>`
- [ ] `export TERMINUS=<DiamonAddress after deployment>`

## Deploy Terminus contract

- [ ] Deploy Terminus contract

```bash
bin/game7 terminus deploy \
  --rpc $RPC \
  --keyfile $KEY \
  --contract-owner $OWNER 

```

- [ ] Create admin pool

```bash
bin/game7 terminus terminus-facet create-pool-v-2 \
    --rpc $RPC \
    --keyfile $KEY \
    --contract $TERMINUS \
    --burnable 1 \
    --capacity $(python3 -c "print(2**256 -1)") \
    --transferable 0 \
    --pool-uri $BADGE 
```

- [ ] Confirm Admin pool id

```bash
bin/game7 terminus terminus-facet total-pools \
    --rpc $RPC \
    --contract $TERMINUS
```
Output: 1


- [ ] Mint admin badage to OWNER

```bash
bin/game7 terminus terminus-facet mint \
    --rpc $RPC \
    --keyfile $KEY \
    --contract $TERMINUS \
    --to-0 $OWNER \
    --pool-id 1 \
    --amount 1 \
    --data "" 
```