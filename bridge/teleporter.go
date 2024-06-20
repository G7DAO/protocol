package bridge

import (
	"fmt"
	"os"
	"strings"

	"github.com/G7DAO/protocol/bindings/L1Teleporter"
	"github.com/G7DAO/protocol/bindings/NodeInterface"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

func Teleport(teleporter common.Address, teleportParams *TeleportParams, keyFile string, password string, l1Rpc string, l2Rpc string, l3Rpc string) (*types.Transaction, error) {
	l1Client, l1ClientErr := ethclient.Dial(l1Rpc)
	if l1ClientErr != nil {
		return nil, l1ClientErr
	}

	l2Client, l2ClientErr := ethclient.Dial(l2Rpc)
	if l2ClientErr != nil {
		return nil, l2ClientErr
	}

	l3Client, l3ClientErr := ethclient.Dial(l2Rpc)
	if l3ClientErr != nil {
		return nil, l3ClientErr
	}

	key, keyErr := NodeInterface.KeyFromFile(keyFile, password)
	if keyErr != nil {
		return nil, keyErr
	}

	teleportationType, teleportationTypeErr := GetTeleportationType(teleportParams.L1Token, teleportParams.L3FeeTokenL1Addr)
	if teleportationTypeErr != nil {
		return nil, teleportationTypeErr
	}

	teleportParams, teleportParamsErr := SetTeleporterGasParams(teleportParams, teleporter, l1Client, l2Client, l3Client, key, teleportationType)
	if teleportParamsErr != nil {
		return nil, teleportParamsErr
	}

	requiredEth, requiredFeeToken := CalculateRequiredEth(teleportParams.GasParams, teleportationType)
	if teleportationType == OnlyCustomFee && teleportParams.Amount.Cmp(requiredFeeToken) == -1 {
		fmt.Fprintln(os.Stderr, "Amount is less than required fee token amount")
		return nil, nil
	}

	teleportParams.Amount.Add(teleportParams.Amount, requiredFeeToken)

	teleporterAbi, teleporterAbiErr := abi.JSON(strings.NewReader(L1Teleporter.L1TeleporterABI))
	if teleporterAbiErr != nil {
		return nil, teleporterAbiErr
	}

	data, dataErr := teleporterAbi.Pack("teleport", teleportParams)
	if dataErr != nil {
		fmt.Fprintln(os.Stderr, dataErr.Error())
		return nil, dataErr
	}

	transaction, transactionErr := SendTransaction(l1Client, key, password, data, teleporter.String(), requiredEth)
	if transactionErr != nil {
		fmt.Fprintln(os.Stderr, transactionErr.Error())
		return nil, transactionErr
	}

	return transaction, nil
}
