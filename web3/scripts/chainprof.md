# Setup chain profiling

This checklist describes how to setup chain profiling

## Environment variables

- [x] `export RPC=<rpc endpoint>`

## Create Accounts to be used for chain profiling

- [x] Create accounts for chain profiling

```bash
bin/game7 chainprof accounts \
  --accounts-dir gen-wallets \
  --num-accounts 10 \
  --password password \
  --rpc $RPC
```

## Transfer Native tokens to Created Accounts

### Environment variables

- [x] `export KEY=<path to keyfile of account to fund>`

### Fund Accounts

- [x] Send Transaction to fund accounts with Native Token

```bash
bin/game7 account fund \
    --rpc $RPC \
    --keyfile $KEY \
    --accounts-dir gen-wallets \
    --value 1000000000000000000
```

Output: Transaction Hashes

## Transfer Balances from Created Accounts

### Environment variables

- [x] `export RECIPIENT=<address to send funds to>`

### Drain Accounts

- [x] Send Transaction to Transfer all Native Token balance from created accounts to recipient

```bash
bin/game7 account drain \
    --rpc $RPC \
    --send-to $RECIPIENT \
    --accounts-dir gen-wallets \
    --password password 
```

Output: Transaction Hashes

## Evaluate Chain Performance

### Environment variables

- [x] `export NUM_TRANSACTIONS=<number of transactions to send>`
- [x] `export CALLDATA=<calldata to send in transactions>`
- [x] `export OUTFILE=<output file to write results to>`
- [x] `export TO=<address to send transactions to>`

### Evaluate

- [x] Send Transactions to evaluate chain performance

```bash
bin/game7 chainprof evaluate \
    --rpc $RPC \
    --accounts-dir gen-wallets \
    --password password \
    --value 100000 \
    --transactions-per-account $NUM_TRANSACTIONS \
    --calldata $CALLDATA \
    --outfile $OUTFILE \
    --to $TO
```

Output: Results written to file
