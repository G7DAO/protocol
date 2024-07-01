package bridge

import (
	"context"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Function to send a transaction
func SendTransaction(client *ethclient.Client, key *keystore.Key, password string, calldata []byte, to string, value *big.Int) (*types.Transaction, error) {
	chainID, chainIDErr := client.ChainID(context.Background())
	if chainIDErr != nil {
		return nil, chainIDErr
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
		return nil, gasLimitErr
	}

	baseFee, baseFeeErr := client.SuggestGasPrice(context.Background())
	if baseFeeErr != nil {
		return nil, baseFeeErr
	}

	gasTipCap, gasTipCapErr := client.SuggestGasTipCap(context.Background())
	if gasTipCapErr != nil {
		return nil, gasTipCapErr
	}

	nonce, nonceErr := client.PendingNonceAt(context.Background(), key.Address)
	if nonceErr != nil {
		return nil, nonceErr
	}

	rawTransaction := types.NewTx(&types.DynamicFeeTx{
		ChainID:   chainID,
		Nonce:     nonce,
		GasTipCap: gasTipCap,
		GasFeeCap: baseFee,
		Gas:       gasLimit,
		To:        &recipientAddress,
		Value:     value,
		Data:      calldata,
	})

	signedTransaction, signedTransactionErr := types.SignTx(rawTransaction, types.NewLondonSigner(chainID), key.PrivateKey)
	if signedTransactionErr != nil {
		return nil, signedTransactionErr
	}

	sendTransactionErr := client.SendTransaction(context.Background(), signedTransaction)
	if sendTransactionErr != nil {
		return nil, sendTransactionErr
	}
	return signedTransaction, nil
}
