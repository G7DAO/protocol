package chainprof

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/G7DAO/protocol/bindings/ERC20"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

func BatchFundAccounts(client *ethclient.Client, key *keystore.Key, password string, calldata []byte, recipients []Account, value *big.Int) ([]*types.Transaction, []TransactionResult, error) {
	results := []TransactionResult{}
	transactions := []*types.Transaction{}

	resultsChan := make(chan TransactionResult)
	transactionsChan := make(chan *types.Transaction)

	var sendWg sync.WaitGroup
	var resultWg sync.WaitGroup

	nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
	if nonceErr != nil {
		return transactions, results, nonceErr
	}

	for i, recipient := range recipients {
		fmt.Printf("%.2f%% - (%d of %d) Funding account %s \n", float64(i+1)/float64(len(recipients))*100, (i + 1), len(recipients), key.Address.Hex())
		sendWg.Add(1)
		go func(recipient Account, nonceValue int) {
			defer sendWg.Done()

			opts := OptTx{
				Nonce: nonce + uint64(nonceValue),
			}

			transaction, result, resultErr := SendTransaction(client, key, password, calldata, recipient.Address, value, opts)
			if resultErr != nil {
				fmt.Fprintln(os.Stderr, resultErr.Error())
				return
			}

			resultsChan <- result
			transactionsChan <- transaction
		}(recipient, i)
	}

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for transaction := range transactionsChan {
			transactions = append(transactions, transaction)
		}
	}()

	fmt.Println("Sending transactions...")
	sendWg.Wait()
	close(resultsChan)
	close(transactionsChan)
	resultWg.Wait()
	fmt.Println("Done!")

	return transactions, results, nil
}

func BatchFundAccountsERC20(client *ethclient.Client, key *keystore.Key, password string, tokenAddress string, recipients []Account, amount *big.Int) ([]*types.Transaction, []TransactionResult, error) {
	results := []TransactionResult{}
	transactions := []*types.Transaction{}
	resultsChan := make(chan TransactionResult)
	transactionsChan := make(chan *types.Transaction)

	var sendWg sync.WaitGroup
	var resultWg sync.WaitGroup

	nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
	if nonceErr != nil {
		return transactions, results, nonceErr
	}

	parsedABI, err := abi.JSON(strings.NewReader(ERC20.ERC20ABI))
	if err != nil {
		fmt.Printf("Failed to parse ABI: %s", err)
		return transactions, results, err
	}

	for i, recipient := range recipients {
		fmt.Printf("%.2f%% - (%d of %d) Funding account %s \n", float64(i+1)/float64(len(recipients))*100, (i + 1), len(recipients), key.Address.Hex())
		sendWg.Add(1)
		go func(recipient Account, nonceValue int) {
			defer sendWg.Done()

			opts := OptTx{
				Nonce: nonce + uint64(nonceValue),
			}

			calldata, calldataErr := parsedABI.Pack("transfer", common.HexToAddress(recipient.Address), amount)
			if calldataErr != nil {
				fmt.Fprintln(os.Stderr, calldataErr.Error())
				return
			}

			transactions, result, resultErr := SendTransaction(client, key, password, calldata, tokenAddress, nil, opts)
			if resultErr != nil {
				fmt.Fprintln(os.Stderr, resultErr.Error())
				return
			}

			resultsChan <- result
			transactionsChan <- transactions
		}(recipient, i)
	}

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for transaction := range transactionsChan {
			transactions = append(transactions, transaction)
		}
	}()

	fmt.Println("Sending transactions...")
	sendWg.Wait()
	close(resultsChan)
	close(transactionsChan)
	resultWg.Wait()
	fmt.Println("Done!")

	return transactions, results, nil
}

