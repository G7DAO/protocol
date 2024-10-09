<p align="center">
<a href="https://game7.io/">
<img width="4335" alt="GAME7_LOGO_RED" src="https://github.com/G7DAO/chainprof/assets/38267570/600f533f-782d-49ef-97f5-11c096c2e13b">
</a>
</p>

<h1 align="center">Game 7 Protocol</h1>

The Game 7 Protocol is a comprehensive mono repository that includes all the essential components for the Game 7 ecosystem. This repository consolidates the frontend, backend, and web3 components required to run and interact with the Game 7 Protocol.

## What this repository contains

The [`G7DAO/protocol`](https://github.com/G7DAO/protocol) repository contains the smart contracts that make up
the Game7 protocol.

It also contains:

1. Go bindings to these contracts
2. The `game7` command line tool which can be used to deploy and interact with these contracts
3. Some tools, like `graffiti`, which are used in the process of developing and testing the Game7 protocol

## The Game7 protocol

### The G7 token

[Implementation of the Game7 ERC20 token](./web3/contracts/token/ERC20.sol)

This token will be deployed on Ethereum mainnet. The implementation consists of slight modifications to
the wrapped Ether contract, [`WETH9`](https://github.com/gnosis/canonical-weth/blob/master/contracts/WETH9.sol).

### Staker

- [Implementation of the Game7 `Staker`](./web3/contracts/staking/Staker.sol)
- [Execution flows used to test the `Staker`](./web3/flows/staker.md)
- Staker test files: [1](./web3/test/Staker.test.1.ts), [2](./web3/test/Staker.test.1.ts), [3](./web3/test/Staker.test.1.ts)

The `Staker` is a permissionless staking contract that can be used by anybody.

Anyone can create staking pools which accept either one of:
1. The native token of the chain the `Staker` is deployed to
2. Tokens from an ERC20 contract
3. Tokens from an ERC721 contract
4. Tokens with a fixed token ID from an ERC1155 contract

Once a pool has been created, anyone can open positions under that staking pool by transferring tokens to the `Staker`.
Positions are represented by ERC721 tokens on the `Staker` contract.

Each pool has the following parameters:
1. Whether positions opened under that staking pool (represented by ERC721 tokens) are transferable.
2. The lockup period for positions opened under that pool - i.e. the number of seconds before the tokens
can be unstaked.
3. The cooldown period for positions opened under that pool - i.e. the number of seconds after a user
initiates an unstake that they have to wait before they can complete the unstake operation and receive
their staked tokens.

Pool administrators can change any of these parameters at any time. To make a pool immutable, we recommend
transferring administration of that pool to the zero address.

### Metronome

The `Metronome` contract allows anyone to set incentivize for Game7 chain users to submit transactions at regular intervals.

These incentives can have different purposes for different applications. For example, they can be used to improve the fairness of blockhash-based
on-chain entropy sources. We also use the `Metronome` to incentivize steady block production on Game7 testnet.

- The [`Metronome` smart contract](./web3/contracts/metronome/Metronome.sol).
- [`robognome`](./cmd/robognome/README.md) - A reference bot which claims `Metronome` bounties.

## Development

### Requirements

- [Node.js](https://nodejs.org/en) (version >= 20)
- [`hardhat`](https://github.com/NomicFoundation/hardhat), which we used to build and test our smart contracts
- [Go](https://go.dev/) (version >= 1.21), for the `game7` CLI, and other developmental and operational tools
- [`seer`](https://github.com/G7DAO/seer), which we use to generate Go bindings and command-line interfaces


### Building and testing this code

The [`Makefile`](./Makefile) for this project can be used to build all the code in the repository.

Build everything using:

```bash
make
```

To run all tests for all the code in this repository:

```bash
make test
```
