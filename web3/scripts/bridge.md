# Setup Bridge and Call

This checklist describes how to bridge tokens

## Environment variables

- [ ] `export L1_RPC=<l1 rpc endpoint>`
- [ ] `export L2_RPC=<l2 rpc endpoint>`
- [ ] `export L3_RPC=<l3 rpc endpoint>`
- [ ] `export KEY=<path to keyfile of account to fund>`
- [ ] `export PASSWORD=<password for keyfile>`
- [ ] `export L1_TOKEN=<l1 token address>`
- [ ] `export L1L2_ROUTER=<l1l2 router address>`
- [ ] `export L2L3_ROUTER=<l2l3 router address>`
- [ ] `export L1L3_FEE_TOKEN=<l1l3 fee token address>`
- [ ] `export TELEPORTER=<teleporter address>`
- [ ] `export TO=<address to send funds to or call function>`
- [ ] `export L3_CALLDATA=<calldata for l3 function>`
- [ ] `export AMOUNT=<amount to send>`

## Teleport Tokens from L1 to L3 and call arbitrary function

- [ ] Teleporting tokens from L1 to L2 and calling stake function

```bash
bin/game7 bridge l1-to-l3 \ 
    --teleporter $TELEPORTER \
    --l1-rpc $L1_RPC \
    --l2-rpc $L2_RPC \
    --l3-rpc $L3_RPC \
    --l1-token $L1_TOKEN \
    --l1l3-fee-token $L1L3_FEE_TOKEN \
    --l1l2-router $L1L2_ROUTER \
    --l2l3-router $L2L3_ROUTER \
    --to $TO \
    --amount $AMOUNT \
    --l3-calldata $L3_CALLDATA \ 
    --key $KEY \
    --password $PASSWORD 
```

Output: Transaction Hash