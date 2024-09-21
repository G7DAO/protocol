package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"

	"github.com/G7DAO/protocol/bindings/GnosisSafe" // Make sure this import path is correct
	"github.com/G7DAO/protocol/bindings/ImmutableCreate2Factory"
	"github.com/G7DAO/protocol/bindings/TokenSender"
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

func CreateSafeProposal(rpcURL, keyfile, password string, safeAddress, factoryAddress common.Address, value *big.Int, txServiceBaseUrl string) error {
	key, err := TokenSender.KeyFromFile(keyfile, password)
	if err != nil {
		return fmt.Errorf("failed to load key from file: %v", err)
	}

	// Generate deploy bytecode for TokenSender
	// 1 day in seconds
	deployBytecode, err := generateTokenSenderDeployBytecode()
	if err != nil {
		return fmt.Errorf("failed to generate deploy bytecode: %v", err)
	}

	// Generate salt
	salt, err := generateProperSalt(safeAddress)
	if err != nil {
		return fmt.Errorf("failed to generate salt: %v", err)
	}

	abi, err := ImmutableCreate2Factory.ImmutableCreate2FactoryMetaData.GetAbi()
	if err != nil {
		return fmt.Errorf("failed to get ABI: %v", err)
	}

	safeCreate2TxData, err := abi.Pack("safeCreate2", salt, deployBytecode)
	if err != nil {
		return fmt.Errorf("failed to pack safeCreate2 transaction: %v", err)
	}

	// Create Safe proposal
	err = createSafeProposal(rpcURL, key, safeAddress, factoryAddress, safeCreate2TxData, value, txServiceBaseUrl)
	if err != nil {
		return fmt.Errorf("failed to create Safe proposal: %v", err)
	}

	fmt.Println("Safe proposal created successfully")
	return nil
}

func generateProperSalt(from common.Address) ([32]byte, error) {
	var salt [32]byte

	// Copy the 'from' address to the first 20 bytes of the salt
	copy(salt[:20], from[:])

	// Generate random bytes for the remaining 12 bytes
	_, err := rand.Read(salt[20:])
	if err != nil {
		return [32]byte{}, fmt.Errorf("failed to generate random bytes: %w", err)
	}

	return salt, nil
}

func generateTokenSenderDeployBytecode() ([]byte, error) {
	faucetTimeInterval := big.NewInt(86400)
	abiPacked, err := TokenSender.TokenSenderMetaData.GetAbi()
	if err != nil {
		return nil, fmt.Errorf("failed to get ABI: %v", err)
	}

	constructorArguments, err := abiPacked.Pack("", faucetTimeInterval)
	if err != nil {
		return nil, fmt.Errorf("failed to pack constructor arguments: %v", err)
	}

	deployBytecode := append(common.FromHex(TokenSender.TokenSenderMetaData.Bin), constructorArguments...)
	return deployBytecode, nil
}

func createSafeProposal(rpcURL string, key *keystore.Key, safeAddress, to common.Address, data []byte, value *big.Int, txServiceBaseUrl string) error {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return fmt.Errorf("failed to connect to the Ethereum client: %v", err)
	}

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
		Operation:      Call,
		SafeTxGas:      0,
		BaseGas:        0,
		GasPrice:       "0",
		GasToken:       NativeTokenAddress,
		RefundReceiver: NativeTokenAddress, // Changed to match the example
		Nonce:          nonce.Uint64(),     // Use the fetched nonce
	}

	// Calculate SafeTxHash
	safeTxHash, err := calculateSafeTxHash(safeAddress, safeTransactionData, chainID)
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
		"origin":         fmt.Sprintf("{\"url\":\"%s\",\"name\":\"TokenSender Deployment\"}", txServiceBaseUrl),
	}

	// Marshal the request body to JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %v", err)
	}

	// Send the request to the Safe Transaction Service
	url := fmt.Sprintf("https://safe-client.safe.global/v1/chains/%s/transactions/%s/propose", chainID.String(), safeAddress.Hex())
	fmt.Println("url", url)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
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

func calculateSafeTxHash(safeAddress common.Address, txData SafeTransactionData, chainID *big.Int) (common.Hash, error) {
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
