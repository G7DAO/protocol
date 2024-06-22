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
	l2BaseFee, l2BaseFeeErr := l2Client.SuggestGasPrice(context.Background())
	if l2BaseFeeErr != nil {
		return teleportParams, l2BaseFeeErr
	}

	l3BaseFee, l3BaseFeeErr := l3Client.SuggestGasPrice(context.Background())
	if l3BaseFeeErr != nil {
		return teleportParams, l3BaseFeeErr
	}

	l2FowarderAddress, l2FowarderAddressErr := GetForwarderAddress(l1Client, teleporterAddress, key, teleportParams.L2l3RouterOrInbox, teleportParams.To)
	if l2FowarderAddressErr != nil {
		return teleportParams, l2FowarderAddressErr
	}

	// 0. Set gas prices of L2 and L3
	teleportParams.GasParams.L2GasPriceBid = l2BaseFee
	teleportParams.GasParams.L3GasPriceBid = l3BaseFee

	// ======== L1 costs =========
	// 1. Costs to Bridge token from L1 to L2
	l1l2TokenBridgeGasLimit, l1l2TokenBridgeMaxSubmissionCost, l1l2TokenBridgeErr := GetL1l2TokenBridgeGasParams(l1Client, l2Client, key, teleportParams, &teleportParams.L1l2Router, teleporterAddress, l2FowarderAddress)
	if l1l2TokenBridgeErr != nil {
		return teleportParams, l1l2TokenBridgeErr
	}
	teleportParams.GasParams.L1l2TokenBridgeMaxSubmissionCost = l1l2TokenBridgeMaxSubmissionCost
	teleportParams.GasParams.L1l2TokenBridgeGasLimit = l1l2TokenBridgeGasLimit

	// 2. Costs to Fee token bridge from L1 to L2
	if teleportationType == NonFeeTokenToCustomFee {
		l1l2FeeTokenBridgeGasLimit, l1l2FeeTokenBridgeMaxSubmissionCost, l1l2FeeTokenBridgeErr := GetL1l2FeeTokenBridgeGasParams(l1Client, key, teleportParams, &teleportParams.L1l2Router, teleporterAddress, l2FowarderAddress)
		if l1l2FeeTokenBridgeErr != nil {
			return teleportParams, l1l2FeeTokenBridgeErr
		}
		teleportParams.GasParams.L1l2FeeTokenBridgeMaxSubmissionCost = l1l2FeeTokenBridgeMaxSubmissionCost
		teleportParams.GasParams.L1l2FeeTokenBridgeGasLimit = l1l2FeeTokenBridgeGasLimit
	} else {
		teleportParams.GasParams.L1l2FeeTokenBridgeMaxSubmissionCost = big.NewInt(0)
		teleportParams.GasParams.L1l2FeeTokenBridgeGasLimit = uint64(0)
	}

	// ======== L2 costs =========
	// 3. Costs to Forward call from L2 to L3
	l2ForwarderFactoryGasLimit, l2ForwarderFactoryMaxSubmissionCost, l2ForwarderFactoryMaxSubmissionCostErr := GetL2ForwaderGasParams(l1Client, key, teleportParams, l2FowarderAddress)
	if l2ForwarderFactoryMaxSubmissionCostErr != nil {
		return teleportParams, l2ForwarderFactoryMaxSubmissionCostErr
	}
	teleportParams.GasParams.L2ForwarderFactoryMaxSubmissionCost = l2ForwarderFactoryMaxSubmissionCost
	teleportParams.GasParams.L2ForwarderFactoryGasLimit = l2ForwarderFactoryGasLimit

	// 4. Costs to bridge token from L2 to L3
	l2l3TokenBridgeGasLimit, l2l3TokenBridgeMaxSubmissionCost, l2l3TokenBridgeErr := GetL2L3TokenBridgeGasParams(l1Client, key, teleportParams, l2FowarderAddress)
	if l2l3TokenBridgeErr != nil {
		return teleportParams, l2l3TokenBridgeErr
	}
	teleportParams.GasParams.L2l3TokenBridgeMaxSubmissionCost = l2l3TokenBridgeMaxSubmissionCost
	teleportParams.GasParams.L2l3TokenBridgeGasLimit = l2l3TokenBridgeGasLimit

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

	return L2_FORWARDER_FACTORY_DEFAULT_GAS_LIMIT, l2ForwarderFactoryMaxSubmissionCost, nil
}

