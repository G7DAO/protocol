# Demo staking an ERC20 token on the L3

- [x]  Set environment
    
    ```bash
    export RPC=https://game7-testnet-custom.rpc.caldera.xyz/http
    export TOKEN=0xac4d9E47765358f8cbD10D3C14246509E39B6251
    export DAO=0x9ed191DB1829371F116Deb9748c26B49467a592A
    ```
    
- [x]  Deploy new staking contract: fix method signature for unlock (no amount) and typos in error messages.
    
    ```bash
    bin/game7 staking deploy \
    	--deposit-token $TOKEN \
    	--rpc $RPC \
    	--keyfile $KEY \
    	--password $PWD
    	
    export STAKING=0xD72Cf40ae463c1AbBEdC289797E03728d0049764
    ```
    

### Demo

- [ ]  Stake tokens
    
    ```bash
    bin/game7 staking stake \
    	--amount 100 \
    	--receiver $DAO \
    	--contract $STAKING \
    	--rpc $RPC \
    	--keyfile $KEY \
    	--password $PWD
    ```
    
- [ ]  Check staking balance
    
    ```bash
    bin/game7 staking balance-of \
    	--arg-0 $DAO \
    	--contract $STAKING \
    	--rpc $RPC
    ```
    
- [ ]  Unstake tokens
    
    ```bash
    bin/game7 staking unstake \
    	--amount 50 \
    	--receiver $DAO \
    	--contract $STAKING \
    	--rpc $RPC \
    	--keyfile $KEY \
    	--password $PWD
    ```
    
- [ ]  Check staking balance
    
    ```bash
    bin/game7 staking balance-of \
    	--arg-0 $DAO \
    	--contract $STAKING \
    	--rpc $RPC
    ```
    
- [ ]  Lock tokens for 60 seconds
    
    ```bash
     bin/game7 staking lock \
    	 --amount 100 \
    	 --duration 60 \
    	 --receiver $DAO \
    	 --contract $STAKING \
    	 --rpc $RPC \
    	 --keyfile $KEY \
    	 --password $PWD
    ```
    
- [ ]  Unlock tokens (will error)
    
    ```bash
    bin/game7 staking unlock \
    	--deposit-id 0 \
    	--receiver $DAO \
    	--contract $STAKING \
    	--rpc $RPC \
    	--keyfile $KEY \
    	--password $PWD
    ```
    
- [ ]  Check deposit balance
    
    ```bash
    bin/game7 staking get-deposit-count \
    	--user $DAO \
    	--contract $STAKING \
    	--rpc $RPC
    bin/game7 staking deposits-of \
    	--arg-0 $DAO \
    	--arg-1 0 \
    	--contract $STAKING \
    	--rpc $RPC
    ```
    
- [ ]  Wait 60 seconds
- [ ]  Unlock tokens
    
    ```bash
    bin/game7 staking unlock \
    	--deposit-id 0 \
    	--receiver $DAO \
    	--contract $STAKING \
    	--rpc $RPC \
    	--keyfile $KEY \
    	--password $PWD
    ```
    
- [ ]  Get deposit count
    
    ```bash
    bin/game7 staking get-deposit-count \
    	--user $DAO \
    	--contract $STAKING \
    	--rpc $RPC
    ```