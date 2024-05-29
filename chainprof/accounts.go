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
	Hash string `json:"hash"`
	MaxFeePerGas string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
	Nonce string `json:"nonce"`
	From string `json:"from"`
	To string `json:"to"`
	Value string `json:"value"`
}

func FundAccounts(rpcURL string, accountsDir string, keyFile string, password string, value *big.Int) ([]fundResult, error) {
	results := []fundResult{}

	client, clientErr := ethclient.Dial(rpcURL)
	if clientErr != nil {
		return results, clientErr
	}

	key, keyErr := Game7Token.KeyFromFile(keyFile, password)

	if keyErr != nil {
		return results, keyErr
	}

	chainID, chainIDErr := client.ChainID(context.Background())
	if chainIDErr != nil {
		return results, chainIDErr
	}

	nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
	if nonceErr != nil {
		return results, nonceErr
	}

	recipients, recipientErr := ReadAccounts(accountsDir)
	if recipientErr != nil {
		return results, recipientErr
	}

	for i, recipient := range recipients {

		// data is nil because we are not calling a contract function. We are just transferring ETH.
		//transaction := types.NewTransaction(nonce, common.HexToAddress(recipient.address), value, gasLimit, gasPrice, nil)
		recipientAddress := common.HexToAddress(recipient.Address)

		transaction := types.NewTx(&types.DynamicFeeTx{
			ChainID:   chainID,
			Nonce:     nonce + uint64(i),
			GasTipCap: big.NewInt(1),
			GasFeeCap: big.NewInt(10000000),
			Gas:       uint64(1000000),
			To:        &recipientAddress,
			Value:     value,
			Data:      nil,
		})

		signedTransaction, signedTransactionErr := types.SignTx(transaction, types.NewLondonSigner(chainID), key.PrivateKey)
		if signedTransactionErr != nil {
			fmt.Fprintln(os.Stderr, signedTransactionErr.Error())
			continue
		}

		results = append(results, fundResult{
			Hash: signedTransaction.Hash().Hex(),
			MaxFeePerGas: transaction.GasFeeCap().String(),
			MaxPriorityFeePerGas: transaction.GasTipCap().String(),
			Nonce: fmt.Sprintf("%d", transaction.Nonce()),
			From: key.Address.Hex(),
			To: recipient.Address,
			Value: value.String(),
		})

		sendTransactionErr := client.SendTransaction(context.Background(), signedTransaction)
		if sendTransactionErr != nil {
			fmt.Fprintln(os.Stderr, sendTransactionErr.Error())
			continue
		}
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
