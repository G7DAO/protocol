# Setup Game7 Token Bridge on Arbitrum Sepolia

This checklist describes how to deploy the setup Game7 Token bridge.

## Contract addresses

```json
{
    "ArbitrumSepolia": {
        "UpgradeExecutor": "0xe09FeE5f28325b77979302B72CAdEd23b01dBFcA",
        "ArbitrumL1OrbitGatewayRouter": "0x7ee1F4DA6f092bbB778665930F604fFa0E8505A9",
        "L1CustomGateway": "0x2B58bBDcC80c1D7A6a81d88889f573377F19f9c3",
        "Game7Token": "0x5f88d811246222F6CB54266C42cc1310510b9feA",
    }
}
```

## Environment variables

- [x] `export KEY=<path to keyfile of caller account>`
- [x] `export RECIPIENT=<address of the caller account>`
- [x] `export AMOUNT=<amount of tokens to bridge>`
- [x] `export MAX_GAS=<max gas to use for the transaction>`
- [x] `export GAS_PRICE_BID=<gas price to use for the transaction>`
- [x] `export DATA=<must encode (uint256 maxSubmissionCost, bytes callHookData, uint256 tokenTotalFeeAmount)>`
- [ ] `export TOKEN=<address of the token to bridge>`
- [ ] `export ROUTER=<address of the gateway router contract>`
- [ ] `export RPC=<rpc endpoint>`

## Bridge Tokens from Arbitrum Sepolia to Arbitrum Orbit

- [x] Outbound Transfer

```bash
bin/game7 arbitrum-l1-orbit-gateway-router outbound-transfer \
  --contract $ROUTER \
  --to-0 $RECIPIENT \
  --token $TOKEN \
  --amount $AMOUNT \
  --max-gas $MAX_GAS \
  --gas-price-bid $GAS_PRICE_BID \
  --data $DATA \
  --rpc $RPC \
  --keyfile $KEY
```

Output: Transaction Hash

## Force Register Token Token to L2

### Environment variables

- [x] `export TARGET_CALL_DATA=<encoded forceRegisterTokenToL2(address[] calldata _l1Addresses,address[] calldata _l2Addresses,uint256 _maxGas,uint256 _gasPriceBid,uint256 _maxSubmissionCost)>`
- [ ] `export GATEWAY=<address of the gateway contract>`
- [ ] `export EXECUTOR=<address of the upgrade executor contract>`

### Execute Call

- [x] Execute call to force register token to L2 in L1CustomGateway contract with UpgradeExecutor contract

```bash
bin/game7 arbitrum-upgrade-executor execute-call \
    --rpc $RPC \
    --target-call-data $TARGET_CALL_DATA \
    --target $GATEWAY \
    --contract $EXECUTOR \
    --keyfile $KEY \
```

Output: Transaction Hash

## Set Custom Gateway in Router

### Environment variables

- [x] `export TARGET_CALL_DATA=<encoded function setGateways(address[] memory _token,address[] memory _gateway,uint256 _maxGas,uint256 _gasPriceBid,uint256 _maxSubmissionCost,uint256 _feeAmount)>`

### Execute Call

- [x] Execute call to force register token to L2 in L1CustomGateway contract with UpgradeExecutor contract

```bash
bin/game7 arbitrum-upgrade-executor execute-call \
    --rpc $RPC \
    --target-call-data $TARGET_CALL_DATA \
    --target $ROUTER \
    --contract $EXECUTOR \
    --keyfile $KEY \
```

Output: Transaction Hash

## Bridge Native Token from Arbitrum Sepolia to Arbitrum Orbit

### Environment variables

- [x] `export INBOX=<address of the inbox contract>`

- [x] Outbound Transfer

```bash
bin/game7 erc20-inbox deposit-erc-20 \
  --contract $INBOX \
  --amount 1 \
  --rpc $RPC \
  --keyfile $KEY
```