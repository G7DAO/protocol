package chainprof

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/G7DAO/protocol/bindings/Game7Token"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

func CreateAccounts(accountsDir string, numAccounts int, password string) error {
	// WARNING: This is a *very* insecure method to generate accounts. It is using insecure ScryptN and ScryptP parameters!
	// Do not use this for ANYTHING important please.
	s := keystore.NewKeyStore(accountsDir, 2, 8)

	for i := 0; i < numAccounts; i++ {
		_, err := s.NewAccount(password)
		if err != nil {
			return err
		}
	}

	return nil
}

type account struct {
	Address string `json:"address"`
}

type transactionResult struct {
	Hash                 string `json:"hash"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
	Nonce                string `json:"nonce"`
	From                 string `json:"from"`
	To                   string `json:"to"`
	Value                string `json:"value"`
	Data                 string `json:"data"`
	CreatedAt            string `json:"createdAt"`
	ExecutedAt           string `json:"executedAt"`
	ExecutionTime        string `json:"executionTime"`
	GasUsed              string `json:"gasUsed"`
	GasPrice             string `json:"gasPrice"`
}

type optTx struct {
	MaxFeePerGas         *big.Int
	MaxPriorityFeePerGas *big.Int
	Nonce                uint64
}

func FundAccounts(rpcURL string, accountsDir string, keyFile string, password string, value *big.Int) ([]transactionResult, error) {
	results := []transactionResult{}

	recipients, recipientErr := ReadAccounts(accountsDir)
	if recipientErr != nil {
		return results, recipientErr
	}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, clientErr
	}

	key, keyErr := Game7Token.KeyFromFile(keyFile, password)
	if keyErr != nil {
		return results, keyErr
	}

	for _, recipient := range recipients {
		_, result, resultErr := SendTransaction(client, key, password, []byte{}, recipient.Address, value, optTx{})
		if resultErr != nil {
			fmt.Fprintln(os.Stderr, resultErr.Error())
			continue
		}

		results = append(results, result)
	}

	return results, nil
}

func ReadAccounts(accountsDir string) ([]account, error) {
	recipients := []account{}

	// Read the directory
	files, filesErr := os.ReadDir(accountsDir)
	if filesErr != nil {
		return recipients, filesErr
	}

	// Loop through the files and print their names
	for _, file := range files {
		// Read the JSON file
		fullPath := filepath.Join(accountsDir, file.Name())
		data, dataErr := os.ReadFile(fullPath)
		if dataErr != nil {
			return recipients, dataErr
		}

		if len(data) == 0 {
			continue
		}

		// Create a variable to hold the unmarshalled JSON data
		var recipient account

		// Unmarshal the JSON data into the struct
		unmarshalErr := json.Unmarshal(data, &recipient)
		if unmarshalErr != nil {
			continue
		}

		recipients = append(recipients, recipient)
	}

	return recipients, nil
}

func DrainAccounts(rpcURL string, accountsDir string, recipientAddress string, password string) ([]transactionResult, error) {
	results := []transactionResult{}

	accountKeyFiles, accountKeyFileErr := os.ReadDir(accountsDir)
	if accountKeyFileErr != nil {
		return results, accountKeyFileErr
	}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, clientErr
	}

	for _, accountKeyFile := range accountKeyFiles {
		accountKey, accountKeyErr := Game7Token.KeyFromFile(filepath.Join(accountsDir, accountKeyFile.Name()), password)
		if accountKeyErr != nil {
			return results, accountKeyErr
		}

		balance, balanceErr := client.BalanceAt(context.Background(), accountKey.Address, nil)
		if balanceErr != nil {
			return results, balanceErr
		}

		gasConfig := optTx{
			MaxFeePerGas:         big.NewInt(10000000),
			MaxPriorityFeePerGas: big.NewInt(1),
		}

		transactionCost := big.NewInt(1000000 * 10000000)
		_, result, resultErr := SendTransaction(client, accountKey, password, []byte{}, recipientAddress, balance.Sub(balance, transactionCost), gasConfig)

		if resultErr != nil {
			fmt.Fprintln(os.Stderr, resultErr.Error())
			continue
		}

		results = append(results, result)
	}

	return results, nil
}

func EvaluateAccount(rpcURL string, accountsDir string, password string, calldata []byte, to string, value *big.Int, transactionsPerAccount uint) ([]transactionResult, []common.Address, error) {
	results := []transactionResult{}
	transactions := []*types.Transaction{}
	accounts := []common.Address{}

	keyFiles, keyFileErr := os.ReadDir(accountsDir)
	if keyFileErr != nil {
		return results, accounts, keyFileErr
	}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, accounts, clientErr
	}

	var sendWg sync.WaitGroup

	for _, keyFile := range keyFiles {
		key, keyErr := Game7Token.KeyFromFile(filepath.Join(accountsDir, keyFile.Name()), password)
		if keyErr != nil {
			return results, accounts, keyErr
		}

		accounts = append(accounts, key.Address)

		nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
		if nonceErr != nil {
			return results, accounts, nonceErr
		}

		fmt.Printf("Processing account %s with nonce %d\n", key.Address.Hex(), nonce)

		for index := uint(0); index < transactionsPerAccount; index++ {
			sendWg.Add(1)
			go func(key *keystore.Key, index uint, nonce uint64) {
				defer sendWg.Done()
				opts := optTx{
					Nonce: nonce + uint64(index),
				}

				fmt.Printf("Sending transaction %d for account %s with nonce %d\n", index, key.Address.Hex(), opts.Nonce)
				transaction, result, transactionErr := SendTransaction(client, key, password, calldata, to, value, opts)
				if transactionErr != nil {
					fmt.Fprintln(os.Stderr, transactionErr.Error())
					return
				}

				transactions = append(transactions, transaction)
				results = append(results, result)
			}(key, index, nonce)
		}
	}

	fmt.Printf("Sending %d transactions\n", len(transactions))
	sendWg.Wait()
	fmt.Printf("All %d transactions sent!", len(transactions))

	fmt.Printf("Waiting for %d transactions to be mined\n", len(transactions))
	var waitWg sync.WaitGroup
	for index, transaction := range transactions {
		waitWg.Add(1)
		go func(index int, transaction *types.Transaction, result transactionResult) {
			defer waitWg.Done()
			// Wait for each transaction to be mined
			fmt.Printf("Waiting for transaction %d to be mined\n", index)
			receipt, receiptErr := bind.WaitMined(context.Background(), client, transaction)
			if receiptErr != nil {
				fmt.Fprintln(os.Stderr, receiptErr.Error())
				return
			}
			fmt.Printf("Transaction %d mined\n", index)

			executedAt := time.Now()
			createdAtTime, _ := time.Parse("2006-01-02 15:04:05", result.CreatedAt)
			duration := executedAt.Sub(createdAtTime)

			result.GasUsed = fmt.Sprintf("%d", receipt.GasUsed)
			result.ExecutedAt = executedAt.Format("2006-01-02 15:04:05")
			result.ExecutionTime = strconv.FormatFloat(duration.Seconds(), 'f', -1, 64)

			results = append(results, result)
		}(index, transaction, results[index])
	}

	fmt.Printf("Waiting for %d transactions to be mined\n", len(transactions))
	waitWg.Wait()
	fmt.Printf("All %d transactions mined! \n", len(transactions))

	return results, accounts, nil
}

func SendTransaction(client *ethclient.Client, key *keystore.Key, password string, calldata []byte, to string, value *big.Int, opts optTx) (*types.Transaction, transactionResult, error) {
	result := transactionResult{}
	transactionResponse := &types.Transaction{}

	chainID, chainIDErr := client.ChainID(context.Background())
	if chainIDErr != nil {
		return transactionResponse, result, chainIDErr
	}

	recipientAddress := common.HexToAddress(to)

	rawTransaction := ethereum.CallMsg{
		From:  key.Address,
		To:    &recipientAddress,
		Value: value,
		Data:  calldata,
	}

	gasLimit, gasLimitErr := client.EstimateGas(context.Background(), rawTransaction)
	if gasLimitErr != nil {
		return transactionResponse, result, gasLimitErr
	}

	if opts.MaxFeePerGas == nil {
		opts.MaxFeePerGas = big.NewInt(10000000)
	}

	if opts.MaxPriorityFeePerGas == nil {
		opts.MaxPriorityFeePerGas = big.NewInt(1)
	}

	if opts.Nonce == 0 {
		nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
		if nonceErr != nil {
			return transactionResponse, result, nonceErr
		}

		opts.Nonce = nonce
	}

	transaction := types.NewTx(&types.DynamicFeeTx{
		ChainID:   chainID,
		Nonce:     opts.Nonce,
		GasTipCap: opts.MaxPriorityFeePerGas,
		GasFeeCap: opts.MaxFeePerGas,
		Gas:       gasLimit,
		To:        &recipientAddress,
		Value:     value,
		Data:      calldata,
	})

	signedTransaction, signedTransactionErr := types.SignTx(transaction, types.NewLondonSigner(chainID), key.PrivateKey)
	if signedTransactionErr != nil {
		return signedTransaction, result, signedTransactionErr
	}

	result = transactionResult{
		Hash:                 signedTransaction.Hash().Hex(),
		MaxFeePerGas:         signedTransaction.GasFeeCap().String(),
		MaxPriorityFeePerGas: signedTransaction.GasTipCap().String(),
		Nonce:                fmt.Sprintf("%d", signedTransaction.Nonce()),
		From:                 key.Address.Hex(),
		To:                   signedTransaction.To().Hex(),
		Value:                signedTransaction.Value().String(),
		Data:                 hex.EncodeToString(signedTransaction.Data()),
		CreatedAt:            signedTransaction.Time().Format("2006-01-02 15:04:05"),
	}

	return signedTransaction, result, client.SendTransaction(context.Background(), signedTransaction)
}
