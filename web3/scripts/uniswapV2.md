# Deploy Game7 Dex contract and function testing

This checklist describes how to deploy the Game7 Dex-Demo using uniswap verison 2 of proof of liquidity.
## RPC urls

```json
{
    "rpcUrls": {
        "Game7 Test net": "https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz",
        "ArbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc",
        "ArbitrumOrbitConduit": "https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz",
        "ArbitrumOrbitCaldera": "https://game7-testnet.hub.caldera.xyz/",
    },
    "WrappedNativeTokens": {
        "Game7 Test net" : "0x6B885D96916D18CD78E44B42C6489CA6f8794565",
    },
    "ETHERMeasurments": {
        "ether": "1000000000000000000",
    },
    "Game7SawpV2Test":{
        "Factory":"0x22B929389682DE34BaCb4a535eb9ef571994F8fF",
        "Router02":"0x76d1828860C4c5AE2962fa9A8590F28f005dB27e",
    },
}
```

## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export CALLER=<address calling from>`
- [x] `export FACTORYV2=0x22B929389682DE34BaCb4a535eb9ef571994F8fF`
- [x] `export ROUTER02=0x76d1828860C4c5AE2962fa9A8590F28f005dB27e`
- [x] `export WNT="0x6B885D96916D18CD78E44B42C6489CA6f8794565"`
- [ ] `export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"` 
- [ ] `export TOKEN1="0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5"`

 

## Deployment

- [ ] Deploy Token contract if need to
```bash

bin/game7 token deploy \
  --token-name 'Token 0' \
  --symbol 'TKN0' \
  --decimals 18 \
  --total-supply 100000000000000000000000000000 \
  --rpc $RPC \
  --keyfile $KEY
```

- [x] Deploy WrappedNativeToken if needed
``` bash

export WNTNAME = <Insert Wrapped Native Token name>
export WNTSYMBOL = <Insert Wrapped Native Token symbol>

bin/game7 wrapped-native-token deploy \
    --rpc $RPC \
    --keyfile $KEY \
    --symbol $WNTSYMBOL \
    --token-name $WNTNAME
```

- [x] Deploy UniswapV2Factory contract
```bash

export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"

bin/game7 uniswap-v2-factory deploy \
    --fee-to-setter $CALLER \
    --rpc $RPC \
    --keyfile $KEY

```

- [x] Deploy UniswapV2Router02
- [x] Set init code hash line 24 in uniswapv2/v2-periphery/contracts/libraries/UniswapV2Library.sol then compile

```bash

export FACTORYV2="0x22B929389682DE34BaCb4a535eb9ef571994F8fF"
export WNT="0x6B885D96916D18CD78E44B42C6489CA6f8794565"

bin/game7 uniswap-v2-factory initcodehash \
    --contract $FACTORYV2 \
    --rpc $RPC

bin/game7 uniswap-v2-router-02 deploy \
    --factory $FACTORYV2 \
    --weth $WNT \
    --rpc $RPC \
    --keyfile $KEY
```

## FACTORY Functions

- [ ] Create Pair with UniswapV2Factory contract
```bash

export FACTORYV2="0x22B929389682DE34BaCb4a535eb9ef571994F8fF"
export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"
export TOKEN1="0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5"

bin/game7 uniswap-v2-factory create-pair \
    --contract $FACTORYV2 \
    --token-a $TOKEN0 \
    --token-b $TOKEN1 \
    --rpc $RPC \
    --keyfile $KEY
```

- [ ] Returns Pair address created by factory
```bash

export FACTORYV2="0x22B929389682DE34BaCb4a535eb9ef571994F8fF"
export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"
export TOKEN1="0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5"

bin/game7 uniswap-v2-factory get-pair \
    --contract $FACTORYV2 \
    --arg-0 $TOKEN0 \
    --arg-1 $TOKEN1 \
    --rpc $RPC
```

## Add Liquidity

- [ ] Add Liquidity Directly: 3 steps **Warning not secure method**
```Bash

export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"
export TOKEN1="0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5"
export AMOUNT="1000000000000000000000"
export V2PAIR="`<getPair from factory>`"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"


bin/game7 token transfer \
    --contract $TOKEN0 \
    --keyfile $KEY \
    --rpc $RPC \
    --amount $AMOUNT \
    --to-0 $V2PAIR

bin/game7 token transfer \
    --contract $TOKEN1 \
    --keyfile $KEY \
    --rpc $RPC \
    --amount $AMOUNT \
    --to-0 $V2PAIR

bin/game7 uniswap-v2-pair mint \
    --keyfile $KEY \
    --rpc $RPC \
    --contract $V2PAIR \
    --to-0 $CALLER
```


