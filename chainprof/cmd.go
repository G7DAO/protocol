package chainprof

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"
)

func CreateEvaluateCommand() *cobra.Command {
	var accountsDir, calldataRaw, outfile, rpc, toRaw, valueRaw, password string
	var transactionsPerAccount uint

	var value *big.Int
	var to common.Address
	var calldata []byte

	var hexDecodeCalldataErr error

	evaluateCmd := &cobra.Command{
		Use:   "evaluate",
		Short: "Run an evaluation",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if calldataRaw != "" {
				calldata, hexDecodeCalldataErr = hex.DecodeString(calldataRaw)
				if hexDecodeCalldataErr != nil {
					return hexDecodeCalldataErr
				}
			}

			if !common.IsHexAddress(toRaw) {
				return fmt.Errorf("invalid \"to\" address: %s", toRaw)
			}
			to = common.HexToAddress(toRaw)

			value = new(big.Int)
			if valueRaw != "" {
				_, ok := value.SetString(valueRaw, 10)
				if !ok {
					return fmt.Errorf("invalid value: %s", valueRaw)
				}
			} else {
				fmt.Println("No value provided, defaulting to 0")
				value.SetInt64(0)
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			startTime := time.Now()
			transactions, accounts, err := EvaluateAccount(rpc, accountsDir, password, calldata, to.String(), value, transactionsPerAccount)
			if err != nil {
				return err
			}
			endTime := time.Now()

			fmt.Printf("Processing results...\n")
			chainPerfomance, chainPerfomanceErr := GetPerformanceFromTransactionResults(transactions, rpc, accounts, calldata, to, value, transactionsPerAccount, startTime, endTime)
			if chainPerfomanceErr != nil {
				return chainPerfomanceErr
			}

			resultBytes, marshalErr := json.Marshal(chainPerfomance)
			if marshalErr != nil {
				return marshalErr
			}

			if outfile != "" {
				writeErr := os.WriteFile(outfile, resultBytes, 0644)
				if writeErr != nil {
					return writeErr
				}
			}

			fmt.Println("Done!")

			return nil
		},
	}

	evaluateCmd.Flags().StringVar(&accountsDir, "accounts-dir", "", "Directory containing accounts to use when profiling the chain")
	evaluateCmd.Flags().StringVar(&password, "password", "", "Password for accounts")
	evaluateCmd.Flags().StringVar(&calldataRaw, "calldata", "", "Calldata for profiling transactions")
	evaluateCmd.Flags().StringVar(&outfile, "outfile", "", "File to write profile to")
	evaluateCmd.Flags().StringVar(&rpc, "rpc", "", "RPC endpoint for the chain being profiled")
	evaluateCmd.Flags().StringVar(&toRaw, "to", "", "Address to send profiling transactions to")
	evaluateCmd.Flags().StringVar(&valueRaw, "value", "", "Value to send with profiling transactions (default: 0)")
	evaluateCmd.Flags().UintVar(&transactionsPerAccount, "transactions-per-account", 1, "Number of profiling transactions to send per account")

	return evaluateCmd
}

func CreateAccountsCommand() *cobra.Command {
	accountsCmd := &cobra.Command{
		Use:   "accounts",
		Short: "Create, fund, or drain profiling accounts",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	createCmd := CreateAccountsCreateCommand()
	fundCmd := CreateAccountsFundCommand()
	fundERC20Cmd := CreateAccountsFundERC20Command()
	drainCmd := CreateAccountsDrainCommand()
	drainERC20Cmd := CreateAccountsDrainERC20Command()
	accountsCmd.AddCommand(createCmd, fundCmd, fundERC20Cmd, drainCmd, drainERC20Cmd)

	return accountsCmd
}

func CreateAccountsCreateCommand() *cobra.Command {
	var accountsDir, password string
	var numAccounts int

	createCmd := &cobra.Command{
		Use:   "create",
		Short: "Create profiling accounts",
		Long: `Create profiling accounts.

WARNING: This is a *very* insecure method to generate accounts. It is using insecure ScryptN and ScryptP parameters! It should NOT be used for ANYTHING even remotely important.`,
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			return CreateAccounts(accountsDir, numAccounts, password)
		},
	}

	createCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory to create accounts in")
	createCmd.Flags().StringVarP(&password, "password", "p", "", "Password to encrypt accounts with")
	createCmd.Flags().IntVarP(&numAccounts, "num-accounts", "n", 1, "Number of accounts to create")

	return createCmd
}

