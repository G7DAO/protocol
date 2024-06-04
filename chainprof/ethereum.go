package chainprof

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"time"
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

func call(url string, blockNumber *big.Int) (BlockResponse, error) {
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

	fmt.Printf("[call function] payload: %v\n", payload)

	// Convert payload to JSON
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[call function] error marshalling JSON: %v", err)
	}

	// Create a new HTTP POST request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[call function] error creating request: %v", err)
	}

	// Set the content type to application/json
	req.Header.Set("Content-Type", "application/json")

	// Create a new HTTP client and send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[call function] error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response
	var result BlockResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return BlockResponse{}, fmt.Errorf("[call function] error decoding response: %v", err)
	}

	return result, nil
}

// Function to get the block timestamp by block number
func ArbitrumGetBlockTimestampByBlockNumber(url string, blockNumber *big.Int) (time.Time, error) {
	/* 	for {
		currentBlock, err := call(url, nil)
		if err != nil {
			return time.Time{}, fmt.Errorf("[for loop] error calling RPC first: %v", err)
		}
		_, currentBlockNumberErr := big.NewInt(0).SetString(currentBlock.Result.Number, 0)
		if !currentBlockNumberErr {
			return time.Time{}, fmt.Errorf("[for loop] error parsing block number: %v", currentBlockNumberErr)
		}

		timestamp, err := strconv.ParseInt(currentBlock.Result.Timestamp[2:], 16, 64)
		if err != nil {
			return time.Time{}, fmt.Errorf("[for loop] error parsing timestamp: %v \n", err)
		}
		now := time.Now()

		fmt.Printf("[for loop] currentBlock: %v\n", currentBlock)

		if now.Compare(time.Unix(timestamp+30, 0)) >= 0 {
			break
		}
		// sleep for 1 second
		time.Sleep(30 * time.Second)
	} */

	// Call the RPC endpoint
	result, err := call(url, blockNumber)
	if err != nil {
		return time.Time{}, fmt.Errorf("[regular func] error calling RPC: %v", err)
	}

	fmt.Printf("[regular func] result: %v\n", result)

	// Extract the block timestamp
	timestampHex := result.Result.Timestamp
	// Convert hex timestamp to decimal
	timestamp, err := strconv.ParseInt(timestampHex[2:], 16, 64)
	if err != nil {
		return time.Time{}, fmt.Errorf("[regular func] error parsing timestamp: %s \n", timestampHex)
	}

	// Convert timestamp to time.Time
	blockTime := time.Unix(timestamp, 0)

	return blockTime, nil
}
