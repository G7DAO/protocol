package chainprof

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"path/filepath"

	"github.com/G7DAO/protocol/bindings/Game7Token"
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

func FundAccounts(rpcURL string, accountsDir string, keyFile string, password string, value *big.Int) ([]TransactionResult, error) {
	results := []TransactionResult{}

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
		_, result, resultErr := SendTransaction(client, key, password, []byte{}, recipient.Address, value, OptTx{})
		if resultErr != nil {
			fmt.Fprintln(os.Stderr, resultErr.Error())
			continue
		}

		results = append(results, result)
	}

	return results, nil
}

func DrainAccounts(rpcURL string, accountsDir string, recipientAddress string, password string) ([]TransactionResult, error) {
	results := []TransactionResult{}

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

		gasConfig := OptTx{
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

func EvaluateAccount(rpcURL string, accountsDir string, password string, calldata []byte, to string, value *big.Int, transactionsPerAccount uint) ([]TransactionResult, []common.Address, error) {
	results := []TransactionResult{}
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

	fmt.Printf("Sending %d transaction for %d accounts\n", transactionsPerAccount, len(keyFiles))

	for i, keyFile := range keyFiles {
		key, keyErr := Game7Token.KeyFromFile(filepath.Join(accountsDir, keyFile.Name()), password)
		if keyErr != nil {
			return results, accounts, keyErr
		}
		accounts = append(accounts, key.Address)

		fmt.Printf("%.2f%% - Sending %d transaction for account %s \n", float64(i+1)/float64(len(keyFiles))*100, transactionsPerAccount, key.Address.Hex())
		accountTransactions, accountResults, sendTransactionsErr := BatchSendTransactionsForAccount(client, key, password, calldata, to, value, transactionsPerAccount)
		if sendTransactionsErr != nil {
			fmt.Fprintln(os.Stderr, sendTransactionsErr.Error())
			continue
		}

		transactions = append(transactions, accountTransactions...)
		results = append(results, accountResults...)
	}

	receipts, receiptsErr := BatchWaitForTransactionsToBeMined(client, transactions)
	if receiptsErr != nil {
		return results, accounts, receiptsErr
	}

	results = UpdateTransactionResultsWithReceipts(results, receipts)

	return results, accounts, nil
}
