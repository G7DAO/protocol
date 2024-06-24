package bridge

import (
	"context"
	"math/big"
	"strings"

	"github.com/G7DAO/protocol/bindings/ArbitrumL1OrbitCustomGateway"
	"github.com/G7DAO/protocol/bindings/ArbitrumL1OrbitGatewayRouter"
	"github.com/G7DAO/protocol/bindings/L2ForwarderFactory"
	"github.com/G7DAO/protocol/bindings/NodeInterface"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

func SetTeleporterGasParams(teleportParams *TeleportParams, teleporterAddress common.Address, l1Client *ethclient.Client, l2Client *ethclient.Client, l3Client *ethclient.Client, key *keystore.Key, teleportationType TeleportationType) (*TeleportParams, error) {
	l1BaseFee, l1BaseFeeErr := l1Client.SuggestGasPrice(context.Background())
	if l1BaseFeeErr != nil {
		return teleportParams, l1BaseFeeErr
	}
	l1BaseFee = PercentIncrease(l1BaseFee, DEFAULT_GAS_PRICE_PERCENT_INCREASE)

	l2BaseFee, l2BaseFeeErr := l2Client.SuggestGasPrice(context.Background())
	if l2BaseFeeErr != nil {
		return teleportParams, l2BaseFeeErr
	}
	l2BaseFee = PercentIncrease(l2BaseFee, DEFAULT_GAS_PRICE_PERCENT_INCREASE)

	l3BaseFee, l3BaseFeeErr := l3Client.SuggestGasPrice(context.Background())
	if l3BaseFeeErr != nil {
		return teleportParams, l3BaseFeeErr
	}
	l3BaseFee = PercentIncrease(l3BaseFee, DEFAULT_GAS_PRICE_PERCENT_INCREASE)

	l2FowarderAddress, l2FowarderAddressErr := GetForwarderAddress(l1Client, teleporterAddress, key, teleportParams.L2l3RouterOrInbox, teleportParams.To)
	if l2FowarderAddressErr != nil {
		return teleportParams, l2FowarderAddressErr
	}

	// 0. Set gas prices of L2 and L3
	teleportParams.GasParams.L2GasPriceBid = l2BaseFee
	teleportParams.GasParams.L3GasPriceBid = l3BaseFee

	// 1. Costs to Bridge token from L1 to L2
	l1l2TokenBridgeGasLimit, l1l2TokenBridgeMaxSubmissionCost, l1l2TokenBridgeErr := GetL1l2TokenBridgeGasParams(l1Client, l2Client, l1BaseFee, key, teleportParams, teleporterAddress, l2FowarderAddress)
	if l1l2TokenBridgeErr != nil {
		return teleportParams, l1l2TokenBridgeErr
	}
	teleportParams.GasParams.L1l2TokenBridgeMaxSubmissionCost = l1l2TokenBridgeMaxSubmissionCost
	teleportParams.GasParams.L1l2TokenBridgeGasLimit = l1l2TokenBridgeGasLimit

	// 2. Costs to Forward call from L2 to L3
	l2ForwarderFactoryGasLimit, l2ForwarderFactoryMaxSubmissionCost, l2ForwarderFactoryMaxSubmissionCostErr := GetL2ForwaderGasParams(l1Client, key, teleportParams, l2FowarderAddress)
	if l2ForwarderFactoryMaxSubmissionCostErr != nil {
		return teleportParams, l2ForwarderFactoryMaxSubmissionCostErr
	}
	teleportParams.GasParams.L2ForwarderFactoryMaxSubmissionCost = l2ForwarderFactoryMaxSubmissionCost
	teleportParams.GasParams.L2ForwarderFactoryGasLimit = l2ForwarderFactoryGasLimit

	// 3. Costs to bridge token from L2 to L3
	l2l3TokenBridgeGasLimit, l2l3TokenBridgeMaxSubmissionCost, l2l3TokenBridgeErr := GetL2L3TokenBridgeGasParams(l2Client, l3Client, l2BaseFee, key, teleportParams, l2FowarderAddress, teleportationType)
	if l2l3TokenBridgeErr != nil {
		return teleportParams, l2l3TokenBridgeErr
	}
	teleportParams.GasParams.L2l3TokenBridgeMaxSubmissionCost = l2l3TokenBridgeMaxSubmissionCost
	teleportParams.GasParams.L2l3TokenBridgeGasLimit = l2l3TokenBridgeGasLimit

	// 4. Costs to Fee token bridge from L1 to L2
	if teleportationType == NonFeeTokenToCustomFee {
		l1l2FeeTokenBridgeGasLimit, l1l2FeeTokenBridgeMaxSubmissionCost, l1l2FeeTokenBridgeErr := GetL1l2FeeTokenBridgeGasParams(l1Client, l2Client, l1BaseFee, key, teleportParams, &teleportParams.L1l2Router, teleporterAddress, l2FowarderAddress)
		if l1l2FeeTokenBridgeErr != nil {
			return teleportParams, l1l2FeeTokenBridgeErr
		}
		teleportParams.GasParams.L1l2FeeTokenBridgeMaxSubmissionCost = l1l2FeeTokenBridgeMaxSubmissionCost
		teleportParams.GasParams.L1l2FeeTokenBridgeGasLimit = l1l2FeeTokenBridgeGasLimit
	} else {
		teleportParams.GasParams.L1l2FeeTokenBridgeMaxSubmissionCost = big.NewInt(0)
		teleportParams.GasParams.L1l2FeeTokenBridgeGasLimit = uint64(0)
	}

	return teleportParams, nil
}

func GetL2ForwaderGasParams(client *ethclient.Client, key *keystore.Key, teleportParams *TeleportParams, l2ForwarderAddress common.Address) (uint64, *big.Int, error) {
	baseFee, baseFeeErr := client.SuggestGasPrice(context.Background())
	if baseFeeErr != nil {
		return uint64(0), nil, baseFeeErr
	}

	l2ForwarderFactoryAbi, l2ForwarderFactoryAbiErr := abi.JSON(strings.NewReader(L2ForwarderFactory.L2ForwarderFactoryABI))
	if l2ForwarderFactoryAbiErr != nil {
		return uint64(0), nil, l2ForwarderFactoryAbiErr
	}

	l2ForwarderParams := L2ForwarderParams{
		Owner:             key.Address,
		L2Token:           teleportParams.L1Token,
		L3FeeTokenL2Addr:  teleportParams.L3FeeTokenL1Addr,
		RouterOrInbox:     teleportParams.L2l3RouterOrInbox,
		To:                teleportParams.To,
		GasLimit:          big.NewInt(0),
		GasPriceBid:       big.NewInt(0),
		MaxSubmissionCost: big.NewInt(0),
		L3CallData:        teleportParams.L3CallData,
	}

	l2ForwarderCalldata, l2ForwarderCalldataErr := l2ForwarderFactoryAbi.Pack("callForwarder", l2ForwarderParams)
	if l2ForwarderCalldataErr != nil {
		return uint64(0), nil, l2ForwarderCalldataErr
	}

	l2ForwarderFactoryMaxSubmissionCost, l2ForwarderFactoryMaxSubmissionCostErr := CalculateRetryableSubmissionFee(l2ForwarderCalldata, baseFee)
	if l2ForwarderFactoryMaxSubmissionCostErr != nil {
		return uint64(0), nil, l2ForwarderFactoryMaxSubmissionCostErr
	}
	l2ForwarderFactoryGasLimit := PercentIncrease(big.NewInt(int64(L2_FORWARDER_FACTORY_DEFAULT_GAS_LIMIT)), DEFAULT_GAS_LIMIT_PERCENT_INCREASE).Uint64()

	return l2ForwarderFactoryGasLimit, l2ForwarderFactoryMaxSubmissionCost, nil
}

func GetL1l2TokenBridgeGasParams(l1Client *ethclient.Client, l2Client *ethclient.Client, l1BaseFee *big.Int, key *keystore.Key, teleportParams *TeleportParams, teleporterAddress common.Address, l2ForwarderAddress common.Address) (uint64, *big.Int, error) {
	router, routerErr := ArbitrumL1OrbitGatewayRouter.NewL1OrbitGatewayRouter(teleportParams.L1l2Router, l1Client)
	if routerErr != nil {
		return uint64(0), nil, routerErr
	}

	gatewayAddress, gatewayAddressErr := router.GetGateway(nil, teleportParams.L1Token)
	if gatewayAddressErr != nil {
		return uint64(0), nil, gatewayAddressErr
	}

	gateway, gatewayErr := ArbitrumL1OrbitCustomGateway.NewL1OrbitCustomGateway(gatewayAddress, l1Client)
	if gatewayErr != nil {
		return uint64(0), nil, gatewayErr
	}

	outboundCalldata, outboundCalldataErr := gateway.GetOutboundCalldata(nil, teleportParams.L1Token, teleporterAddress, l2ForwarderAddress, teleportParams.Amount, []byte{})
	if outboundCalldataErr != nil {
		return uint64(0), nil, outboundCalldataErr
	}

	l1l2TokenBridgeMaxSubmissionCost, l1l2TokenBridgeMaxSubmissionCostErr := CalculateRetryableSubmissionFee(outboundCalldata, l1BaseFee)
	if l1l2TokenBridgeMaxSubmissionCostErr != nil {
		return uint64(0), nil, l1l2TokenBridgeMaxSubmissionCostErr
	}

	// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L154
	senderDeposit := big.NewInt(0).Add(teleportParams.Amount, ONE_ETHER)
	counterpartGatewayAddress, counterpartGatewayAddressErr := gateway.CounterpartGateway(nil)
	if counterpartGatewayAddressErr != nil {
		return uint64(0), nil, counterpartGatewayAddressErr
	}

	l1l2TokenBridgeGasLimit, l1l2TokenBridgeGasLimitErr := CalculateRetryableGasLimit(l2Client, gatewayAddress, senderDeposit, counterpartGatewayAddress, big.NewInt(0), l2ForwarderAddress, RemapL1Address(teleporterAddress), outboundCalldata)
	if l1l2TokenBridgeGasLimitErr != nil {
		return uint64(0), nil, l1l2TokenBridgeGasLimitErr
	}

	return l1l2TokenBridgeGasLimit, l1l2TokenBridgeMaxSubmissionCost, nil
}

func GetL2L3TokenBridgeGasParams(l2Client *ethclient.Client, l3Client *ethclient.Client, l2BaseFee *big.Int, key *keystore.Key, teleportParams *TeleportParams, l2ForwarderAddress common.Address, teleportationType TeleportationType) (uint64, *big.Int, error) {
	outboundCalldata := teleportParams.L3CallData
	var outboundCalldataErr error

	if teleportationType == NonFeeTokenToCustomFee {
		router, routerErr := ArbitrumL1OrbitGatewayRouter.NewL1OrbitGatewayRouter(teleportParams.L1l2Router, l2Client)
		if routerErr != nil {
			return uint64(0), nil, routerErr
		}

		gatewayAddress, gatewayAddressErr := router.GetGateway(nil, teleportParams.L1Token)
		if gatewayAddressErr != nil {
			return uint64(0), nil, gatewayAddressErr
		}

		gateway, gatewayErr := ArbitrumL1OrbitCustomGateway.NewL1OrbitCustomGateway(gatewayAddress, l2Client)
		if gatewayErr != nil {
			return uint64(0), nil, gatewayErr
		}

		outboundCalldata, outboundCalldataErr = gateway.GetOutboundCalldata(nil, teleportParams.L1Token, teleportParams.To, l2ForwarderAddress, teleportParams.Amount, teleportParams.L3CallData)
		if outboundCalldataErr != nil {
			return uint64(0), nil, outboundCalldataErr
		}
	}

	l2l3TokenBridgeMaxSubmissionCost, l2l3TokenBridgeMaxSubmissionCostErr := CalculateRetryableSubmissionFee(outboundCalldata, l2BaseFee)
	if l2l3TokenBridgeMaxSubmissionCostErr != nil {
		return uint64(0), nil, l2l3TokenBridgeMaxSubmissionCostErr
	}

	// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L154-L155
	senderDeposit := big.NewInt(0).Add(teleportParams.Amount, ONE_ETHER)

	l2l3TokenBridgeGasLimit, l2l3TokenBridgeGasLimitErr := CalculateRetryableGasLimit(l3Client, l2ForwarderAddress, senderDeposit, teleportParams.To, teleportParams.Amount, teleportParams.To, teleportParams.To, teleportParams.L3CallData)
	if l2l3TokenBridgeGasLimitErr != nil {
		return uint64(0), nil, l2l3TokenBridgeGasLimitErr
	}

	return l2l3TokenBridgeGasLimit, l2l3TokenBridgeMaxSubmissionCost, nil
}

func GetL1l2FeeTokenBridgeGasParams(l1Client *ethclient.Client, l2Client *ethclient.Client, l1BaseFee *big.Int, key *keystore.Key, teleportParams *TeleportParams, l1l2RouterAddress *common.Address, teleporterAddress common.Address, l2ForwarderAddress common.Address) (uint64, *big.Int, error) {
	router, routerErr := ArbitrumL1OrbitGatewayRouter.NewL1OrbitGatewayRouter(teleportParams.L1l2Router, l1Client)
	if routerErr != nil {
		return uint64(0), nil, routerErr
	}

	gatewayAddress, gatewayAddressErr := router.GetGateway(nil, teleportParams.L1Token)
	if gatewayAddressErr != nil {
		return uint64(0), nil, gatewayAddressErr
	}

	gateway, gatewayErr := ArbitrumL1OrbitCustomGateway.NewL1OrbitCustomGateway(gatewayAddress, l1Client)
	if gatewayErr != nil {
		return uint64(0), nil, gatewayErr
	}

	feeAmount := big.NewInt(0).Mul(big.NewInt(int64(teleportParams.GasParams.L2l3TokenBridgeGasLimit)), teleportParams.GasParams.L3GasPriceBid)
	outboundCalldata, outboundCalldataErr := gateway.GetOutboundCalldata(nil, teleportParams.L3FeeTokenL1Addr, teleporterAddress, l2ForwarderAddress, feeAmount, []byte{})
	if outboundCalldataErr != nil {
		return uint64(0), nil, outboundCalldataErr
	}

	l1l2FeeTokenBridgeMaxSubmissionCost, l1l2FeeTokenBridgeMaxSubmissionCostErr := CalculateRetryableSubmissionFee(outboundCalldata, l1BaseFee)
	if l1l2FeeTokenBridgeMaxSubmissionCostErr != nil {
		return uint64(0), nil, l1l2FeeTokenBridgeMaxSubmissionCostErr
	}

	// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L154
	senderDeposit := big.NewInt(0).Add(teleportParams.Amount, ONE_ETHER)
	counterpartGatewayAddress := RemapL1Address(gatewayAddress)

	l1l2FeeTokenBridgeGasLimit, l1l2FeeTokenBridgeGasLimitErr := CalculateRetryableGasLimit(l2Client, gatewayAddress, senderDeposit, counterpartGatewayAddress, big.NewInt(0), counterpartGatewayAddress, RemapL1Address(key.Address), outboundCalldata)
	if l1l2FeeTokenBridgeGasLimitErr != nil {
		return uint64(0), nil, l1l2FeeTokenBridgeGasLimitErr
	}

	return l1l2FeeTokenBridgeGasLimit, l1l2FeeTokenBridgeMaxSubmissionCost, nil
}

// Source: https://github.com/OffchainLabs/nitro-contracts/blob/main/src/node-interface/NodeInterface.sol#L25
func CalculateRetryableGasLimit(client *ethclient.Client, sender common.Address, deposit *big.Int, to common.Address, l2CallValue *big.Int, excessFeeRefundAddress common.Address, callValueRefundAddress common.Address, calldata []byte) (uint64, error) {
	nodeInterfaceAbi, nodeInterfaceAbiErr := abi.JSON(strings.NewReader(NodeInterface.NodeInterfaceABI))
	if nodeInterfaceAbiErr != nil {
		return uint64(0), nodeInterfaceAbiErr
	}

	// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L154
	senderDeposit := big.NewInt(0).Add(l2CallValue, ONE_ETHER)

	retryableTicketCalldata, retryableTicketCalldataErr := nodeInterfaceAbi.Pack("estimateRetryableTicket", sender, senderDeposit, to, l2CallValue, excessFeeRefundAddress, callValueRefundAddress, calldata)
	if retryableTicketCalldataErr != nil {
		return uint64(0), retryableTicketCalldataErr
	}

	retryableTicketCallMsg := ethereum.CallMsg{
		From:  sender,
		To:    &NODE_INTERFACE_ADDRESS,
		Value: nil,
		Data:  retryableTicketCalldata,
	}

	retryableTicketGasLimit, retryableTicketGasLimitErr := client.EstimateGas(context.Background(), retryableTicketCallMsg)
	if retryableTicketGasLimitErr != nil {
		return uint64(0), retryableTicketGasLimitErr
	}

	retryableTicketGasLimit = PercentIncrease(big.NewInt(int64(retryableTicketGasLimit)), DEFAULT_GAS_LIMIT_PERCENT_INCREASE).Uint64()

	return retryableTicketGasLimit, nil
}
