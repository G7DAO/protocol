# Deploy terminus diamond contract

This checklist describes how to deploy the Terminus diamond contract.

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

- [x] `export RPC=https://testnet-rpc.game7.io`
- [x] `export KEY=.secrets/dao-dev.json`
- [x] `export OWNER=0x9ed191db1829371f116deb9748c26b49467a592a`

## Deployment

- [x] Deploy Game7 Token contract

```bash
bin/game7 terminus deploy \
  --rpc $RPC \
  --keyfile $KEY \
  --contract-owner $OWNER 

```