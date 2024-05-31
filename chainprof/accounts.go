package chainprof

import (
	"context"
	"encoding/json"
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

type account struct {
	Address string `json:"address"`
}

type fundResult struct {
	Hash                 string `json:"hash"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
	Nonce                string `json:"nonce"`
	From                 string `json:"from"`
	To                   string `json:"to"`
	Value                string `json:"value"`
}

func FundAccounts(rpcURL string, accountsDir string, keyFile string, password string, value *big.Int) ([]fundResult, error) {
	results := []fundResult{}

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
		result, resultErr := TransferEth(client, key, password, recipient.Address, value)
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

func DrainAccounts(rpcURL string, accountsDir string, recipientAddress string, password string) ([]fundResult, error) {
	results := []fundResult{}

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

		transactionCost := big.NewInt(1000000 * 10000000)
		result, resultErr := TransferEth(client, accountKey, password, recipientAddress, balance.Sub(balance, transactionCost))
		if resultErr != nil {
			fmt.Fprintln(os.Stderr, resultErr.Error())
			continue
		}

		results = append(results, result)
	}

	return results, nil
}

func TransferEth(client *ethclient.Client, key *keystore.Key, password string, recipient string, value *big.Int) (fundResult, error) {
	result := fundResult{}

	chainID, chainIDErr := client.ChainID(context.Background())
	if chainIDErr != nil {
		return result, chainIDErr
	}

	nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
	if nonceErr != nil {
		return result, nonceErr
	}

	recipientAddress := common.HexToAddress(recipient)

	transaction := types.NewTx(&types.DynamicFeeTx{
		ChainID:   chainID,
		Nonce:     nonce,
		GasTipCap: big.NewInt(1),
		GasFeeCap: big.NewInt(10000000),
		Gas:       uint64(1000000),
		To:        &recipientAddress,
		Value:     value,
		Data:      nil,
	})

	signedTransaction, signedTransactionErr := types.SignTx(transaction, types.NewLondonSigner(chainID), key.PrivateKey)
	if signedTransactionErr != nil {
		return result, signedTransactionErr
	}

	sendTransactionErr := client.SendTransaction(context.Background(), signedTransaction)
	if sendTransactionErr != nil {
		return result, sendTransactionErr
	}

	result = fundResult{
		Hash:                 signedTransaction.Hash().Hex(),
		MaxFeePerGas:         transaction.GasFeeCap().String(),
		MaxPriorityFeePerGas: transaction.GasTipCap().String(),
		Nonce:                fmt.Sprintf("%d", transaction.Nonce()),
		From:                 key.Address.Hex(),
		To:                   recipientAddress.Hex(),
		Value:                value.String(),
	}

	return result, nil
}
