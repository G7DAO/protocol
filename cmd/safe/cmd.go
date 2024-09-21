package main

import (
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"
)

func CreateRootCommand() *cobra.Command {
	rootCmd := &cobra.Command{
		Use:   "safe",
		Short: "Safe is a command line tool for creating Safe proposals",
	}

	rootCmd.AddCommand(CreateDeploySafeCommand())

	return rootCmd
}

func CreateDeploySafeCommand() *cobra.Command {
	var rpcURL, keyfile, password, safeAddressRaw, valueRaw, txServiceBaseUrl, factoryAddressRaw string
	var safeAddress, factoryAddress common.Address
	var value *big.Int

	cmd := &cobra.Command{
		Use:   "deploy-safe",
		Short: "Deploy a contract through a Gnosis Safe",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if rpcURL == "" {
				return fmt.Errorf("rpc is required")
			}

			if keyfile == "" {
				return fmt.Errorf("keyfile is required")
			}

			// check if safe address is valid
			if !common.IsHexAddress(safeAddressRaw) {
				return fmt.Errorf("safe address is required")
			} else {
				safeAddress = common.HexToAddress(safeAddressRaw)
			}

			if !common.IsHexAddress(factoryAddressRaw) {
				return fmt.Errorf("factory address is required")
			} else {
				factoryAddress = common.HexToAddress(factoryAddressRaw)
			}

			if valueRaw == "" {
				value = big.NewInt(0)
			} else {
				value = new(big.Int)
				_, ok := value.SetString(valueRaw, 10)
				if !ok {
					return fmt.Errorf("invalid value: %s", valueRaw)
				}
			}

			if txServiceBaseUrl == "" {
				return fmt.Errorf("tx service base url is required")
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {

			// Create and submit the Safe proposal
			err := CreateSafeProposal(
				rpcURL,
				keyfile,
				password,
				safeAddress,
				factoryAddress,
				value,
				txServiceBaseUrl,
			)
			if err != nil {
				return err
			}

			cmd.Printf("Safe proposal created successfully\n")
			return nil
		},
	}

	cmd.Flags().StringVar(&rpcURL, "rpc", "", "RPC URL")
	cmd.Flags().StringVar(&keyfile, "keyfile", "", "Path to the keyfile")
	cmd.Flags().StringVar(&password, "password", "", "Password for the keyfile")
	cmd.Flags().StringVar(&safeAddressRaw, "safe", "", "Safe address")
	cmd.Flags().StringVar(&factoryAddressRaw, "factory", "", "ImmutableCreate2Factory address")
	cmd.Flags().StringVar(&valueRaw, "value", "0", "Value to send with the transaction")
	cmd.Flags().StringVar(&txServiceBaseUrl, "api", "", "Safe Transaction Service base URL")

	return cmd
}