func GetL1l2TokenBridgeGasParams(l1Client *ethclient.Client, l2Client *ethclient.Client, key *keystore.Key, teleportParams *TeleportParams, l1l2RouterAddress *common.Address, teleporterAddress common.Address, l2ForwarderAddress common.Address) (uint64, *big.Int, error) {
	baseFee, baseFeeErr := l1Client.SuggestGasPrice(context.Background())
	if baseFeeErr != nil {
		return uint64(0), nil, baseFeeErr
	}

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

	l1l2TokenBridgeMaxSubmissionCost, l1l2TokenBridgeMaxSubmissionCostErr := CalculateRetryableSubmissionFee(outboundCalldata, baseFee)
	if l1l2TokenBridgeMaxSubmissionCostErr != nil {
		return uint64(0), nil, l1l2TokenBridgeMaxSubmissionCostErr
	}

	nodeInterfaceAbi, nodeInterfaceAbiErr := abi.JSON(strings.NewReader(NodeInterface.NodeInterfaceABI))
	if nodeInterfaceAbiErr != nil {
		return uint64(0), nil, nodeInterfaceAbiErr
	}

	counterpartGatewayAddress := RemapL1Address(gatewayAddress)
	senderDeposit := big.NewInt(0).Add(teleportParams.Amount, ONE_ETHER)

	retryableTicketCalldata, retryableTicketCalldataErr := nodeInterfaceAbi.Pack("estimateRetryableTicket", gatewayAddress, senderDeposit, counterpartGatewayAddress, big.NewInt(0), counterpartGatewayAddress, RemapL1Address(key.Address), outboundCalldata)
	if retryableTicketCalldataErr != nil {
		return uint64(0), nil, retryableTicketCalldataErr
	}

	retryableTicketCallMsg := ethereum.CallMsg{
		From:  gatewayAddress,
		To:    &NODE_INTERFACE_ADDRESS,
		Value: nil,
		Data:  retryableTicketCalldata,
	}

	retryableTicketGasLimit, retryableTicketGasLimitErr := l2Client.EstimateGas(context.Background(), retryableTicketCallMsg)
	if retryableTicketGasLimitErr != nil {
		return uint64(0), nil, retryableTicketGasLimitErr
	}

	l1l2TokenBridgeGasLimit := retryableTicketGasLimit + SLIPPAGE_GAS_LIMIT

	return l1l2TokenBridgeGasLimit, l1l2TokenBridgeMaxSubmissionCost, nil
}

func GetL2L3TokenBridgeGasParams(client *ethclient.Client, key *keystore.Key, teleportParams *TeleportParams, l2ForwarderAddress common.Address) (uint64, *big.Int, error) {
	baseFee, baseFeeErr := client.SuggestGasPrice(context.Background())
	if baseFeeErr != nil {
		return uint64(0), nil, baseFeeErr
	}

	l2l3TokenBridgeMaxSubmissionCost, l2l3TokenBridgeMaxSubmissionCostErr := CalculateRetryableSubmissionFee(teleportParams.L3CallData, baseFee)
	if l2l3TokenBridgeMaxSubmissionCostErr != nil {
		return uint64(0), nil, l2l3TokenBridgeMaxSubmissionCostErr
	}

	nodeInterfaceAbi, nodeInterfaceAbiErr := abi.JSON(strings.NewReader(NodeInterface.NodeInterfaceABI))
	if nodeInterfaceAbiErr != nil {
		return uint64(0), nil, nodeInterfaceAbiErr
	}
	// Source: https://github.com/OffchainLabs/arbitrum-sdk/blob/0da65020438fc3e46728ea182f1b4dcf04e3cb7f/src/lib/message/L1ToL2MessageGasEstimator.ts#L154-L155
	senderDeposit := big.NewInt(0).Add(teleportParams.Amount, ONE_ETHER)
	retryableTicketCalldata, retryableTicketCalldataErr := nodeInterfaceAbi.Pack("estimateRetryableTicket", l2ForwarderAddress, senderDeposit, teleportParams.To, teleportParams.Amount, teleportParams.To, teleportParams.To, teleportParams.L3CallData)
	if retryableTicketCalldataErr != nil {
		return uint64(0), nil, retryableTicketCalldataErr
	}

	retryableTicketCallMsg := ethereum.CallMsg{
		From:  key.Address,
		To:    &NODE_INTERFACE_ADDRESS,
		Value: nil,
		Data:  retryableTicketCalldata,
	}

	// TODO: Fix l2l3TokenBridgeGasLimit to use it instead of DEFAULT_GAS_LIMIT
	retryableTicketGasLimit, retryableTicketGasLimitErr := client.EstimateGas(context.Background(), retryableTicketCallMsg)
	if retryableTicketGasLimitErr != nil {
		return uint64(0), nil, retryableTicketGasLimitErr
	}

	l2l3TokenBridgeGasLimit := retryableTicketGasLimit + SLIPPAGE_GAS_LIMIT

	return l2l3TokenBridgeGasLimit, l2l3TokenBridgeMaxSubmissionCost, nil
}

