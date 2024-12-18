# Deploy dropper diamond contract

This checklist describes how to deploy the Dropper diamond contract.

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

### Required Variables
- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export OWNER=<Owner Of Diamond>`
- [ ] `export BADGE=<image-url>`
- [ ] `export ADMIN_TERMINUS_ADDRESS=<Terminus Address>`
- [ ] `export ADMIN_POOL_ID=<tokenId of terminus pool to control dropper>`
### Opitional Varialable
- [ ] `export DIAMOND_CUT_FACET=<address of pre-existing diamond cut facet>`
- [ ] `export DIAMOND_LOUPE_FACET=<address of pre-existing diamond loupe facet>`
- [ ] `export DROPPER_FACET=<address of pre-existing dropper facet>`
- [ ] `export OWNERSHIP_FACET=<address of pre-existing Ownership facet>`

## Prerequisites to deploy dropper contract

### Deploy Terminus and set variables
- [ ] Deploy Terminus contract

```bash
bin/game7 terminus gogogo \
  --rpc $RPC \
  --keyfile $KEY \
  --contract-owner $OWNER 

```
- [ ] `export ADMIN_TERMINUS_ADDRESS=<Terminus Address>`
- [ ] Create admin pool

```bash
bin/game7 terminus terminus-facet create-pool-v-2 \
    --rpc $RPC \
    --keyfile $KEY \
    --contract $ADMIN_TERMINUS_ADDRESS \
    --burnable 1 \
    --capacity $(python3 -c "print(2**256 -1)") \
    --transferable 0 \
    --pool-uri $BADGE 
```

- [ ] Confirm Admin pool id

```bash
bin/game7 terminus terminus-facet total-pools \
    --rpc $RPC \
    --contract $ADMIN_TERMINUS_ADDRESS
```
Output: 1

- [ ] `export ADMIN_POOL_ID=<tokenId of terminus pool to control dropper>`
- [ ] Mint admin badage to OWNER

```bash
bin/game7 terminus terminus-facet mint \
    --rpc $RPC \
    --keyfile $KEY \
    --contract $ADMIN_TERMINUS_ADDRESS \
    --to-0 $OWNER \
    --pool-id $ADMIN_POOL_ID \
    --amount 1 \
    --data "" 
```

## Deploy Dropper

### Only required variables
```bash
bin/game7 dropper-v3 gogogo \
  --rpc $RPC \
  --keyfile $KEY \
  --contract-owner $OWNER \
  --admin-pool-id $ADMIN_POOL_ID \
  --admin-terminus-address $ADMIN_TERMINUS_ADDRESS \
  
```
- [ ] `export DROPPER_ADDRESS=<Address of dropper>`

