package bridge

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"strings"

	"github.com/G7DAO/protocol/bindings/ERC20Inbox"
	"github.com/G7DAO/protocol/bindings/L1GatewayRouter"
	"github.com/G7DAO/protocol/bindings/NodeInterface"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

func NativeTokenBridge(inboxAddress common.Address, keyFile string, password string, l1Rpc string, l2Rpc string, to common.Address, l2CallValue *big.Int, l2Calldata []byte) (*types.Transaction, error) {
	key, keyErr := NodeInterface.KeyFromFile(keyFile, password)
	if keyErr != nil {
		return nil, keyErr
	}

	l1Client, l1ClientErr := ethclient.DialContext(context.Background(), l1Rpc)
	if l1ClientErr != nil {
		return nil, l1ClientErr
	}

	l1BaseFee, l1BaseFeeErr := l1Client.SuggestGasPrice(context.Background())
	if l1BaseFeeErr != nil {
		return nil, l1BaseFeeErr
	}

	l2Client, l2ClientErr := ethclient.DialContext(context.Background(), l2Rpc)
	if l2ClientErr != nil {
		return nil, l2ClientErr
	}

	l2BaseFee, l2BaseFeeErr := l2Client.SuggestGasPrice(context.Background())
	if l2BaseFeeErr != nil {
		return nil, l2BaseFeeErr
	}

	senderDeposit := big.NewInt(0).Add(l2CallValue, ONE_ETHER)
	gasLimit, gasLimitErr := CalculateRetryableGasLimit(l2Client, key.Address, senderDeposit, to, l2CallValue, key.Address, key.Address, l2Calldata)
	if gasLimitErr != nil {
		return nil, gasLimitErr
	}

	maxSubmissionCost, maxSubmissionCostErr := CalculateRetryableSubmissionFee(l2Calldata, l1BaseFee)
	if maxSubmissionCostErr != nil {
		return nil, maxSubmissionCostErr
	}

	inboxAbi, inboxAbiErr := abi.JSON(strings.NewReader(ERC20Inbox.ERC20InboxABI))
	if inboxAbiErr != nil {
		return nil, inboxAbiErr
	}

	parsedGasLimit := big.NewInt(0).SetUint64(gasLimit)
	executionCost := big.NewInt(0).Mul(parsedGasLimit, l2BaseFee)
	tokenTotalFeeAmount := big.NewInt(0).Add(maxSubmissionCost, executionCost)
	tokenTotalFeeAmount.Add(tokenTotalFeeAmount, l2CallValue)
	tokenTotalFeeAmount = PercentIncrease(tokenTotalFeeAmount, DEFAULT_GAS_PRICE_PERCENT_INCREASE)

	// function createRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, uint256 tokenTotalFeeAmount, bytes calldata data) external;
	createRetryableTicketData, createRetryableTicketDataErr := inboxAbi.Pack("createRetryableTicket", to, l2CallValue, maxSubmissionCost, key.Address, key.Address, parsedGasLimit, l2BaseFee, tokenTotalFeeAmount, l2Calldata)
	if createRetryableTicketDataErr != nil {
		fmt.Fprintln(os.Stderr, createRetryableTicketDataErr.Error())
		return nil, createRetryableTicketDataErr
	}
	fmt.Println("Sending transaction...")
	transaction, transactionErr := SendTransaction(l1Client, key, password, createRetryableTicketData, inboxAddress.Hex(), big.NewInt(0))
	if transactionErr != nil {
		fmt.Fprintln(os.Stderr, transactionErr.Error())
		return nil, transactionErr
	}
	fmt.Println("Transaction sent! Transaction hash:", transaction.Hash().Hex())

	fmt.Println("Waiting for transaction to be mined...")
	_, receiptErr := bind.WaitMined(context.Background(), l1Client, transaction)
	if receiptErr != nil {
		fmt.Fprintln(os.Stderr, receiptErr.Error())
		return nil, receiptErr
	}
	fmt.Println("Transaction mined!")

	return transaction, nil
}

