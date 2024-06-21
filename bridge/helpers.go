package bridge

import (
	"fmt"
	"math/big"

	"github.com/G7DAO/protocol/bindings/L1Teleporter"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

func GetForwarderAddress(client *ethclient.Client, teleporterAddress common.Address, key *keystore.Key, l2l3RouterOrInbox common.Address, to common.Address) (common.Address, error) {
	teleporter, teleporterErr := L1Teleporter.NewL1Teleporter(teleporterAddress, client)
	if teleporterErr != nil {
		return common.Address{}, teleporterErr
	}

	l2ForwarderAddress, l2ForwarderAddressErr := teleporter.L2ForwarderAddress(
		nil,
		key.Address,
		l2l3RouterOrInbox,
		to,
	)
	if l2ForwarderAddressErr != nil {
		return common.Address{}, l2ForwarderAddressErr
	}

	return l2ForwarderAddress, nil
}

// Source: https://github.com/OffchainLabs/nitro-contracts/blob/main/src/bridge/Inbox.sol#L323
func CalculateRetryableSubmissionFee(calldata []byte, baseFee *big.Int) (*big.Int, error) {
	multiplier := big.NewInt(int64(1400 + 6*len(calldata)))
	submissionFee := multiplier.Mul(multiplier, baseFee)

	return submissionFee, nil
}

func CalculateRequiredEth(gasParams RetryableGasParams, teleportationType TeleportationType) (*big.Int, *big.Int) {
	l1l2FeeTokenBridgeGasCost := big.NewInt(0).Mul(gasParams.L2GasPriceBid, big.NewInt(int64(gasParams.L1l2FeeTokenBridgeGasLimit)))
	l1l2FeeTokenBridgeTotalCost := big.NewInt(0).Add(gasParams.L1l2FeeTokenBridgeMaxSubmissionCost, l1l2FeeTokenBridgeGasCost)

	l1l2TokenBridgeGasCost := big.NewInt(0).Mul(gasParams.L2GasPriceBid, big.NewInt(int64(gasParams.L1l2TokenBridgeGasLimit)))
	l1l2TokenBridgeTotalCost := big.NewInt(0).Add(gasParams.L1l2TokenBridgeMaxSubmissionCost, l1l2TokenBridgeGasCost)

	l2ForwarderFactoryGasCost := big.NewInt(0).Mul(gasParams.L2GasPriceBid, big.NewInt(int64(gasParams.L2ForwarderFactoryGasLimit)))
	l2ForwarderFactoryTotalCost := big.NewInt(0).Add(gasParams.L2ForwarderFactoryMaxSubmissionCost, l2ForwarderFactoryGasCost)

	l2l3TokenBridgeGasCost := big.NewInt(0).Mul(gasParams.L3GasPriceBid, big.NewInt(int64(gasParams.L2l3TokenBridgeGasLimit)))
	l2l3TokenBridgeTotalCost := big.NewInt(0).Add(gasParams.L2l3TokenBridgeMaxSubmissionCost, l2l3TokenBridgeGasCost)

	// all teleportation types require at least these 2 retryables to L2
	requiredEth := big.NewInt(0).Add(l2ForwarderFactoryTotalCost, l1l2TokenBridgeTotalCost)
	requiredFeeToken := big.NewInt(0)

	// in addition to the above ETH amount, more fee token and/or ETH is required depending on the teleportation type
	if teleportationType == Standard {
		// standard type requires 1 retryable to L3 paid for in ETH
		requiredEth.Add(requiredEth, l2l3TokenBridgeTotalCost)
	} else if teleportationType == OnlyCustomFee {
		// only custom fee type requires 1 retryable to L3 paid for in fee token
		requiredFeeToken = l2l3TokenBridgeTotalCost
	} else if l2l3TokenBridgeTotalCost.Cmp(big.NewInt(0)) > 0 {
		// non-fee token to custom fee type requires:
		// 1 retryable to L2 paid for in ETH
		// 1 retryable to L3 paid for in fee token
		requiredEth.Add(requiredEth, l1l2FeeTokenBridgeTotalCost)
		requiredFeeToken = l2l3TokenBridgeTotalCost
	}

	return requiredEth, requiredFeeToken
}

// Source: https://github.com/OffchainLabs/l1-l3-teleport-contracts/blob/820590ff81f85ca482c9d9aec6948c1277248950/contracts/lib/TeleportationType.sol#L13
func GetTeleportationType(token common.Address, feeToken common.Address) (TeleportationType, error) {
	if (token == common.Address{}) {
		return Standard, fmt.Errorf("token address is empty")
	} else if (feeToken == common.Address{}) {
		return Standard, nil
	} else if token == feeToken {
		return OnlyCustomFee, nil
	} else {
		return NonFeeTokenToCustomFee, nil
	}
}
