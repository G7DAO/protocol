# Deploy and view StakingTokens

This checklist describes how to deploy StakingTokens to Arbitrum Sepolia and check metadata on Opensea.

## Setup Env

- [x]  Set environment
    
    ```bash
    export RPC=https://sepolia-rollup.arbitrum.io/rpc
    export TOKEN=0x5f88d811246222F6CB54266C42cc1310510b9feA
    export DAO=0x9ed191DB1829371F116Deb9748c26B49467a592A
    ```

## Deploy contract    

- [x]  Deploy new staking contract
    
    ```bash
    bin/game7 staking-tokens deploy \
        --rpc $RPC \
        --keyfile $KEY \
        --password $PASS
    	
    export STAKING=0x70Afd75253398c4e139647246Aae1E864db9a9dC
    ```
    

## Deposit

- [ ]  Deposit tokens
    
    ```bash
    bin/game7 staking-tokens deposit \
        --token-address $TOKEN \
    	--amount 100 \
        --duration 60 \
    	--contract $STAKING \
    	--rpc $RPC \
    	--keyfile $KEY \
    	--password $PASS
    ```

    ```bash
    bin/game7 staking-tokens get-deposit \
        --token-id 0 \
        --contract $STAKING \
        --rpc $RPC 
    ```
    