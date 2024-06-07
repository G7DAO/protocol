package chainprof

import (
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
	fmt.Println("WARNING: This is a *very* insecure method to generate accounts. It is using insecure ScryptN and ScryptP parameters!")
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

	transactions, results, resultsErr := BatchFundAccounts(client, key, password, []byte{}, recipients, value)
	if resultsErr != nil {
		return results, resultsErr
	}

	receipts, receiptsErr := BatchWaitForTransactionsToBeMined(client, transactions)
	if receiptsErr != nil {
		return results, receiptsErr
	}

	results = UpdateTransactionResultsWithReceipts(results, receipts)

	return results, nil
}

func FundAccountsERC20(rpcURL string, accountsDir string, keyFile string, password string, tokenAddress string, value *big.Int) ([]TransactionResult, error) {
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

	transactions, results, resultsErr := BatchFundAccountsERC20(client, key, password, tokenAddress, recipients, value)
	if resultsErr != nil {
		return results, resultsErr
	}

	receipts, receiptsErr := BatchWaitForTransactionsToBeMined(client, transactions)
	if receiptsErr != nil {
		return results, receiptsErr
	}

	results = UpdateTransactionResultsWithReceipts(results, receipts)

	return results, nil
}

func DrainAccounts(rpcURL string, accountsDir string, recipientAddress string, password string) ([]TransactionResult, error) {
	results := []TransactionResult{}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, clientErr
	}

	transactions, results, resultsErr := BatchDrainAccounts(client, accountsDir, recipientAddress, password)
	if resultsErr != nil {
		return results, resultsErr
	}

	receipts, receiptsErr := BatchWaitForTransactionsToBeMined(client, transactions)
	if receiptsErr != nil {
		return results, receiptsErr
	}

	results = UpdateTransactionResultsWithReceipts(results, receipts)

	return results, nil
}

func DrainAccountsERC20(rpcURL string, accountsDir string, recipientAddress string, password string, tokenAddress string) ([]TransactionResult, error) {
	results := []TransactionResult{}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, clientErr
	}

	transactions, results, resultsErr := BatchDrainAccountsERC20(client, accountsDir, recipientAddress, password, tokenAddress)
	if resultsErr != nil {
		return results, resultsErr
	}

	receipts, receiptsErr := BatchWaitForTransactionsToBeMined(client, transactions)
	if receiptsErr != nil {
		return results, receiptsErr
	}

	results = UpdateTransactionResultsWithReceipts(results, receipts)

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