// TODO: Not being used when custom fee token on L3 is the same as token to be bridged on L1
func GetL1l2FeeTokenBridgeGasParams(client *ethclient.Client, key *keystore.Key, teleportParams *TeleportParams, l1l2RouterAddress *common.Address, teleporterAddress common.Address, l2ForwarderAddress common.Address) (uint64, *big.Int, error) {
	baseFee, baseFeeErr := client.SuggestGasPrice(context.Background())
	if baseFeeErr != nil {
		return uint64(0), nil, baseFeeErr
	}

	router, routerErr := ArbitrumL1OrbitGatewayRouter.NewL1OrbitGatewayRouter(teleportParams.L1l2Router, client)
	if routerErr != nil {
		return uint64(0), nil, routerErr
	}

	outboundCalldata, outboundCalldataErr := router.GetOutboundCalldata(nil, teleportParams.L3FeeTokenL1Addr, teleporterAddress, l2ForwarderAddress, teleportParams.Amount, nil)
	if outboundCalldataErr != nil {
		return uint64(0), nil, outboundCalldataErr
	}

	l1l2FeeTokenBridgeMaxSubmissionCost, l1l2FeeTokenBridgeMaxSubmissionCostErr := CalculateRetryableSubmissionFee(outboundCalldata, baseFee)
	if l1l2FeeTokenBridgeMaxSubmissionCostErr != nil {
		return uint64(0), nil, l1l2FeeTokenBridgeMaxSubmissionCostErr
	}

	nodeInterfaceAbi, nodeInterfaceAbiErr := abi.JSON(strings.NewReader(NodeInterface.NodeInterfaceABI))
	if nodeInterfaceAbiErr != nil {
		return uint64(0), nil, nodeInterfaceAbiErr
	}

	retryableTicketCalldata, retryableTicketCalldataErr := nodeInterfaceAbi.Pack("estimateRetryableTicket", teleportParams.L1l2Router, big.NewInt(0), teleportParams.L2l3RouterOrInbox, big.NewInt(0), teleportParams.L2l3RouterOrInbox, teleportParams.L1l2Router, []byte{})
	if retryableTicketCalldataErr != nil {
		return uint64(0), nil, retryableTicketCalldataErr
	}

	estimateRetryableTicketCallMsg := ethereum.CallMsg{
		From:  teleportParams.L1l2Router,
		To:    &NODE_INTERFACE_ADDRESS,
		Value: nil,
		Data:  retryableTicketCalldata,
	}

	retryableTicketGasLimit, retryableTicketGasLimitErr := client.EstimateGas(context.Background(), estimateRetryableTicketCallMsg)
	if retryableTicketGasLimitErr != nil {
		return uint64(0), nil, retryableTicketGasLimitErr
	}

	l1l2FeeTokenBridgeGasLimit := retryableTicketGasLimit + SLIPPAGE_GAS_LIMIT

	return l1l2FeeTokenBridgeGasLimit, l1l2FeeTokenBridgeMaxSubmissionCost, nil
}
