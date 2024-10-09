<img src="https://content.game7.io/robognome.png" height="250"/>

# robognome

The `robognome` is a bot which automatically claims [`Metronome`](../../README.md#metronome) bounties. It is only a very simple implementation of such a bot,
intended as a reference. You are better off either forking and modifying the `robognome` or writing your own bot if you intend to farm `Metronome` bounties for profit.

## Installing `robognome`

To install from source, run the following command at the root of this git repository:

```bash
make bin/robognome
```

This will create a binary/executable called `bin/robognome`, which you can use to run `robognome`.

## Using `robognome`

Currently, a single `robognome` process can farm bounties for a single [`Metronome`](../../web3/contracts/metronome/Metronome.sol) schedule.

To use the bot, you will need:
1. `$RPC`: An RPC API URL for the blockchain you are operating on.
2. `$CLAIMANT`: A keyfile for an Ethereum account. This is a file in JSON format which, together with a password, can be used to recover the account's private key. More information at [ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/web3-secret-storage/). This is the [format used by `geth`](https://geth.ethereum.org/docs/developers/dapp-developer/native-accounts) to store accounts on disk. You can use the [`ethkey`](https://github.com/ethereum/go-ethereum/tree/master/cmd/ethkey) tool or any Ethereum-specific web3 library.
3. `$METRONOME`: The contract address for the `Metronome` contract which hosts the schedule you will farm bounties for.
4. `$SCHEDULE_ID`: The ID of the schedule you will farm bounties for.

For example, if you want to farm bounties against the schedule with ID `0` on the official `Metronome` contract on the Game7 testnet, you could set:

```
export RPC="https://testnet-rpc.game7.io" METRONOME="0xF1066bAB238158eCF09b176c2F6Ae9da31291e2c" SCHEDULE_ID=0
```

This schedule pays out `100000 wei` worth of the `TG7T` token to the first claimant to claim the bounty every block.

Your `$CLAIMANT` is your responsibility.

```bash
bin/robognome run \
    --contract $METRONOME \
    --interval 100 \
    --keyfile $CLAIMANT \
    --rpc $RPC \
    --schedule $SCHEDULE_ID \
    --resilient
```

An explanation of the additional flags:
1. `--interval`: This is the number of milliseconds to wait between attempts to farm the bounty.
2. `--resilient`: This specifies that the bot should ignore errors to claim the bounty if it encounters any, and just keep running.
