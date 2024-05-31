# Deploy Game7 Token contract on Arbitrum Testnets

This checklist describes how to deploy the Game7 Token contract.


## Contract addresses

```json
{
    "Game7Token": {
        "ArbitrumSepolia": "0x5f88d811246222F6CB54266C42cc1310510b9feA",
        "ArbitrumOrbitConduit": "0xB25C493fe26e07028FBF58f5e9e62257061e587f",
        "ArbitrumOrbitCaldera": "0xfA336817401F2B7C07981EDbc225274545790cA8",
    },
    "Game7TokenBridgeVersion": {
        "ArbitrumOrbitConduit": "0xd891d2A2833083E9c1589BA96868732929DE6336",
        "ArbitrumOrbitCaldera": "0xFD77b2D944d8bF319Cf566CC5cDCa4C9b8BefE92",
    }
}
```

## RPC urls

```json
{
    "rpcUrls": {
        "ArbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc",
        "ArbitrumOrbitConduit": "https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz",
        "ArbitrumOrbitCaldera": "https://game7-testnet.hub.caldera.xyz/",
    },
}
```

## Environment variables

- [x] `export RPC=<rpc url of the chain>`
- [x] `export KEY=<path to keyfile of caller account>`


## Deployment

- [x] Deploy Game7 Token contract

```bash
bin/game7 token deploy \
  --total-supply 100000000000000000000000000000 \
  --rpc $RPC \
  --keyfile $KEY
```

- [x] Paste JSON output to `Contract addresses` section at top of file.

## Approve a wallet to spend tokens

### Environment variables (set in the first script)

- [x] `export SPENDER=<address of the spender>`
- [x] `export TOKEN=<address of the Game7 Token contract>`
- [x] `export AMOUNT=<amount of tokens to approve>`

### Approve

- [x] Approve spender for spend tokens

```bash
bin/game7 token approve \
    --rpc $RPC \
    --spender $SPENDER \
    --value-0 $AMOUNT \
    --contract $TOKEN \
    --keyfile $KEY \
```

Output: Transaction Hash

## Check tokens balance of a wallet

### Environment variables (set in the first script)

- [x] `export RECIPIENT=<address of the wallet>`

### Check balance

- [x] Check balance of wallet

```bash
bin/game7 token balance-of \
    --contract $TOKEN \
    --rpc $RPC \
    --arg-0 $RECIPIENT \
```

Output: O: Balance of wallet