- [ ] Add liquidity through router
```bash

export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"
export TOKEN1="0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5"
export ROUTER02="0x76d1828860C4c5AE2962fa9A8590F28f005dB27e"
export AMOUNTADESIRED="1000000000000000000000"
export AMOUNTBDESIRED="1000000000000000000000"
export AMOUNTAMIN="500000000000000000000"
export AMOUNTBMIN="500000000000000000000"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export DEADLINE="2720663843"

bin/game7 token approve \
    --contract $TOKEN0 \
    --rpc $RPC \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $(python3 -c "print(2**256 -1)")

bin/game7 token approve \
    --contract $TOKEN1 \
    --rpc $RPC \
    --password $PASSWORD \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $(python3 -c "print(2**256 -1)")

bin/game7 uniswap-v2-router-02 add-liquidity \
    --contract $ROUTER02 \
    --rpc $RPC \
    --password $PASSWORD \
    --keyfile $KEY \
    --token-a $TOKEN0 \
    --token-b $TOKEN1 \
    --amount-a-desired $AMOUNTADESIRED \
    --amount-b-desired $AMOUNTBDESIRED \
    --amount-a-min $AMOUNTAMIN \
    --amount-b-min $AMOUNTBMIN \
    --to-0 $CALLER \
    --deadline $(python3 -c "print(2**32 -1)")

```

- [ ] Add Liquidity with ETH
```bash 

export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"
export ROUTER02="0x76d1828860C4c5AE2962fa9A8590F28f005dB27e"
export AMOUNTADESIRED="1000000000000000000000"
export AMOUNTAMIN="500000000000000000000"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export ETHVALUE="500000000000000000"
export AMOUNTETHMIN="1"
export DEADLINE="2720663843"

bin/game7 token approve \
    --contract $TOKEN0 \
    --rpc $RPC \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $(python3 -c "print(2**256 -1)")

bin/game7 uniswap-v2-router-02 add-liquidity-eth \
    --contract $ROUTER02 \
    --rpc $RPC \
    --keyfile $KEY \
    --token $TOKEN0 \
    --amount-token-desired $AMOUNTADESIRED \
    --amount-token-min $AMOUNTAMIN \
    --amount-eth-min $AMOUNTETHMIN \
    --value $ETHVALUE \
    --to-0 $CALLER \
    --deadline $DEADLINE \
    --password $PASSWORD

```

## Swaps

- [ ] Perform swap from Exact Eth with path length 2
```Bash

export ROUTER02="0x76d1828860C4c5AE2962fa9A8590F28f005dB27e"
export AMOUNTOUTMIN="1"
export PATH="[\"0x6B885D96916D18CD78E44B42C6489CA6f8794565\",\"0xf861273b98c2A2205f9979df2d6fa3B85e29d61B\"]"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export ETHVALUE="10000000000000000"
export DEADLINE="2720663843"


bin/game7 uniswap-v2-router-02 swap-exact-eth-for-tokens \
    --contract $ROUTER02 \
    --rpc $RPC \
    --keyfile $KEY \
    --amount-out-min $SAMOUNTOUTMIN \
    --deadline $DEADLINE \
    --path $PATH \
    --to-0 $CALLER \
    --value $ETHVALUE \
    --password $PASSWORD

```

- [ ] Perform swap with Exact ETH with PATH length 3
```Bash

export ROUTER02="0x76d1828860C4c5AE2962fa9A8590F28f005dB27e"
export AMOUNTOUTMIN="1"
export PATH="[\"0x6B885D96916D18CD78E44B42C6489CA6f8794565\",\"0xf861273b98c2A2205f9979df2d6fa3B85e29d61B\",\"0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5\"]"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export ETHVALUE="100000000000000000"
export DEADLINE="2720663843"

bin/game7 uniswap-v2-router-02 swap-exact-eth-for-tokens \
    --contract $ROUTER02 \
    --rpc $RPC \
    --keyfile $KEY \
    --amount-out-min $AMOUNTOUTMIN \
    --deadline $DEADLINE \
    --path $PATH \
    --to-0 $CALLER \
    --value $ETHVALUE \
    --password $PASSWORD

```

- [ ] Perform swap from Exact Token with path length 2
```Bash

export TOKEN0="0xf861273b98c2A2205f9979df2d6fa3B85e29d61B"
export ROUTER02="0x76d1828860C4c5AE2962fa9A8590F28f005dB27e"
export AMOUNTOUTMIN="1"
export PATH="[\"0xf861273b98c2A2205f9979df2d6fa3B85e29d61B\",\"0xE6AE953adc45ED9dF04FfD66E5fc5b3379a0a7F5\"]"
export CALLER="0x9ed191DB1829371F116Deb9748c26B49467a592A"
export AMOUNTIN="10000000000000000000"
export DEADLINE="2720663843"


bin/game7 token approve \
    --contract $TOKEN0 \
    --rpc $RPC \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $(python3 -c "print(2**256 -1)")


bin/game7 uniswap-v2-router-02 swap-exact-tokens-for-tokens \
    --contract $ROUTER02 \
    --rpc $RPC \
    --keyfile $KEY \
    --amount-in $AMOUNTIN \
    --amount-out-min $AMOUNTOUTMIN \
    --deadline $DEADLINE \
    --path $PATH \
    --to-0 $CALLER \
    --password $PASSWORD

```