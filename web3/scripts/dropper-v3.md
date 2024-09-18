# `Dropper V0.2.0`

## Enviroment variables
``` bash
export RPC="https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz"
export CALLER="<Caller address>"
export KEY="<keyfile>"
export PASSWORD="<pasword>"
export TERMINUS="<Address>"
export TERMINUSPOOLID="<admin pool id>"
```

# Deploy Dropper Diamond
-Deploys Diamond and facet


```bash
bin/game7 dropper-v3-gogogo v1 \
    --rpc $RPC \
    --keyfile $KEY \
    --password $PASSWORD \
    --contract-owner $CALLER \
    --terminus $TERMINUS \
    --terminus-admin-Id $TERMINUSPOOLID

```