func BatchDrainAccounts(client *ethclient.Client, accountsDir string, recipientAddress string, password string) ([]*types.Transaction, []TransactionResult, error) {
	results := []TransactionResult{}
	transactions := []*types.Transaction{}
	resultsChan := make(chan TransactionResult)
	transactionsChan := make(chan *types.Transaction)
	sendWg := sync.WaitGroup{}
	resultWg := sync.WaitGroup{}

	keyFiles, keyFilesErr := os.ReadDir(accountsDir)
	if keyFilesErr != nil {
		return transactions, results, keyFilesErr
	}

	for i, keyFile := range keyFiles {
		key, keysErr := ERC20.KeyFromFile(filepath.Join(accountsDir, keyFile.Name()), password)
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

			transaction, result, resultErr := SendTransaction(client, key, password, []byte{}, recipientAddress, balance.Sub(balance, transactionCost), gasConfig)

			if resultErr != nil {
				fmt.Fprintln(os.Stderr, resultErr.Error())
				return
			}
			resultsChan <- result
			transactionsChan <- transaction
		}(key, balance)
	}

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for transaction := range transactionsChan {
			transactions = append(transactions, transaction)
		}
	}()

	fmt.Println("Sending transactions...")
	sendWg.Wait()
	close(resultsChan)
	close(transactionsChan)
	resultWg.Wait()
	fmt.Println("Done!")

	return transactions, results, nil
}

func BatchDrainAccountsERC20(client *ethclient.Client, accountsDir string, recipientAddress string, password string, tokenAddress string) ([]*types.Transaction, []TransactionResult, error) {
	results := []TransactionResult{}
	transactions := []*types.Transaction{}
	resultsChan := make(chan TransactionResult)
	transactionsChan := make(chan *types.Transaction)
	sendWg := sync.WaitGroup{}
	resultWg := sync.WaitGroup{}

	keyFiles, keyFilesErr := os.ReadDir(accountsDir)
	if keyFilesErr != nil {
		return transactions, results, keyFilesErr
	}

	parsedABI, err := abi.JSON(strings.NewReader(ERC20.ERC20ABI))
	if err != nil {
		return transactions, results, err
	}

	for i, keyFile := range keyFiles {
		key, keysErr := ERC20.KeyFromFile(filepath.Join(accountsDir, keyFile.Name()), password)
		if keysErr != nil {
			continue
		}

		contract, contractErr := ERC20.NewERC20(common.HexToAddress(tokenAddress), client)
		if contractErr != nil {
			return transactions, results, contractErr
		}
		contract.BalanceOf(nil, key.Address)

		session := ERC20.ERC20CallerSession{
			Contract: &contract.ERC20Caller,
			CallOpts: bind.CallOpts{},
		}

		balance, balanceErr := session.BalanceOf(
			key.Address,
		)
		if balanceErr != nil {
			continue
		}

		fmt.Printf("%.2f%% - (%d of %d) Draining account %s \n", float64(i+1)/float64(len(keyFiles))*100, (i + 1), len(keyFiles), key.Address.Hex())

		sendWg.Add(1)
		go func(key *keystore.Key, balance *big.Int) {
			defer sendWg.Done()

			calldata, calldataErr := parsedABI.Pack("transfer", common.HexToAddress(recipientAddress), balance)
			if calldataErr != nil {
				fmt.Fprintln(os.Stderr, calldataErr.Error())
				return
			}

			transaction, result, resultErr := SendTransaction(client, key, password, calldata, tokenAddress, nil, OptTx{})

			if resultErr != nil {
				fmt.Fprintln(os.Stderr, resultErr.Error())
				return
			}
			resultsChan <- result
			transactionsChan <- transaction
		}(key, balance)
	}

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultsChan {
			results = append(results, result)
		}
	}()

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for transaction := range transactionsChan {
			transactions = append(transactions, transaction)
		}
	}()

	fmt.Println("Sending transactions...")
	sendWg.Wait()
	close(resultsChan)
	close(transactionsChan)
	resultWg.Wait()
	fmt.Println("Done!")

	return transactions, results, nil
}
