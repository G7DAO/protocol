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

- [x] `export RPC_URL=<rpc url of the chain>`
- [x] `export CALLER_KEY=<path to keyfile of caller account>`
- [x] `export TOTAL_SUPPLY=100000000000000000000000000000`


## Deployment

- [x] Deploy Game7 Token contract

```bash
bin/game7 token deploy \
  --total-supply $TOTAL_SUPPLY \
  --rpc $RPC_URL \
  --keyfile $CALLER_KEY
```

- [x] Paste JSON output to `Contract addresses` section at top of file.

## Approve a wallet to spend tokens

### Environment variables (set in the first script)

- [x] `export SPENDER_ADDRESS=<address of the spender>`
- [x] `export GAME7_TOKEN_ADDRESS=<address of the Game7 Token contract>`
- [x] `export AMOUNT=<amount of tokens to approve>`

### Approve

- [x] Approve spender for spend tokens

```bash
bin/game7 token approve \
    --rpc $RPC_URL \
    --spender $SPENDER_ADDRESS \
    --value-0 $AMOUNT \
    --contract $GAME7_TOKEN_ADDRESS \
    --keyfile $CALLER_KEY \
```

Output: Transaction Hash