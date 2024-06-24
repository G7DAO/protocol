# Setup Bridge and Call

This checklist describes how to bridge tokens

## Teleport Tokens from L1 to L3 and call arbitrary function

### Environment variables

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

- [ ] Teleporting tokens from L1 to L3 and calling stake function

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
    --keyfile $KEY \
    --password $PASSWORD 
```

Output: Transaction Hash

## Bridge native tokens from L1 to L2 and call arbitrary function

### Environment variables

- [ ] `export L1_RPC=<l1 rpc endpoint>`
- [ ] `export L2_RPC=<l2 rpc endpoint>`
- [ ] `export KEY=<path to keyfile of account to fund>`
- [ ] `export PASSWORD=<password for keyfile>`
- [ ] `export INBOX=<inbox address>`
- [ ] `export TO=<address to send funds to or call function>`
- [ ] `export L2_CALLDATA=<calldata for l2 function>`
- [ ] `export AMOUNT=<amount to send>`
- [ ] `export TOKEN=<native token address on L1>`

- [ ] approve the amount to the inbox contract (maybe a little bit more than the amount to cover the gas fee)

```bash
bin/game7 token approve \ 
    --spender $INBOX \
    --rpc $L1_RPC \
    --contract $TOKEN \
    --amount $AMOUNT \
```

- [ ] bridge native tokens from L1 to L2 and calling stake function (works for L2 to L3 as well)

```bash
bin/game7 bridge l1-to-l2 \ 
    --inbox $INBOX \
    --l1-rpc $L1_RPC \
    --l2-rpc $L2_RPC \
    --to $TO \
    --amount $AMOUNT \
    --l2-calldata $L2_CALLDATA \ 
    --keyfile $KEY \
    --password $PASSWORD 
```

Output: Transaction Hash