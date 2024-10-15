# Setup Bridge and Call

This checklist describes how to bridge tokens

## Teleport Tokens from L1 to L3 and call arbitrary function

### Environment variables

```bash
export L1_RPC=https://sepolia.infura.io/v3/25531dd362e441289ebba71d0b134a6a
export L2_RPC=https://sepolia-rollup.arbitrum.io/rpc
export L3_RPC=https://testnet-rpc.game7.io
export L1_TOKEN=0xac4d9E47765358f8cbD10D3C14246509E39B6251
export L1L2_ROUTER=0xce18836b233c83325cc8848ca4487e94c6288264
export L2L3_ROUTER=0xb43F7D804Ec38B74f9230128D12e1F29590cc65e
export L1L3_FEE_TOKEN=0xac4d9E47765358f8cbD10D3C14246509E39B6251
export TELEPORTER=0xb7440Ce5efeC7342404650EC4e773b6396dca89C
export TO=0x3a1Ad54d12b1f39805Ea77aFe7DeeFf2F32C97f5 # staking contract address
export AMOUNT=100000000000000000
export L3_CALLDATA="7acb7757000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000009ed191db1829371f116deb9748c26b49467a592a" ## abi.encodePacked("stake(uint256,address)", 100000000000000000, 0x9ed191DB1829371F116Deb9748c26B49467a592A)
```

- [ ] Teleporting tokens from L1 to L2 and calling stake function

```bash
bin/game7 bridge l1-to-l3 --teleporter $TELEPORTER \
    --l1-rpc $L1_RPC \
    --l2-rpc $L2_RPC \
    --l3-rpc $L3_RPC \
    --l1-token $L1_TOKEN \
    --l1l3-fee-token $L1L3_FEE_TOKEN \
    --l1l2-router $L1L2_ROUTER \
    --l2l3-router $L2L3_ROUTER \
    --to $TO \
    --l3-calldata $L3_CALLDATA \ 
    --amount $AMOUNT \
```

Output: Transaction Hash

## Bridge native tokens from L1 to L2 and call arbitrary function

### Environment variables

```bash
export INBOX=0xb43F7D804Ec38B74f9230128D12e1F29590cc65e
export L1_RPC=https://sepolia-rollup.arbitrum.io/rpc
export L2_RPC=https://rpc-game7-testnet-2g3y2k9azw.t.conduit.xyz
export TO=0x3a1Ad54d12b1f39805Ea77aFe7DeeFf2F32C97f5  # staking contract address
export AMOUNT=100000000000000000
export L2_CALLDATA="7acb7757000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000009ed191db1829371f116deb9748c26b49467a592a" ## abi.encodePacked("stake(uint256,address)", 100000000000000000, 0x9ed191DB1829371F116Deb9748c26B49467a592A)
export TOKEN=0xdeff4fb735e649369d8208d5178da157a14ca1ad
```

- [ ] approve the amount to the inbox contract (maybe a little bit more than the amount to cover the gas fee)

```bash
bin/game7 token approve \ 
    --spender $INBOX \
    --rpc $L1_RPC \
    --contract $TOKEN \
    --amount $AMOUNT \
```

- [ ] bridge native tokens from L1 to L2 and calling stake function (works for L2 to L3 as well)

```bash
bin/game7 bridge l1-to-l2 \ 
    --inbox $INBOX \
    --l1-rpc $L1_RPC \
    --l2-rpc $L2_RPC \
    --to $TO \
    --amount $AMOUNT \
    --l2-calldata $L2_CALLDATA
```

Output: Transaction Hash