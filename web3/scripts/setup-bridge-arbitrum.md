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

- [x] `export CALLER_KEY=<path to keyfile of caller account>`
- [x] `export CALLER_ADDRESS=<address of the caller account>`
- [x] `export AMOUNT=<amount of tokens to bridge>`
- [x] `export MAX_GAS=<max gas to use for the transaction>`
- [x] `export GAS_PRICE_BID=<gas price to use for the transaction>`
- [x] `export DATA=<must encode (uint256 maxSubmissionCost, bytes callHookData, uint256 tokenTotalFeeAmount)>`

## Bridge Tokens from Arbitrum Sepolia to Arbitrum Orbit

- [x] Outbound Transfer

```bash
bin/game7 arbitrum-l1-orbit-gateway-router outbound-transfer \
  --contract 0x7ee1F4DA6f092bbB778665930F604fFa0E8505A9 \
  --to-0 $CALLER_ADDRESS \
  --token 0x5f88d811246222F6CB54266C42cc1310510b9feA \
  --amount $AMOUNT \
  --max-gas $MAX_GAS \
  --gas-price-bid $GAS_PRICE_BID \
  --data $DATA \
  --rpc https://sepolia-rollup.arbitrum.io/rpc \
  --keyfile $CALLER_KEY
```

Output: Transaction Hash

## Force Register Token Token to L2

### Environment variables

- [x] `export TARGET_CALL_DATA=<encoded forceRegisterTokenToL2(address[] calldata _l1Addresses,address[] calldata _l2Addresses,uint256 _maxGas,uint256 _gasPriceBid,uint256 _maxSubmissionCost)>`

### Execute Call

- [x] Execute call to force register token to L2 in L1CustomGateway contract with UpgradeExecutor contract

```bash
bin/game7 arbitrum-upgrade-executor execute-call \
    --rpc https://sepolia-rollup.arbitrum.io/rpc \
    --target-call-data $TARGET_CALL_DATA \
    --target 0x2B58bBDcC80c1D7A6a81d88889f573377F19f9c3 \
    --contract 0xe09FeE5f28325b77979302B72CAdEd23b01dBFcA \
    --keyfile $CALLER_KEY \
```

Output: Transaction Hash

## Set Custom Gateway in Router

### Environment variables

- [x] `export TARGET_CALL_DATA=<encoded function setGateways(address[] memory _token,address[] memory _gateway,uint256 _maxGas,uint256 _gasPriceBid,uint256 _maxSubmissionCost,uint256 _feeAmount)>`

### Execute Call

- [x] Execute call to force register token to L2 in L1CustomGateway contract with UpgradeExecutor contract

```bash
bin/game7 arbitrum-upgrade-executor execute-call \
    --rpc https://sepolia-rollup.arbitrum.io/rpc \
    --target-call-data $TARGET_CALL_DATA \
    --target 0x7ee1F4DA6f092bbB778665930F604fFa0E8505A9 \
    --contract 0xe09FeE5f28325b77979302B72CAdEd23b01dBFcA \
    --keyfile $CALLER_KEY \
```

Output: Transaction Hash