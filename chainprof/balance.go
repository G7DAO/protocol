package chainprof

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"sync"

	"github.com/G7DAO/protocol/bindings/Game7Token"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/ethclient"
)

func BatchFundAccounts(client *ethclient.Client, key *keystore.Key, password string, calldata []byte, recipients []Account, value *big.Int) ([]TransactionResult, error) {
	results := []TransactionResult{}
	resultsChan := make(chan TransactionResult)

	var sendWg sync.WaitGroup
	var resultWg sync.WaitGroup

	nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
	if nonceErr != nil {
		return results, nonceErr
	}

	for i, recipient := range recipients {
		fmt.Printf("%.2f%% - (%d of %d) Funding account %s \n", float64(i+1)/float64(len(recipients))*100, (i + 1), len(recipients), key.Address.Hex())
		sendWg.Add(1)
		go func(recipient Account, nonceValue int) {
			defer sendWg.Done()

			opts := OptTx{
				Nonce: nonce + uint64(nonceValue),
			}

			_, result, resultErr := SendTransaction(client, key, password, calldata, recipient.Address, value, opts)
			if resultErr != nil {
				fmt.Fprintln(os.Stderr, resultErr.Error())
				return
			}

			resultsChan <- result
		}(recipient, i)
	}

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	fmt.Println("Sending transactions...")
	sendWg.Wait()
	close(resultsChan)
	resultWg.Wait()
	fmt.Println("Done!")

	return results, nil
}

func BatchDrainAccounts(client *ethclient.Client, accountsDir string, recipientAddress string, password string) ([]TransactionResult, error) {
	results := []TransactionResult{}
	resultsChan := make(chan TransactionResult)
	sendWg := sync.WaitGroup{}
	resultWg := sync.WaitGroup{}

	keyFiles, keyFilesErr := os.ReadDir(accountsDir)
	if keyFilesErr != nil {
		return results, keyFilesErr
	}

	for i, keyFile := range keyFiles {
		key, keysErr := Game7Token.KeyFromFile(filepath.Join(accountsDir, keyFile.Name()), password)
		if keysErr != nil {
			continue
		}

		balance, balanceErr := client.BalanceAt(context.Background(), key.Address, nil)
		if balanceErr != nil {
			continue
		}

		fmt.Printf("%.2f%% - (%d of %d) Draining account %s \n", float64(i+1)/float64(len(keyFiles))*100, (i + 1), len(keyFiles), key.Address.Hex())

		sendWg.Add(1)
		go func(key *keystore.Key, balance *big.Int) {
			defer sendWg.Done()

			gasConfig := OptTx{
				MaxFeePerGas:         big.NewInt(10000000),
				MaxPriorityFeePerGas: big.NewInt(1),
			}

			transactionCost := big.NewInt(1000000 * 10000000)
			if balance.Cmp(transactionCost) < 0 {
				fmt.Printf("Insufficient funds for account %s\n", key.Address.Hex())
				return
			}

			_, result, resultErr := SendTransaction(client, key, password, []byte{}, recipientAddress, balance.Sub(balance, transactionCost), gasConfig)

			if resultErr != nil {
				fmt.Fprintln(os.Stderr, resultErr.Error())
				return
			}
			resultsChan <- result
		}(key, balance)
	}

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	fmt.Println("Sending transactions...")
	sendWg.Wait()
	close(resultsChan)
	resultWg.Wait()
	fmt.Println("Done!")

	return results, nil
}
