package bridge

import (
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"
)

func CreateBridgeCommand() *cobra.Command {
	crossChainCmd := &cobra.Command{
		Use:   "bridge",
		Short: "Bridge tokens between chains",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	bridgeL2ToL3Cmd := CreateBridgeL2ToL3Command()
	bridgeL1ToL3Cmd := CreateBridgeL1ToL3Command()

	crossChainCmd.AddCommand(bridgeL2ToL3Cmd)
	crossChainCmd.AddCommand(bridgeL1ToL3Cmd)

	return crossChainCmd
}

func CreateBridgeL2ToL3Command() *cobra.Command {
	var accountsDir, password string
	var numAccounts int

	createCmd := &cobra.Command{
		Use:   "l2-to-l3",
		Short: "Bridge tokens from L2 to L3",
		Long:  `Bridge tokens from L2 to L3 with a single transaction and arbitrary calldata`,

		PreRunE: func(cmd *cobra.Command, args []string) error {
			if accountsDir == "" {
				return errors.New("--accounts-dir is required")
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			// TODO: Implement this later
			return errors.New("not implemented")
		},
	}

	createCmd.Flags().StringVarP(&accountsDir, "accounts-dir", "d", "", "Directory to create accounts in")
	createCmd.Flags().StringVarP(&password, "password", "p", "", "Password to encrypt accounts with")
	createCmd.Flags().IntVarP(&numAccounts, "num-accounts", "n", 1, "Number of accounts to create")

	return createCmd
}

func CreateBridgeL1ToL3Command() *cobra.Command {
	var keyFile, password, l1TokenRaw, l3FeeTokenL1AddrRaw, l1l2RouterRaw, l2l3RouterOrInboxRaw, toRaw, amountRaw, l3CalldataRaw, l1Rpc, l2Rpc, l3Rpc, teleporterAddressRaw string
	teleportParams := &TeleportParams{}
	var teleporterAddress common.Address

	var l3CallDataErr error

	createCmd := &cobra.Command{
		Use:   "l1-to-l3",
		Short: "Bridge tokens from L1 to L3",
		Long:  `Bridge tokens from L1 to L3 with a single transaction and arbitrary calldata`,

		PreRunE: func(cmd *cobra.Command, args []string) error {
			if l3CalldataRaw != "" {
				teleportParams.L3CallData, l3CallDataErr = hex.DecodeString(l3CalldataRaw)
				if l3CallDataErr != nil {
					return l3CallDataErr
				}
			}

			if !common.IsHexAddress(toRaw) {
				return fmt.Errorf("invalid \"to\" address: %s", toRaw)
			}
			teleportParams.To = common.HexToAddress(toRaw)

			if !common.IsHexAddress(l1TokenRaw) {
				return fmt.Errorf("invalid \"l1-token\" address: %s", l1TokenRaw)
			}
			teleportParams.L1Token = common.HexToAddress(l1TokenRaw)

			if !common.IsHexAddress(l3FeeTokenL1AddrRaw) {
				return fmt.Errorf("invalid \"l3-fee-token-l1-addr\" address: %s", l3FeeTokenL1AddrRaw)
			}
			teleportParams.L3FeeTokenL1Addr = common.HexToAddress(l3FeeTokenL1AddrRaw)

			if !common.IsHexAddress(l1l2RouterRaw) {
				return fmt.Errorf("invalid \"l1l2-router\" address: %s", l1l2RouterRaw)
			}
			teleportParams.L1l2Router = common.HexToAddress(l1l2RouterRaw)

			if !common.IsHexAddress(l2l3RouterOrInboxRaw) {
				return fmt.Errorf("invalid \"l2l3-router-or-inbox\" address: %s", l2l3RouterOrInboxRaw)
			}
			teleportParams.L2l3RouterOrInbox = common.HexToAddress(l2l3RouterOrInboxRaw)

			teleportParams.Amount = new(big.Int)
			if amountRaw != "" {
				_, ok := teleportParams.Amount.SetString(amountRaw, 10)
				if !ok {
					return fmt.Errorf("invalid amount: %s", amountRaw)
				}
			} else {
				fmt.Println("No amount provided, defaulting to 0")
				teleportParams.Amount.SetInt64(0)
			}

			if !common.IsHexAddress(teleporterAddressRaw) {
				return fmt.Errorf("invalid teleporter address: %s", teleporterAddressRaw)
			}
			teleporterAddress = common.HexToAddress(teleporterAddressRaw)

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			transaction, transactionErr := Teleport(teleporterAddress, teleportParams, keyFile, password, l1Rpc, l2Rpc, l3Rpc)
			if transactionErr != nil {
				fmt.Fprintln(cmd.ErrOrStderr(), transactionErr.Error())
				return transactionErr
			}

			fmt.Println("Transaction sent:", transaction.Hash().Hex())

			return nil
		},
	}

	createCmd.Flags().StringVar(&keyFile, "keyfile", "", "Keyfile to sign transaction with")
	createCmd.Flags().StringVar(&password, "password", "", "Password to decrypt keyfile with")
	createCmd.Flags().StringVar(&l1TokenRaw, "l1-token", "", "L1 token address")
	createCmd.Flags().StringVar(&l3FeeTokenL1AddrRaw, "l1l3-fee-token", "", "L3 fee token L1 address")
	createCmd.Flags().StringVar(&l1l2RouterRaw, "l1l2-router", "", "L1L2 router address")
	createCmd.Flags().StringVar(&l2l3RouterOrInboxRaw, "l2l3-router", "", "L2L3 router or inbox address")
	createCmd.Flags().StringVar(&toRaw, "to", "", "Recipient address")
	createCmd.Flags().StringVar(&amountRaw, "amount", "", "Amount to send")
	createCmd.Flags().StringVar(&l3CalldataRaw, "l3-calldata", "", "Calldata to send")
	createCmd.Flags().StringVar(&l1Rpc, "l1-rpc", "", "L1 RPC URL")
	createCmd.Flags().StringVar(&l2Rpc, "l2-rpc", "", "L2 RPC URL")
	createCmd.Flags().StringVar(&l3Rpc, "l3-rpc", "", "L3 RPC URL")
	createCmd.Flags().StringVar(&teleporterAddressRaw, "teleporter", "", "Teleporter contract address")

	return createCmd
}
