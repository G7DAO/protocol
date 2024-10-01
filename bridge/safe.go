package bridge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"

	"github.com/G7DAO/protocol/bindings/GnosisSafe"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/math"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/signer/core/apitypes"
)

// OperationType represents the type of operation for a Safe transaction
type OperationType uint8

const (
	Call         OperationType = 0
	DelegateCall OperationType = 1
)

// String returns the string representation of the OperationType
func (o OperationType) String() string {
	switch o {
	case Call:
		return "Call"
	case DelegateCall:
		return "DelegateCall"
	default:
		return "Unknown"
	}
}

// SafeTransactionData represents the data for a Safe transaction
type SafeTransactionData struct {
	To             string        `json:"to"`
	Value          string        `json:"value"`
	Data           string        `json:"data"`
	Operation      OperationType `json:"operation"`
	SafeTxGas      uint64        `json:"safeTxGas"`
	BaseGas        uint64        `json:"baseGas"`
	GasPrice       string        `json:"gasPrice"`
	GasToken       string        `json:"gasToken"`
	RefundReceiver string        `json:"refundReceiver"`
	Nonce          uint64        `json:"nonce"`
	SafeTxHash     string        `json:"safeTxHash"`
	Sender         string        `json:"sender"`
	Signature      string        `json:"signature"`
	Origin         string        `json:"origin"`
}

const (
	NativeTokenAddress = "0x0000000000000000000000000000000000000000"
)

func CreateSafeProposal(client *ethclient.Client, key *keystore.Key, safeAddress common.Address, to common.Address, data []byte, value *big.Int, safeApi string, safeOperation OperationType) error {
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		return fmt.Errorf("failed to get chain ID: %v", err)
	}

	// Create a new instance of the GnosisSafe contract
	safeInstance, err := GnosisSafe.NewGnosisSafe(safeAddress, client)
	if err != nil {
		return fmt.Errorf("failed to create GnosisSafe instance: %v", err)
	}

	// Fetch the current nonce from the Safe contract
	nonce, err := safeInstance.Nonce(&bind.CallOpts{})
	if err != nil {
		return fmt.Errorf("failed to fetch nonce from Safe contract: %v", err)
	}

	safeTransactionData := SafeTransactionData{
		To:             to.Hex(),
		Value:          value.String(),
		Data:           common.Bytes2Hex(data),
		Operation:      safeOperation,
		SafeTxGas:      0,
		BaseGas:        0,
		GasPrice:       "0",
		GasToken:       NativeTokenAddress,
		RefundReceiver: NativeTokenAddress,
		Nonce:          nonce.Uint64(),
	}

	// Calculate SafeTxHash
	safeTxHash, err := CalculateSafeTxHash(safeAddress, safeTransactionData, chainID)
	if err != nil {
		return fmt.Errorf("failed to calculate SafeTxHash: %v", err)
	}

	// Sign the SafeTxHash
	signature, err := crypto.Sign(safeTxHash.Bytes(), key.PrivateKey)
	if err != nil {
		return fmt.Errorf("failed to sign SafeTxHash: %v", err)
	}

	// Adjust V value for Ethereum's replay protection
	signature[64] += 27

	// Convert signature to hex
	senderSignature := "0x" + common.Bytes2Hex(signature)

	// Prepare the request body
	requestBody := map[string]interface{}{
		"to":             safeTransactionData.To,
		"value":          safeTransactionData.Value,
		"data":           "0x" + safeTransactionData.Data,
		"operation":      int(safeTransactionData.Operation),
		"safeTxGas":      fmt.Sprintf("%d", safeTransactionData.SafeTxGas),
		"baseGas":        fmt.Sprintf("%d", safeTransactionData.BaseGas),
		"gasPrice":       safeTransactionData.GasPrice,
		"gasToken":       safeTransactionData.GasToken,
		"refundReceiver": safeTransactionData.RefundReceiver,
		"nonce":          fmt.Sprintf("%d", safeTransactionData.Nonce),
		"safeTxHash":     safeTxHash.Hex(),
		"sender":         key.Address.Hex(),
		"signature":      senderSignature,
		"origin":         fmt.Sprintf("{\"url\":\"%s\",\"name\":\"TokenSender Deployment\"}", safeApi),
	}

	// Marshal the request body to JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %v", err)
	}

	// Send the request to the Safe Transaction Service
	req, err := http.NewRequest("POST", safeApi, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	fmt.Println("Safe proposal created successfully")
	return nil
}

func CalculateSafeTxHash(safeAddress common.Address, txData SafeTransactionData, chainID *big.Int) (common.Hash, error) {
	domainSeparator := apitypes.TypedDataDomain{
		ChainId:           (*math.HexOrDecimal256)(chainID),
		VerifyingContract: safeAddress.Hex(),
	}

	typedData := apitypes.TypedData{
		Types: apitypes.Types{
			"EIP712Domain": []apitypes.Type{
				{Name: "chainId", Type: "uint256"},
				{Name: "verifyingContract", Type: "address"},
			},
			"SafeTx": []apitypes.Type{
				{Name: "to", Type: "address"},
				{Name: "value", Type: "uint256"},
				{Name: "data", Type: "bytes"},
				{Name: "operation", Type: "uint8"},
				{Name: "safeTxGas", Type: "uint256"},
				{Name: "baseGas", Type: "uint256"},
				{Name: "gasPrice", Type: "uint256"},
				{Name: "gasToken", Type: "address"},
				{Name: "refundReceiver", Type: "address"},
				{Name: "nonce", Type: "uint256"},
			},
		},
		Domain:      domainSeparator,
		PrimaryType: "SafeTx",
		Message: apitypes.TypedDataMessage{
			"to":             txData.To,
			"value":          txData.Value,
			"data":           "0x" + txData.Data,
			"operation":      fmt.Sprintf("%d", txData.Operation),
			"safeTxGas":      fmt.Sprintf("%d", txData.SafeTxGas),
			"baseGas":        fmt.Sprintf("%d", txData.BaseGas),
			"gasPrice":       txData.GasPrice,
			"gasToken":       txData.GasToken,
			"refundReceiver": txData.RefundReceiver,
			"nonce":          fmt.Sprintf("%d", txData.Nonce),
		},
	}

	typedDataHash, _, err := apitypes.TypedDataAndHash(typedData)
	if err != nil {
		return common.Hash{}, fmt.Errorf("failed to hash typed data: %v", err)
	}

	return common.BytesToHash(typedDataHash), nil
}
