package main

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"

	"github.com/G7DAO/protocol/bindings/Metronome"
)

func isBountyAvailable(nextBlockNumber *big.Int, metronome *Metronome.Metronome, scheduleID *big.Int) (bool, error) {
	opts := &bind.CallOpts{}
	schedule, err := metronome.Schedules(opts, scheduleID)
	if err != nil {
		return false, err
	}
	r := new(big.Int).Mod(nextBlockNumber, schedule.Divisor)
	return r.Cmp(schedule.Remainder) == 0, nil
}

func Run(metronomeAddress common.Address, claimant *keystore.Key, client *ethclient.Client, intervalMilliseconds uint64, scheduleID *big.Int, resilient bool) error {
	ctx := context.Background()

	metronome, metronomeErr := Metronome.NewMetronome(metronomeAddress, client)
	if metronomeErr != nil {
		return fmt.Errorf("failed to create Metronome contract binding: %s", metronomeErr.Error())
	}

	chainID, chainIDErr := client.ChainID(ctx)
	if chainIDErr != nil {
		return chainIDErr
	}

	txOpts, txOptsErr := bind.NewKeyedTransactorWithChainID(claimant.PrivateKey, chainID)
	if txOptsErr != nil {

	}

	interval := time.Duration(intervalMilliseconds) * time.Millisecond
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	interruptHandler := make(chan os.Signal, 1)
	signal.Notify(interruptHandler, os.Interrupt, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			fmt.Println("Checking bounty availability")

			blockNumber, blockNumberErr := client.BlockNumber(ctx)
			if blockNumberErr != nil {
				resultErr := fmt.Errorf("failed to retrieve block number from the Ethereum client: %s", blockNumberErr.Error())
				if resilient {
					fmt.Fprint(os.Stderr, resultErr.Error())
					continue
				} else {
					return resultErr
				}
			}
			nextBlockNumber := new(big.Int).SetUint64(blockNumber + 1)
			fmt.Printf("Next block number: %s\n", nextBlockNumber.String())

			bountyAvailable, bountyAvailableErr := isBountyAvailable(nextBlockNumber, metronome, scheduleID)
			if bountyAvailableErr != nil {
				resultErr := fmt.Errorf("failed to check if bounty is available: %s", bountyAvailableErr.Error())
				if resilient {
					fmt.Fprint(os.Stderr, resultErr.Error())
					continue
				} else {
					return resultErr
				}
			}

			if bountyAvailable {
				claimTx, claimTxErr := metronome.Claim(txOpts, scheduleID, claimant.Address)
				if claimTxErr != nil {
					resultErr := fmt.Errorf("could not submit claim transaction: %s", claimTxErr.Error())
					if resilient {
						fmt.Fprint(os.Stderr, resultErr.Error())
						continue
					} else {
						return resultErr
					}
				}
				fmt.Printf("Claim transaction: %s\n", claimTx.Hash().String())
				_, claimTxReceiptErr := bind.WaitMined(ctx, client, claimTx)
				if claimTxReceiptErr != nil {
					resultErr := fmt.Errorf("could not mine claim transaction: %s", claimTxReceiptErr.Error())
					if resilient {
						fmt.Fprint(os.Stderr, resultErr.Error())
						continue
					} else {
						return resultErr
					}
				}
				fmt.Println("Claim transaction confirmed")
			}
		case <-interruptHandler:
			fmt.Printf("Robognome massacre")
			return nil
		}
	}
}
