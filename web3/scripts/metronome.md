
## Environment variables

- [ ] `export RPC=https://testnet-rpc.game7.io`
- [ ] `export KEY=.secrets/dao-dev.json`
- [ ] `export CONTRACT=0x45C681C365520958dB8dBe7550C34fB1336dfA67`
- [ ] `export BOUNTY=1`
- [ ] `export REMAINDER=0`
- [ ] `export DIVISOR=1`
- [ ] `export VALUE=10000`

## Deployment

- [ ] Deploy Game7 Token Faucet contract

```bash
bin/game7 metronome deploy \
    --rpc $RPC \
    --keyfile $KEY
```

## Create Schedule

- [ ] Create a Schedule

```bash
bin/game7 metronome create-schedule \
    --contract $CONTRACT \
    --rpc $RPC \
    --keyfile $KEY \
    --bounty $BOUNTY \
    --remainder $REMAINDER \
    --divisor $DIVISOR \
    --value $VALUE
```
- [ ] `export ARG=0`
- [ ] `export LASTBLOCK=45921`
```bash
bin/game7 metronome schedules-balances \
    --contract $CONTRACT \
    --rpc $RPC \
    --arg-0 $ARG \
    --block $LASTBLOCK
```

```bash

cd web3

while true; do
    echo "Running the bot..."
    node bot/metronomeBotTestNet.js
    echo "Waiting for 10 seconds..."
    sleep 10
done
```