func GetERC20BridgeCalldataAndValue(routerAddress common.Address, keyFile string, password string, l1Rpc string, tokenAddress common.Address, to common.Address, amount *big.Int) ([]byte, *big.Int, error) {
	key, keyErr := NodeInterface.KeyFromFile(keyFile, password)
	if keyErr != nil {
		fmt.Fprintln(os.Stderr, "keyErr", keyErr.Error())
		return nil, nil, keyErr
	}

	l1Client, l1ClientErr := ethclient.DialContext(context.Background(), l1Rpc)
	if l1ClientErr != nil {
		fmt.Fprintln(os.Stderr, "l1ClientErr", l1ClientErr.Error())
		return nil, nil, l1ClientErr
	}

	gasPriceBid, gasPriceBidErr := l1Client.SuggestGasPrice(context.Background())
	if gasPriceBidErr != nil {
		fmt.Fprintln(os.Stderr, "gasPriceBidErr", gasPriceBidErr.Error())
		return nil, nil, gasPriceBidErr
	}

	gasLimit, gasLimitErr := CalculateRetryableGasLimit(l1Client, key.Address, big.NewInt(0), to, big.NewInt(0), key.Address, key.Address, []byte{})
	if gasLimitErr != nil {
		fmt.Fprintln(os.Stderr, "gasLimitErr", gasLimitErr.Error())
		return nil, nil, gasLimitErr
	}
	maxGas := big.NewInt(0).SetUint64(gasLimit)

	router, routerErr := L1GatewayRouter.NewL1GatewayRouter(routerAddress, l1Client)
	if routerErr != nil {
		fmt.Fprintln(os.Stderr, "routerErr", routerErr.Error())
		return nil, nil, routerErr
	}

	outboundCalldata, outboundCalldataErr := router.GetOutboundCalldata(nil, tokenAddress, key.Address, to, amount, []byte{})
	if outboundCalldataErr != nil {
		fmt.Fprintln(os.Stderr, "outboundCalldataErr", outboundCalldataErr.Error())
		return nil, nil, outboundCalldataErr
	}

	maxSubmissionCost, maxSubmissionCostErr := CalculateRetryableSubmissionFee(outboundCalldata, gasPriceBid)
	if maxSubmissionCostErr != nil {
		fmt.Fprintln(os.Stderr, "maxSubmissionCostErr", maxSubmissionCostErr.Error())
		return nil, nil, maxSubmissionCostErr
	}

	executionCost := big.NewInt(0).Mul(maxGas, gasPriceBid)
	tokenTotalFeeAmount := big.NewInt(0).Add(maxSubmissionCost, executionCost)
	tokenTotalFeeAmount.Add(tokenTotalFeeAmount, big.NewInt(0))

	// Encode (uint256 maxSubmissionCost, bytes callHookData, uint256 tokenTotalFeeAmount)
	arguments := abi.Arguments{
		{Type: abi.Type{T: abi.UintTy, Size: 256}},
		{Type: abi.Type{T: abi.BytesTy}},
		{Type: abi.Type{T: abi.UintTy, Size: 256}},
	}
	data, dataErr := arguments.Pack(maxSubmissionCost, []byte{}, tokenTotalFeeAmount)
	if dataErr != nil {
		fmt.Fprintln(os.Stderr, "dataErr", dataErr.Error())
		return nil, nil, dataErr
	}

	routerAbi, routerAbiErr := abi.JSON(strings.NewReader(L1GatewayRouter.L1GatewayRouterABI))
	if routerAbiErr != nil {
		fmt.Fprintln(os.Stderr, "routerAbiErr", routerAbiErr.Error())
		return nil, nil, routerAbiErr
	}

	callData, callDataErr := routerAbi.Pack("outboundTransfer", tokenAddress, to, amount, maxGas, gasPriceBid, data)
	if callDataErr != nil {
		fmt.Fprintln(os.Stderr, "callDataErr", callDataErr.Error())
		return nil, nil, callDataErr
	}

	return callData, tokenTotalFeeAmount, nil
}

func ERC20BridgeCall(routerAddress common.Address, keyFile string, password string, l1Rpc string, tokenAddress common.Address, to common.Address, amount *big.Int) (*types.Transaction, error) {
	callData, tokenTotalFeeAmount, callDataErr := GetERC20BridgeCalldataAndValue(routerAddress, keyFile, password, l1Rpc, tokenAddress, to, amount)
	if callDataErr != nil {
		fmt.Fprintln(os.Stderr, "callDataErr", callDataErr.Error())
		return nil, callDataErr
	}

	l1Client, l1ClientErr := ethclient.DialContext(context.Background(), l1Rpc)
	if l1ClientErr != nil {
		fmt.Fprintln(os.Stderr, "l1ClientErr", l1ClientErr.Error())
		return nil, l1ClientErr
	}

	key, keyErr := NodeInterface.KeyFromFile(keyFile, password)
	if keyErr != nil {
		fmt.Fprintln(os.Stderr, "keyErr", keyErr.Error())
		return nil, keyErr
	}

	fmt.Println("Sending transaction...")
	transaction, transactionErr := SendTransaction(l1Client, key, password, callData, routerAddress.Hex(), tokenTotalFeeAmount)
	if transactionErr != nil {
		fmt.Fprintln(os.Stderr, "transactionErr", transactionErr.Error())
		return nil, transactionErr
	}
	fmt.Println("Transaction sent! Transaction hash:", transaction.Hash().Hex())

	fmt.Println("Waiting for transaction to be mined...")
	_, receiptErr := bind.WaitMined(context.Background(), l1Client, transaction)
	if receiptErr != nil {
		fmt.Fprintln(os.Stderr, "receiptErr", receiptErr.Error())
		return nil, receiptErr
	}
	fmt.Println("Transaction mined!")

	return transaction, nil
}

func ERC20BridgePropose(routerAddress common.Address, keyFile string, password string, l1Rpc string, tokenAddress common.Address, to common.Address, amount *big.Int, safeAddress common.Address, safeApi string, safeOperation uint8) error {
	callData, tokenTotalFeeAmount, callDataErr := GetERC20BridgeCalldataAndValue(routerAddress, keyFile, password, l1Rpc, tokenAddress, to, amount)
	if callDataErr != nil {
		fmt.Fprintln(os.Stderr, "callDataErr", callDataErr.Error())
		return callDataErr
	}

	l1Client, l1ClientErr := ethclient.DialContext(context.Background(), l1Rpc)
	if l1ClientErr != nil {
		fmt.Fprintln(os.Stderr, "l1ClientErr", l1ClientErr.Error())
		return l1ClientErr
	}

	key, keyErr := NodeInterface.KeyFromFile(keyFile, password)
	if keyErr != nil {
		fmt.Fprintln(os.Stderr, "keyErr", keyErr.Error())
		return keyErr
	}

	return CreateSafeProposal(l1Client, key, safeAddress, routerAddress, callData, tokenTotalFeeAmount, safeApi, OperationType(safeOperation))
}
