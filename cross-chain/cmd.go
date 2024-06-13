package chainprof

import (
	"errors"
	"fmt"
	"math/big"

	"github.com/spf13/cobra"
)

func CreateCrossChainCommand() *cobra.Command {
	crossChainCmd := &cobra.Command{
		Use:   "cross-chain",
		Short: "Cross-chain messaging commands",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	crossChainSendTxL2ToL3Cmd := CreateCrossChainSendTxL2ToL3Command()
	crossChainEstimateGasCmd := CreateCrossChainEstimateGasCommand()

	crossChainCmd.AddCommand(crossChainSendTxL2ToL3Cmd)
	crossChainCmd.AddCommand(crossChainEstimateGasCmd)

	return crossChainCmd
}

func CreateCrossChainSendTxL2ToL3Command() *cobra.Command {
	var accountsDir, password string
	var numAccounts int

	createCmd := &cobra.Command{
		Use:   "send-tx-l2-to-l3",
		Short: "Send a transaction from L2 to L3",
		Long:  `Send a transaction from L2 to L3. This command will send a transaction from the specified account to the specified address on L3. The account must be funded with the necessary gas to send the transaction.`,

		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			return nil
		},
	}

	createCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory to create accounts in")
	createCmd.Flags().StringVarP(&password, "password", "p", "", "Password to encrypt accounts with")
	createCmd.Flags().IntVarP(&numAccounts, "num-accounts", "n", 1, "Number of accounts to create")

	return createCmd
}

func CreateCrossChainEstimateGasCommand() *cobra.Command {
	var accountsDir, keyfile, password, tokenAddress, valueRaw, rpc string
	var amountToFund *big.Int

	fundCmd := &cobra.Command{
		Use:   "estimate-gas",
		Short: "Estimate gas for funding accounts",
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
