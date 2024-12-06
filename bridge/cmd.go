package bridge

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/cobra"
)

func CreateBridgeCommand() *cobra.Command {
	bridgeCmd := &cobra.Command{
		Use:   "bridge",
		Short: "Bridge tokens between chains",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	bridgeCmd.AddCommand(CreateBridgeNativeTokenCommand())
	bridgeCmd.AddCommand(CreateBridgeERC20Command())

	return bridgeCmd
}

func CreateBridgeNativeTokenCommand() *cobra.Command {
	nativeTokenCmd := &cobra.Command{
		Use:   "native-token",
		Short: "Bridge native tokens between chains",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	nativeTokenCmd.AddCommand(CreateBridgeNativeTokenL1ToL2Command())
	nativeTokenCmd.AddCommand(CreateBridgeNativeTokenL1ToL3Command())

	return nativeTokenCmd
}

func CreateBridgeNativeTokenL1ToL2Command() *cobra.Command {
	var keyFile, password, l1Rpc, l2Rpc, inboxRaw, toRaw, l2CallValueRaw, l2CalldataRaw, safeAddressRaw, safeApi, safeNonceRaw string
	var inboxAddress, to, safeAddress common.Address
	var l2CallValue *big.Int
	var l2Calldata []byte
	var safeOperation uint8
	var safeNonce *big.Int

	createCmd := &cobra.Command{
		Use:   "l1-to-l2",
		Short: "Bridge tokens from L1 to L2",
		Long:  `Bridge tokens from L1 to L2 with a single transaction and arbitrary calldata`,

		PreRunE: func(cmd *cobra.Command, args []string) error {
			if !common.IsHexAddress(inboxRaw) {
				return errors.New("invalid inbox address")
			}
			inboxAddress = common.HexToAddress(inboxRaw)

			if !common.IsHexAddress(toRaw) {
				return errors.New("invalid recipient address")
			}
			to = common.HexToAddress(toRaw)

			l2CallValue = new(big.Int)
			if l2CallValueRaw != "" {
				_, ok := l2CallValue.SetString(l2CallValueRaw, 10)
				if !ok {
					return errors.New("invalid L2 call value")
				}
			} else {
				fmt.Println("No L2 call value provided, defaulting to 0")
				l2CallValue.SetInt64(0)
			}

			if l2CalldataRaw != "" {
				var err error
				l2Calldata, err = hex.DecodeString(l2CalldataRaw)
				if err != nil {
					return err
				}
			}

			if keyFile == "" {
				return errors.New("keyfile is required")
			}

			if safeAddressRaw != "" {
				if !common.IsHexAddress(safeAddressRaw) {
					return fmt.Errorf("--safe is not a valid Ethereum address")
				} else {
					safeAddress = common.HexToAddress(safeAddressRaw)
				}

				if safeApi == "" {
					client, clientErr := ethclient.DialContext(context.Background(), l1Rpc)
					if clientErr != nil {
						return clientErr
					}

					chainID, chainIDErr := client.ChainID(context.Background())
					if chainIDErr != nil {
						return chainIDErr
					}
					safeApi = "https://safe-client.safe.global/v1/chains/" + chainID.String() + "/transactions/" + safeAddress.Hex() + "/propose"
					fmt.Println("--safe-api not specified, using default (", safeApi, ")")
				}

				if OperationType(safeOperation).String() == "Unknown" {
					return fmt.Errorf("--safe-operation must be 0 (Call) or 1 (DelegateCall)")
				}

				if safeNonceRaw != "" {
					safeNonce = new(big.Int)
					_, ok := safeNonce.SetString(safeNonceRaw, 0)
					if !ok {
						return fmt.Errorf("--safe-nonce is not a valid big integer")
					}
				} else {
					fmt.Println("--safe-nonce not specified, fetching from Safe")
				}
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("Bridging to", to.Hex())
			if safeAddressRaw != "" {
				err := NativeTokenBridgePropose(inboxAddress, keyFile, password, l1Rpc, l2Rpc, to, l2CallValue, l2Calldata, safeAddress, safeApi, safeOperation, safeNonce)
				if err != nil {
					fmt.Fprintln(cmd.ErrOrStderr(), err.Error())
					return err
				}
			} else {
				transaction, transactionErr := NativeTokenBridgeCall(inboxAddress, keyFile, password, l1Rpc, l2Rpc, to, l2CallValue, l2Calldata)
				if transactionErr != nil {
					fmt.Fprintln(cmd.ErrOrStderr(), transactionErr.Error())
					return transactionErr
				}

				fmt.Println("Transaction sent:", transaction.Hash().Hex())
			}

			return nil
		},
	}

	createCmd.Flags().StringVar(&password, "password", "", "Password to encrypt accounts with")
	createCmd.Flags().StringVar(&keyFile, "keyfile", "", "Keyfile to sign transaction with")
	createCmd.Flags().StringVar(&l1Rpc, "l1-rpc", "", "L1 RPC URL")
	createCmd.Flags().StringVar(&l2Rpc, "l2-rpc", "", "L2 RPC URL")
	createCmd.Flags().StringVar(&inboxRaw, "inbox", "", "Inbox address")
	createCmd.Flags().StringVar(&toRaw, "to", "", "Recipient or contract address")
	createCmd.Flags().StringVar(&l2CallValueRaw, "amount", "", "L2 call value")
	createCmd.Flags().StringVar(&l2CalldataRaw, "l2-calldata", "", "Calldata to send")
	createCmd.Flags().StringVar(&safeAddressRaw, "safe", "", "Address of the Safe contract")
	createCmd.Flags().StringVar(&safeApi, "safe-api", "", "Safe API for the Safe Transaction Service (optional)")
	createCmd.Flags().Uint8Var(&safeOperation, "safe-operation", 0, "Safe operation type: 0 (Call) or 1 (DelegateCall)")
	createCmd.Flags().StringVar(&safeNonceRaw, "safe-nonce", "", "Safe nonce")

	return createCmd
}

func CreateBridgeNativeTokenL1ToL3Command() *cobra.Command {
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

			if keyFile == "" {
				return errors.New("keyfile is required")
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			transaction, transactionErr := Teleport(teleporterAddress, teleportParams, keyFile, password, l1Rpc, l2Rpc, l3Rpc)
			if transactionErr != nil {
				fmt.Fprintln(cmd.ErrOrStderr(), transactionErr.Error())
				return transactionErr
			}

			fmt.Println("Done! Transaction hash:", transaction.Hash().Hex())

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

func CreateBridgeERC20Command() *cobra.Command {
	erc20Cmd := &cobra.Command{
		Use:   "erc20",
		Short: "Bridge ERC20 tokens between chains",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	erc20Cmd.AddCommand(CreateBridgeERC20L1ToL2Command())

	return erc20Cmd
}

func CreateBridgeERC20L1ToL2Command() *cobra.Command {
	var keyFile, password, l1Rpc, l2Rpc, routerRaw, tokenAddressRaw, toRaw, amountRaw, safeAddressRaw, safeApi, safeNonceRaw string
	var routerAddress, tokenAddress, to, safeAddress common.Address
	var amount *big.Int
	var safeOperation uint8
	var safeNonce *big.Int
	var isCustomNativeToken bool

	createCmd := &cobra.Command{
		Use:   "l1-to-l2",
		Short: "Bridge ERC20 tokens from L1 to L2",
		Long:  `Bridge ERC20 tokens from L1 to L2 with a single transaction and arbitrary calldata`,

		PreRunE: func(cmd *cobra.Command, args []string) error {
			if !common.IsHexAddress(routerRaw) {
				return errors.New("invalid router address")
			}
			routerAddress = common.HexToAddress(routerRaw)

			if !common.IsHexAddress(toRaw) {
				return errors.New("invalid recipient address")
			}
			to = common.HexToAddress(toRaw)

			if !common.IsHexAddress(tokenAddressRaw) {
				return errors.New("invalid token address")
			}
			tokenAddress = common.HexToAddress(tokenAddressRaw)

			amount = new(big.Int)
			if amountRaw != "" {
				_, ok := amount.SetString(amountRaw, 10)
				if !ok {
					return errors.New("invalid L2 call value")
				}
			} else {
				fmt.Println("No amount provided, defaulting to 0")
				amount.SetInt64(0)
			}

			if keyFile == "" {
				return errors.New("keyfile is required")
			}

			if safeAddressRaw != "" {
				if !common.IsHexAddress(safeAddressRaw) {
					return fmt.Errorf("--safe is not a valid Ethereum address")
				} else {
					safeAddress = common.HexToAddress(safeAddressRaw)
				}

				if safeApi == "" {
					client, clientErr := ethclient.DialContext(context.Background(), l1Rpc)
					if clientErr != nil {
						return clientErr
					}

					chainID, chainIDErr := client.ChainID(context.Background())
					if chainIDErr != nil {
						return chainIDErr
					}
					safeApi = "https://safe-client.safe.global/v1/chains/" + chainID.String() + "/transactions/" + safeAddress.Hex() + "/propose"
					fmt.Println("--safe-api not specified, using default (", safeApi, ")")
				}

				if OperationType(safeOperation).String() == "Unknown" {
					return fmt.Errorf("--safe-operation must be 0 (Call) or 1 (DelegateCall)")
				}

				if safeNonceRaw != "" {
					safeNonce = new(big.Int)
					_, ok := safeNonce.SetString(safeNonceRaw, 0)
					if !ok {
						return fmt.Errorf("--safe-nonce is not a valid big integer")
					}
				} else {
					fmt.Println("--safe-nonce not specified, fetching from Safe")
				}

				if l1Rpc == "" {
					return errors.New("l1-rpc is required")
				}

				if l2Rpc == "" {
					return errors.New("l2-rpc is required")
				}
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("Bridging", tokenAddress.Hex(), "to", to.Hex())
			if safeAddressRaw == "" {
				transaction, transactionErr := ERC20BridgeCall(routerAddress, keyFile, password, l1Rpc, l2Rpc, tokenAddress, to, amount, isCustomNativeToken)
				if transactionErr != nil {
					fmt.Fprintln(cmd.ErrOrStderr(), transactionErr.Error())
					return transactionErr
				}
				fmt.Println("Transaction sent:", transaction.Hash().Hex())
			} else {
				proposeErr := ERC20BridgePropose(routerAddress, keyFile, password, l1Rpc, l2Rpc, tokenAddress, to, amount, safeAddress, safeApi, safeOperation, safeNonce, isCustomNativeToken)
				if proposeErr != nil {
					fmt.Fprintln(cmd.ErrOrStderr(), proposeErr.Error())
					return proposeErr
				}
			}

			return nil
		},
	}

	createCmd.Flags().StringVar(&password, "password", "", "Password to encrypt accounts with")
	createCmd.Flags().StringVar(&keyFile, "keyfile", "", "Keyfile to sign transaction with")
	createCmd.Flags().StringVar(&l1Rpc, "l1-rpc", "", "L1 RPC URL")
	createCmd.Flags().StringVar(&l2Rpc, "l2-rpc", "", "L2 RPC URL")
	createCmd.Flags().StringVar(&routerRaw, "router", "", "Router address")
	createCmd.Flags().StringVar(&toRaw, "to", "", "Recipient address")
	createCmd.Flags().StringVar(&tokenAddressRaw, "token", "", "Token address")
	createCmd.Flags().StringVar(&amountRaw, "amount", "", "Amount to send")
	createCmd.Flags().StringVar(&safeAddressRaw, "safe", "", "Address of the Safe contract")
	createCmd.Flags().StringVar(&safeApi, "safe-api", "", "Safe API for the Safe Transaction Service (optional)")
	createCmd.Flags().Uint8Var(&safeOperation, "safe-operation", 0, "Safe operation type: 0 (Call) or 1 (DelegateCall)")
	createCmd.Flags().StringVar(&safeNonceRaw, "safe-nonce", "", "Safe nonce")
	createCmd.Flags().BoolVar(&isCustomNativeToken, "custom-native-token", false, "Is custom native token")

	return createCmd
}
