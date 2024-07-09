# Deploy Game7 Dex contract

This checklist describes how to deploy the Game7 Token Faucet.
## RPC urls

```json
{
    "rpcUrls": {
        "Game7 Test net": "https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz",
        "ArbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc",
        "ArbitrumOrbitConduit": "https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz",
        "ArbitrumOrbitCaldera": "https://game7-testnet.hub.caldera.xyz/",
    },
}
```

## Environment variables

- [ ] `export RPC=<rpc url of the chain>`
- [ ] `export KEY=<path to keyfile of caller account>`
- [ ] `export DAO=<path to keyfile of caller account>`
- [ ] `export TOKEN0=<address of the Token contract>` 
- [ ] `export TOKEN1=<address of the Token contract>`
- [ ] `export FACTORYV2=<address of the Factory contract>`
- [ ] `export WETH=<address of the WETH contract>`
- [ ] `export ROUTER02=<address of the ROUTER02>`
- [ ] `export V2PAIR=<address of the V2Pair contract>`
- [ ] `export LIQUIDITYAMOUNT0=<amount of token0 to add to liquidity>`
- [ ] `export LIQUIDITYAMOUNT1=<amount of token1 to add to liquidity>`
- [ ] `export LIQUIDITYTOADDETH =<amount of eth to add to liquidity>`
- [ ] `export MIN0 =<min token0 for transactions>`
- [ ] `export MIN1 =<min token1 for transactions>`
- [ ] `export MINETH =<min eth for transactions>`
- [ ] `export ETHVALUE = <Set eth vaule for transactions>`
 

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

- [ ] Deploy Token contract if need to

```bash
bin/game7 token deploy \
  --token-name 'Token 1' \
  --symbol 'TKN1' \
  --decimals 18 \
  --total-supply 100000000000000000000000000000 \
  --rpc $RPC \
  --keyfile $KEY
```
- [ ] Deploy UniswapV2Factory contract

```bash
bin/game7 uniswap-v2-factory deploy \
    --fee-to-setter $DAO \
    --rpc $RPC \
    --keyfile $KEY
```

- [ ] Deploy UniswapV2Router02

```bash
bin/game7 uniswap-v2-router-02 deploy \
    --factory $FACTORY \
    --weth $WETH \
    --rpc $RPC \
    --keyfile $KEY
```

- [ ] Create Pair with UniswapV2Factory contract

```bash
bin/game7 uniswap-v2-factory create-pair \
    --contract $FACTORYV2 \
    --token-a $TOKEN0 \
    --token-b $TOKEN1 \
    --rpc $RPC \
    --keyfile $KEY
```
- [ ] Returns Pair address created by factory

```bash
bin/game7 uniswap-v2-factory get-pair \
    --contract $FACTORYV2 \
    --arg-0 $TOKEN0 \
    --arg-1 $TOKEN1 \
    --rpc $RPC
```

- [ ] Approve router for liquidity add
- [ ] Token0 approval
```bash 
bin/game7 token approve \
    --contract $TOKEN0 \
    --rpc $RPC \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $LIQUIDITYTOADD0
```
- [ ] Token1 Approval

```bash
bin/game7 token approve \
    --contract $TOKEN1 \
    --rpc $RPC \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $LIQUIDITYTOADD1
```

- [ ] Add Liquidity 2 tokens
- [ ] Set `export DEADLINE = <block.timestamp greater then current>`

``` bash
bin/game7 uniswap-v2-router-02 add-liquidity \
    --contract $ROUTER02 \
    --rpc $RPC \
    --keyfile $KEY \
    --token-a $TOKEN0 \
    --token-b $TOKEN1 \
    --amount-a-desired $LIQUIDITYTOADD0 \
    --amount-b-desired $LIQUIDITYTOADD0 \
    --amount-a-min $MIN0\
    --amount-b-min $MIN1 \
    --to-0 $CALLER \
    --deadline $DEADLINE

```

- [ ] Add Liquidity with ETH Steps
- [ ] Check if Pair exist
- [ ] Create if DNE
- [ ] Token0 approval
- [ ] AddLiquidityETH

```bash
bin/game7 uniswap-v2-factory get-pair \
    --contract $FACTORYV2 \
    --arg-0 $TOKEN0 \
    --arg-1 $TOKEN1 \
    --rpc $RPC
```
```bash
bin/game7 uniswap-v2-factory create-pair \
    --contract $FACTORYV2 \
    --token-a $TOKEN0 \
    --token-b $WETH \
    --rpc $RPC \
    --keyfile $KEY
```

```bash 
bin/game7 token approve \
    --contract $TOKEN0 \
    --rpc $RPC \
    --keyfile $KEY \
    --spender $ROUTER02 \
    --amount $LIQUIDITYTOADD0
```

```bash
bin/game7 uniswap-v2-router-02 add-liquidity-eth \
    --contract $ROUTER02 \
    --rpc $RPC \
    --keyfile $KEY \
    --token $TOKEN0 \
    --amount-token-desired $LIQUIDITYTOADD0 \
    --amount-eth-desired $LIQUIDITYTOADDETH \
    --amount-token-min $MIN0\
    --amount-eth-min $MINETH \
    --value $ETHVALUE \
    --to-0 $CALLER \
    --deadline $DEADLINE

```