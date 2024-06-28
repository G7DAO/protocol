# Deploy Game7 Token Faucet contract

This checklist describes how to deploy the Game7 Token Faucet.


## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export TOKEN=<address of the Game7 Token contract>`
- [ ] `export FAUCET_AMOUNT=<amount of tokens to send to each wallet>`
- [ ] `export BLOCK_INTERVAL=<block interval for faucet>`
- [ ] `export INBOX=<address of the Arbitrum inbox address>`
- [ ] `export OWNER=<address of the owner of the faucet>`
- [ ] `export FAUCET=<address of the faucet>`
- [ ] `export FAUCET_SUPPLY=<amount of tokens to send to the faucet>`

## Deployment

- [ ] Deploy Game7 Token Faucet contract

```bash
bin/game7 faucet deploy \
    --faucet-amount $FAUCET_AMOUNT \
    --faucet-block-interval $BLOCK_INTERVAL \
    --inbox-address $INBOX \
    --token-address $TOKEN \
    --owner $OWNER \
    --rpc $RPC \
    --keyfile $KEY
```

- [ ] Transfer tokens to the faucet contract

```bash
bin/game7 token transfer \
    --amount $FAUCET_SUPPLY \
    --to-0 $FAUCET \
    --contract $TOKEN \
    --rpc $RPC \
    --keyfile $KEY
```
Output: Transaction hash

## Claiming tokens

- [ ] Claim tokens from the faucet

```bash
bin/game7 faucet claim \
    --contract $FAUCET \
    --rpc $RPC \
    --keyfile $KEY
```

Output: Transaction hash