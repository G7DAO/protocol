package bridge

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

var NODE_INTERFACE_ADDRESS = common.HexToAddress("0x00000000000000000000000000000000000000C8")

// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/ha/teleporter-custom-fee-2/src/lib/assetBridger/l1l3Bridger.ts#L390
var L2_FORWARDER_FACTORY_DEFAULT_GAS_LIMIT = uint64(1_000_000)
var ONE_ETHER = big.NewInt(1_000_000_000_000_000_000)
var SLIPPAGE_GAS_LIMIT = uint64(100_000)
