package bridge

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type TeleportParams struct {
	L1Token           common.Address
	L3FeeTokenL1Addr  common.Address
	L1l2Router        common.Address
	L2l3RouterOrInbox common.Address
	To                common.Address
	Amount            *big.Int
	GasParams         RetryableGasParams
	L3CallData        []byte
}

type RetryableGasParams struct {
	L2GasPriceBid                       *big.Int
	L3GasPriceBid                       *big.Int
	L2ForwarderFactoryGasLimit          uint64
	L1l2FeeTokenBridgeGasLimit          uint64
	L1l2TokenBridgeGasLimit             uint64
	L2l3TokenBridgeGasLimit             uint64
	L2ForwarderFactoryMaxSubmissionCost *big.Int
	L1l2FeeTokenBridgeMaxSubmissionCost *big.Int
	L1l2TokenBridgeMaxSubmissionCost    *big.Int
	L2l3TokenBridgeMaxSubmissionCost    *big.Int
}

type L2ForwarderParams struct {
	Owner             common.Address
	L2Token           common.Address
	L3FeeTokenL2Addr  common.Address
	RouterOrInbox     common.Address
	To                common.Address
	GasLimit          *big.Int
	GasPriceBid       *big.Int
	MaxSubmissionCost *big.Int
	L3CallData        []byte
}

type TeleportationType int

const (
	Standard               TeleportationType = 0 // Teleporting a token to an ETH fee L3
	OnlyCustomFee          TeleportationType = 1 // Teleporting a L3's custom fee token to a custom (non-eth) fee L3
	NonFeeTokenToCustomFee TeleportationType = 2 // Teleporting a non-fee token to a custom (non-eth) fee L3
)
