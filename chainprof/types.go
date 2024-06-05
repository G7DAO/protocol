package chainprof

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type Account struct {
	Address string `json:"address"`
}

type TransactionResult struct {
	Hash                 string `json:"hash"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
	Nonce                string `json:"nonce"`
	From                 string `json:"from"`
	To                   string `json:"to"`
	Value                string `json:"value"`
	Data                 string `json:"data"`
	CreatedAt            string `json:"createdAt"`
	GasUsed              string `json:"gasUsed"`
	GasPrice             string `json:"gasPrice"`
	BlockNumber          uint64 `json:"blockNumber"`
}

type OptTx struct {
	MaxFeePerGas         *big.Int
	MaxPriorityFeePerGas *big.Int
	Nonce                uint64
}

type ChainPerfomance struct {
	RPC                    string
	Calldata               string
	To                     string
	Value                  string
	TransactionsPerAccount uint
	ExecutionTime          int
	BlockProductionTime    int
	InitialBlockNumber     uint64
	FinalBlockNumber       uint64
	InitialBlockTimestamp  string
	FinalBlockTimestamp    string
	AvgGasUsed             string
	AvgGasPrice            string
	TotalGasUsed           string
	TotalGasPrice          string
	TotalTransactionsSent  int
	Accounts               []common.Address
	Transactions           []TransactionResult
}
