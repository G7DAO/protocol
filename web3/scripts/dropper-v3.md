# `Dropper V0.2.0`

## Enviroment variables
``` bash
export RPC="https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export KEY=".secrets/dao-dev.json"
export PASSWORD="peppercat"
export TERMINUS="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export TERMINUSPOOLID="256"
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