func CreateAccountsFundERC20Command() *cobra.Command {
	var accountsDir, keyfile, password, tokenAddress, valueRaw, rpc string
	var amountToFund *big.Int

	fundCmd := &cobra.Command{
		Use:   "fund-erc20",
		Short: "Fund profiling accounts with ERC20 tokens",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			if keyfile == "" {
				return errors.New("--keyfile is required")
			}
			if tokenAddress == "" {
				return errors.New("--token-address is required")
			}

			amountToFund = new(big.Int)
			if valueRaw != "" {
				_, ok := amountToFund.SetString(valueRaw, 10)
				if !ok {
					return fmt.Errorf("invalid value: %s", valueRaw)
				}
			} else {
				amountToFund.SetInt64(0)
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			results, err := FundAccountsERC20(rpc, accountsDir, keyfile, password, tokenAddress, amountToFund)
			if err != nil {
				return err
			}

			output, marshalErr := json.Marshal(results)

			if marshalErr != nil {
				return marshalErr
			}

			cmd.Println(string(output))

			return nil
		},
	}

	fundCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory containing accounts to fund")
	fundCmd.Flags().StringVarP(&keyfile, "keyfile", "k", "", "Keyfile to use for funding")
	fundCmd.Flags().StringVarP(&password, "password", "p", "", "Password for keyfile")
	fundCmd.Flags().StringVarP(&tokenAddress, "token-address", "t", "", "Address of the ERC20 token to use for funding")
	fundCmd.Flags().StringVarP(&valueRaw, "value", "v", "", "Value to fund accounts with")
	fundCmd.Flags().StringVarP(&rpc, "rpc", "r", "", "RPC endpoint to use for funding")

	return fundCmd
}

func CreateAccountsFundCommand() *cobra.Command {
	var accountsDir, keyfile, password, valueRaw, rpc string
	var amountToFund *big.Int

	fundCmd := &cobra.Command{
		Use:   "fund",
		Short: "Fund profiling accounts",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			if keyfile == "" {
				return errors.New("--keyfile is required")
			}

			amountToFund = new(big.Int)
			if valueRaw != "" {
				_, ok := amountToFund.SetString(valueRaw, 10)
				if !ok {
					return fmt.Errorf("invalid value: %s", valueRaw)
				}
			} else {
				amountToFund.SetInt64(0)
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			results, err := FundAccounts(rpc, accountsDir, keyfile, password, amountToFund)
			if err != nil {
				return err
			}

			output, marshalErr := json.Marshal(results)

			if marshalErr != nil {
				return marshalErr
			}

			cmd.Println(string(output))

			return nil
		},
	}

	fundCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory containing accounts to fund")
	fundCmd.Flags().StringVarP(&keyfile, "keyfile", "k", "", "Keyfile to use for funding")
	fundCmd.Flags().StringVarP(&password, "password", "p", "", "Password for keyfile")
	fundCmd.Flags().StringVarP(&valueRaw, "value", "v", "", "Value to fund accounts with")
	fundCmd.Flags().StringVarP(&rpc, "rpc", "r", "", "RPC endpoint to use for funding")

	return fundCmd
}

func CreateAccountsDrainCommand() *cobra.Command {
	var accountsDir, sendTo, password, rpc string

	drainCmd := &cobra.Command{
		Use:   "drain",
		Short: "Drain profiling accounts",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			if sendTo == "" {
				return errors.New("--send-to is required")
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			results, err := DrainAccounts(rpc, accountsDir, sendTo, password)
			if err != nil {
				return err
			}

			output, marshalErr := json.Marshal(results)

			if marshalErr != nil {
				return marshalErr
			}

			cmd.Println(string(output))

			return nil
		},
	}

	drainCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory containing accounts to drain")
	drainCmd.Flags().StringVarP(&sendTo, "send-to", "t", "", "Address to send funds to")
	drainCmd.Flags().StringVarP(&password, "password", "p", "", "Password for keyfile")
	drainCmd.Flags().StringVarP(&rpc, "rpc", "r", "", "RPC endpoint to use for funding")

	return drainCmd
}

func CreateAccountsDrainERC20Command() *cobra.Command {
	var accountsDir, sendTo, password, rpc, tokenAddress string

	drainCmd := &cobra.Command{
		Use:   "drain-erc20",
		Short: "Drain profiling accounts",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			if sendTo == "" {
				return errors.New("--send-to is required")
			}
			if tokenAddress == "" {
				return errors.New("--token-address is required")
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			results, err := DrainAccountsERC20(rpc, accountsDir, sendTo, password, tokenAddress)
			if err != nil {
				return err
			}

			output, marshalErr := json.Marshal(results)

			if marshalErr != nil {
				return marshalErr
			}

			cmd.Println(string(output))

			return nil
		},
	}

	drainCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory containing accounts to drain")
	drainCmd.Flags().StringVarP(&sendTo, "send-to", "t", "", "Address to send funds to")
	drainCmd.Flags().StringVarP(&password, "password", "p", "", "Password for keyfile")
	drainCmd.Flags().StringVarP(&rpc, "rpc", "r", "", "RPC endpoint to use for funding")
	drainCmd.Flags().StringVarP(&tokenAddress, "token-address", "a", "", "Address of the ERC20 token to drain")

	return drainCmd
}
