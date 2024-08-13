# `Terminus`


## Enviroment variables
``` bash
export RPC="https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export KEY=".secrets/dao-dev.json"
export PASSWORD="peppercat"

```
# Deploy Diamond
```bash
bin/game7 diamond-cut-facet deploy \
    --rpc $RPC \
    --keyfile $KEY \
    --password $PASSWORD

export CUT="0x34606aa389C797883261B75a84af963d3Aa06056"

bin/game7 diamond deploy \
    --rpc $RPC \
    --keyfile $KEY \
    --password $PASSWORD \
    --contract-owner $CALLER \
    --diamond-cut-facet $CUT

export DIAMOND="0x6a7c205b5379Ff98a1397fA97cB5918c82D5fBe0"

bin/game7 diamond-loupe-facet deploy \
    --rpc $RPC \
    --keyfile $KEY \
    --password $PASSWORD

export LOUPE="0x44301D18ECbDae280831B018e6DB0577658a1155"

bin/game7 ownership-facet deploy \
    --rpc $RPC \
    --keyfile $KEY \
    --password $PASSWORD

export OWNERSHIP="0x5b80E68e3AA2DB4eA024A52c751AE37FFA4A5BB7"
```

# Deploy Terminus
```bash
bin/game7 terminus-facet help


```
