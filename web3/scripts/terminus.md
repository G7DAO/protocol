# `Terminus`


## Enviroment variables
``` bash
export RPC="https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export KEY=".secrets/dao-dev.json"
export PASSWORD="<password>"

```

# Deploy Terminus Diamond
-Deploys Terminus Diamond and facet

```bash
bin/game7 terminus-gogogo v1 \
    --rpc $RPC \
    --keyfile $KEY \
    --password $PASSWORD \
    --contract-owner $CALLER 

```