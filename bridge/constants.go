package bridge

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

var NODE_INTERFACE_ADDRESS = common.HexToAddress("0x00000000000000000000000000000000000000C8")

// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/ha/teleporter-custom-fee-2/src/lib/assetBridger/l1l3Bridger.ts#L390
var L2_FORWARDER_FACTORY_DEFAULT_GAS_LIMIT = uint64(1_000_000)

// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L154
var ONE_ETHER = big.NewInt(1_000_000_000_000_000_000)

// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/assetBridger/l1l3Bridger.ts#L282
var DEFAULT_GAS_PRICE_PERCENT_INCREASE = big.NewInt(500)

// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/assetBridger/l1l3Bridger.ts#L284
var DEFAULT_GAS_LIMIT_PERCENT_INCREASE = big.NewInt(100)

// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L27
var DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = big.NewInt(300)
