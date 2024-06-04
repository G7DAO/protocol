package chainprof

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
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
	GasUsed              string `json:"gasUsed"`
	GasPrice             string `json:"gasPrice"`
	BlockNumber          uint64 `json:"blockNumber"`
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

func EvaluateAccount(rpcURL string, accountsDir string, password string, calldata []byte, to string, value *big.Int, transactionsPerAccount uint) ([]transactionResult, []common.Address, time.Duration, uint64, uint64, error) {
	results := []transactionResult{}
	transactions := []*types.Transaction{}
	accounts := []common.Address{}
	duration := time.Duration(0)

	keyFiles, keyFileErr := os.ReadDir(accountsDir)
	if keyFileErr != nil {
		return results, accounts, duration, 0, 0, keyFileErr
	}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, accounts, duration, 0, 0, clientErr
	}

	var sendWg sync.WaitGroup
	var resultWg sync.WaitGroup

	resultChan := make(chan transactionResult)
	transactionChan := make(chan *types.Transaction)

	for i, keyFile := range keyFiles {
		key, keyErr := Game7Token.KeyFromFile(filepath.Join(accountsDir, keyFile.Name()), password)
		if keyErr != nil {
			return results, accounts, duration, 0, 0, keyErr
		}

		accounts = append(accounts, key.Address)

		nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
		if nonceErr != nil {
			return results, accounts, duration, 0, 0, nonceErr
		}

		accountsPercentage := float64(i+1) / float64(len(keyFiles)) * 100
		fmt.Printf("%.2f%% - Processing account %s with nonce %d \n", accountsPercentage, key.Address.Hex(), nonce)

		for j := uint(0); j < transactionsPerAccount; j++ {
			sendWg.Add(1)
			go SubmitTransaction(&sendWg, resultChan, transactionChan, key, j, nonce, accountsPercentage, transactionsPerAccount, client, password, calldata, to, value)
		}
	}

	fmt.Printf("Sending %d transactions \n", len(transactions))

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for result := range resultChan {
			results = append(results, result)
		}
	}()

	resultWg.Add(1)
	go func() {
		defer resultWg.Done()
		for transaction := range transactionChan {
			transactions = append(transactions, transaction)
		}
	}()

	sendWg.Wait()
	close(resultChan)
	close(transactionChan)
	resultWg.Wait()
	fmt.Printf("All %d transactions sent! \n", len(transactions))

	fmt.Printf("transactions length: %d\n", len(transactions))
	fmt.Printf("results length: %d\n", len(results))

	fmt.Printf("Waiting for %d transactions to be mined \n", len(transactions))
	var waitWg sync.WaitGroup
	for i, transaction := range transactions {
		waitWg.Add(1)
		go func(index int, transaction *types.Transaction) {
			defer waitWg.Done()

			fmt.Printf("Waiting for transaction %d to be mined\n", (index + 1))
			// Wait for each transaction to be mined
			receipt, receiptErr := bind.WaitMined(context.Background(), client, transaction)
			if receiptErr != nil {
				fmt.Fprintln(os.Stderr, receiptErr.Error())
				return
			}
			fmt.Printf("Transaction %d mined\n", (index + 1))

			results[index].GasUsed = fmt.Sprintf("%d", receipt.GasUsed)
			results[index].GasPrice = receipt.EffectiveGasPrice.String()
			results[index].BlockNumber = receipt.BlockNumber.Uint64()
		}(i, transaction)
	}

	fmt.Printf("Waiting for %d transactions to be mined\n", len(transactions))
	waitWg.Wait()
	fmt.Printf("All %d transactions mined! \n", len(transactions))

	var initialBlockNumber, latestBlockNumber uint64

	for _, result := range results {
		if initialBlockNumber == 0 {
			initialBlockNumber = result.BlockNumber
		} else if result.BlockNumber < initialBlockNumber {
			initialBlockNumber = result.BlockNumber
		}

		if result.BlockNumber > latestBlockNumber {
			latestBlockNumber = result.BlockNumber
		}
	}

	fmt.Printf("Initial block number: %d\n", initialBlockNumber)
	fmt.Printf("Latest block number: %d\n", latestBlockNumber)

	initialBlockTimestamp, initialBlockTimestampErr := ArbitrumGetBlockTimestampByBlockNumber(rpcURL, big.NewInt(int64(initialBlockNumber)))
	if initialBlockTimestampErr != nil {
		return results, accounts, duration, 0, 0, initialBlockTimestampErr
	}

	latestBlockTimestamp, latestBlockTimestampErr := ArbitrumGetBlockTimestampByBlockNumber(rpcURL, big.NewInt(int64(latestBlockNumber)))
	if latestBlockTimestampErr != nil {
		return results, accounts, duration, 0, 0, latestBlockTimestampErr
	}

	fmt.Printf("Initial block timestamp: %s\n", initialBlockTimestamp)
	fmt.Printf("Latest block timestamp: %s\n", latestBlockTimestamp)

	duration = latestBlockTimestamp.Sub(initialBlockTimestamp)

	return results, accounts, duration, initialBlockNumber, latestBlockNumber, nil
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
		return transactionResponse, result, signedTransactionErr
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

func SubmitTransaction(
	sendWg *sync.WaitGroup,
	resultChan chan<- transactionResult,
	transactionChan chan<- *types.Transaction,
	key *keystore.Key,
	j uint,
	nonce uint64,
	accountsPercentage float64,
	transactionsPerAccount uint,
	client *ethclient.Client,
	password string,
	calldata []byte,
	to string,
	value *big.Int,
) {
	defer sendWg.Done()
	opts := optTx{
		Nonce: nonce + uint64(j),
	}
	transactionsPercentage := float64(j+1) / float64(transactionsPerAccount) * 100
	fmt.Printf("%.2f%% - Sending transaction for account %s with nonce %d (%.0f%% completed) \n", accountsPercentage, key.Address.Hex(), opts.Nonce, transactionsPercentage)
	transaction, result, transactionErr := SendTransaction(client, key, password, calldata, to, value, opts)
	if transactionErr != nil {
		fmt.Fprintln(os.Stderr, transactionErr.Error())
		return
	}

	resultChan <- result
	transactionChan <- transaction
}
