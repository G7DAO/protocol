package chainprof

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Define the response structure
type BlockResponse struct {
	Jsonrpc string `json:"jsonrpc"`
	Result  struct {
		Timestamp string `json:"timestamp"`
		Number    string `json:"number"`
	} `json:"result"`
	ID int `json:"id"`
}

func FetchBlockByNumber(url string, blockNumber *big.Int) (BlockResponse, error) {
	time.Sleep(time.Second)
	stringfyBlockNumber := "latest"

	if blockNumber != nil {
		// Convert block number to hex
		stringfyBlockNumber = fmt.Sprintf("0x%s", blockNumber.Text(16))
	}

	// Create the JSON payload
	payload := map[string]interface{}{
		"jsonrpc": "2.0",
		"method":  "eth_getBlockByNumber",
		"params":  []interface{}{stringfyBlockNumber, false},
		"id":      1,
	}

	// Convert payload to JSON
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[FetchBlockByNumber] error marshalling JSON: %v", err)
	}

	// Create a new HTTP POST request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[FetchBlockByNumber] error creating request: %v", err)
	}

	// Set the content type to application/json
	req.Header.Set("Content-Type", "application/json")

	// Create a new HTTP client and send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[FetchBlockByNumber] error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response
	var result BlockResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[FetchBlockByNumber] error decoding response: %v", err)
	}

	return result, nil
}

// Function to get the block timestamp by block number
func ArbitrumGetBlockTimestampByBlockNumber(url string, blockNumber *big.Int) (time.Time, error) {
	// Call the RPC endpoint
	result, err := FetchBlockByNumber(url, blockNumber)
	if err != nil {
		return time.Time{}, fmt.Errorf("[ArbitrumGetBlockTimestampByBlockNumber] error calling RPC: %v", err)
	}

	// Extract the block timestamp
	timestampHex := result.Result.Timestamp
	// Convert hex timestamp to decimal
	timestamp, err := strconv.ParseInt(timestampHex[2:], 16, 64)
	if err != nil {
		return time.Time{}, fmt.Errorf("[ArbitrumGetBlockTimestampByBlockNumber] error parsing timestamp: %s \n", timestampHex)
	}

	// Convert timestamp to time.Time
	blockTime := time.Unix(timestamp, 0)

	return blockTime, nil
}

// Function to send a transaction
func SendTransaction(client *ethclient.Client, key *keystore.Key, password string, calldata []byte, to string, value *big.Int, opts OptTx) (*types.Transaction, TransactionResult, error) {
	chainID, chainIDErr := client.ChainID(context.Background())
	if chainIDErr != nil {
		return nil, TransactionResult{}, chainIDErr
	}

	recipientAddress := common.HexToAddress(to)

	callMsg := ethereum.CallMsg{
		From:  key.Address,
		To:    &recipientAddress,
		Value: value,
		Data:  calldata,
	}

	gasLimit, gasLimitErr := client.EstimateGas(context.Background(), callMsg)
	if gasLimitErr != nil {
		return nil, TransactionResult{}, gasLimitErr
	}

	if opts.MaxFeePerGas == nil {
		baseFee, baseFeeErr := client.SuggestGasPrice(context.Background())
		if baseFeeErr != nil {
			return nil, TransactionResult{}, baseFeeErr
		}
		opts.MaxFeePerGas = baseFee
	}

	if opts.MaxPriorityFeePerGas == nil {
		gasTipCap, gasTipCapErr := client.SuggestGasTipCap(context.Background())
		if gasTipCapErr != nil {
			return nil, TransactionResult{}, gasTipCapErr
		}
		opts.MaxPriorityFeePerGas = gasTipCap
	}

	if opts.Nonce == 0 {
		nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
		if nonceErr != nil {
			return nil, TransactionResult{}, nonceErr
		}

		opts.Nonce = nonce
	}

	rawTransaction := types.NewTx(&types.DynamicFeeTx{
		ChainID:   chainID,
		Nonce:     opts.Nonce,
		GasTipCap: opts.MaxPriorityFeePerGas,
		GasFeeCap: opts.MaxFeePerGas,
		Gas:       gasLimit,
		To:        &recipientAddress,
		Value:     value,
		Data:      calldata,
	})

	signedTransaction, signedTransactionErr := types.SignTx(rawTransaction, types.NewLondonSigner(chainID), key.PrivateKey)
	if signedTransactionErr != nil {
		return nil, TransactionResult{}, signedTransactionErr
	}

	sendTransactionErr := client.SendTransaction(context.Background(), signedTransaction)
	if sendTransactionErr != nil {
		return nil, TransactionResult{}, sendTransactionErr
	}
	result := TransactionResult{
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

	return signedTransaction, result, nil
}

func ReadAccounts(AccountsDir string) ([]Account, error) {
	recipients := []Account{}

	// Read the directory
	files, filesErr := os.ReadDir(AccountsDir)
	if filesErr != nil {
		return recipients, filesErr
	}

	// Loop through the files and print their names
	for _, file := range files {
		// Read the JSON file
		fullPath := filepath.Join(AccountsDir, file.Name())
		data, dataErr := os.ReadFile(fullPath)
		if dataErr != nil {
			return recipients, dataErr
		}

		if len(data) == 0 {
			continue
		}

		// Create a variable to hold the unmarshalled JSON data
		var recipient Account

		// Unmarshal the JSON data into the struct
		unmarshalErr := json.Unmarshal(data, &recipient)
		if unmarshalErr != nil {
			continue
		}

		recipients = append(recipients, recipient)
	}

	return recipients, nil
}
