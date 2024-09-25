# Deploy Game7 Token Sender contract

This checklist describes how to deploy the Game7 Token Sender.

## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export TIME_INTERVAL=<time interval for sender>`
- [ ] `export SENDER_CONTRACT=<address of the sender>`
- [ ] `export RECIPIENT=<address of the recipient>`
  
## Deployment

- [ ] Deploy Game7 Token Sender contract

```bash
bin/game7 token-sender deploy \
    --faucet-time-interval $TIME_INTERVAL \
    --rpc $RPC \
    --keyfile $KEY
```

## Send tokens

- [ ] Send tokens from the sender

```bash
bin/game7 token-sender send \
    --contract $SENDER_CONTRACT \
    --rpc $RPC \
    --keyfile $KEY \
    --recipient $RECIPIENT
```

Output: Transaction hash