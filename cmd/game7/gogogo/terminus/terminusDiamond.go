package terminusGogogo

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os"

	"github.com/G7DAO/protocol/bindings/Security/Terminus/TerminusFacet"
	"github.com/G7DAO/protocol/bindings/Security/Terminus/diamond/DiamondTerminus"
	"github.com/G7DAO/protocol/bindings/Security/Terminus/diamond/facets/TerminusDiamondCutFacet"
	"github.com/G7DAO/protocol/bindings/Security/Terminus/diamond/facets/TerminusDiamondLoupeFacet"
	"github.com/G7DAO/protocol/bindings/Security/Terminus/diamond/facets/TerminusOwnershipFacet"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/cobra"
)

type DiamondConfiguration struct {
	Diamond           string
	DiamondCutFacet   string
	DiamondLoupeFacet string
	OwnershipFacet    string
	TerminusFacet     string
	Transactions      map[string]string
}

// Returns true if the given address is the zero address and false otherwise.
func addressIsZero(address common.Address) bool {
	zero := big.NewInt(0)
	return zero.Cmp(address.Big()) == 0
}

func CreateGogogoCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "terminus-gogogo",
		Short: "Deploy new terminus diamond contracts, and upgrade existing diamonds",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	v1Cmd := CreateV1Command()
	cmd.AddCommand(v1Cmd)

	return cmd
}

// Sets up a Terminus diamond from scratch. Uses the provided facet addresses if they are non-zero.
func DiamondSetupV1(txOpts *bind.TransactOpts, client *ethclient.Client, owner common.Address, diamondCutAddress common.Address, diamondLoupeAddress common.Address, ownershipAddress common.Address, terminusAddress common.Address) (DiamondConfiguration, error) {
	deployedConfiguration := DiamondConfiguration{}
	deployedConfiguration.Transactions = make(map[string]string)

	// If diamondCutAddress is not provided, we must deploy a new DiamondCutFacet.
	if addressIsZero(diamondCutAddress) {
		address, diamondCutTransaction, _, diamondCutErr := TerminusDiamondCutFacet.DeployTerminusDiamondCutFacet(txOpts, client)
		if diamondCutErr != nil {
			return deployedConfiguration, diamondCutErr
		}

		diamondCutTxReceiptCtx := context.Background()
		_, diamondCutTxReceiptErr := bind.WaitMined(diamondCutTxReceiptCtx, client, diamondCutTransaction)
		if diamondCutTxReceiptErr != nil {
			return deployedConfiguration, diamondCutTxReceiptErr
		}

		diamondCutAddress = address
		deployedConfiguration.DiamondCutFacet = address.Hex()
		deployedConfiguration.Transactions["DiamondCutFacetDeployment"] = diamondCutTransaction.Hash().Hex()
	} else {
		deployedConfiguration.DiamondCutFacet = diamondCutAddress.Hex()
	}

	// Now we deploy a Diamond contract which uses the given DiamondCutFacet.
	diamondAddress, diamondTransaction, _, diamondErr := DiamondTerminus.DeployDiamondTermiuns(txOpts, client, owner, diamondCutAddress)
	if diamondErr != nil {
		return deployedConfiguration, diamondErr
	}

	diamondTxReceiptCtx := context.Background()
	_, diamondTxReceiptErr := bind.WaitMined(diamondTxReceiptCtx, client, diamondTransaction)
	if diamondTxReceiptErr != nil {
		return deployedConfiguration, diamondTxReceiptErr
	}

	deployedConfiguration.Diamond = diamondAddress.Hex()
	deployedConfiguration.Transactions["DiamondDeployment"] = diamondTransaction.Hash().Hex()

	// If diamondLoupeAddress is not provided, we must deploy a new DiamondLoupeFacet.
	if addressIsZero(diamondLoupeAddress) {
		address, diamondLoupeTransaction, _, diamondLoupeErr := TerminusDiamondLoupeFacet.DeployTerminusDiamondLoupeFacet(txOpts, client)
		if diamondLoupeErr != nil {
			return deployedConfiguration, diamondLoupeErr
		}

		diamondLoupeTxReceiptCtx := context.Background()
		_, diamondLoupeTxReceiptErr := bind.WaitMined(diamondLoupeTxReceiptCtx, client, diamondLoupeTransaction)
		if diamondLoupeTxReceiptErr != nil {
			return deployedConfiguration, diamondLoupeTxReceiptErr
		}

		diamondLoupeAddress = address
		deployedConfiguration.DiamondLoupeFacet = address.Hex()
		deployedConfiguration.Transactions["DiamondLoupeFacetDeployment"] = diamondLoupeTransaction.Hash().Hex()
	} else {
		deployedConfiguration.DiamondLoupeFacet = diamondLoupeAddress.Hex()
	}

	// If ownershipAddress is not provided, we must deploy a new OwnershipFacet.
	if addressIsZero(ownershipAddress) {
		address, ownershipTransaction, _, ownershipErr := TerminusOwnershipFacet.DeployTerminusOwnershipFacet(txOpts, client)
		if ownershipErr != nil {
			return deployedConfiguration, ownershipErr
		}

		ownershipTxReceiptCtx := context.Background()
		_, ownershipTxReceiptErr := bind.WaitMined(ownershipTxReceiptCtx, client, ownershipTransaction)
		if ownershipTxReceiptErr != nil {
			return deployedConfiguration, ownershipTxReceiptErr
		}

		ownershipAddress = address
		deployedConfiguration.OwnershipFacet = address.Hex()
		deployedConfiguration.Transactions["OwnershipFacetDeployment"] = ownershipTransaction.Hash().Hex()
	} else {
		deployedConfiguration.OwnershipFacet = ownershipAddress.Hex()
	}

	// If terminusAddress is not provided, we must deploy a new TerminusFacet.
	if addressIsZero(terminusAddress) {
		address, terminusTransaction, _, terminusErr := TerminusFacet.DeployTerminusFacet(txOpts, client)
		if terminusErr != nil {
			return deployedConfiguration, terminusErr
		}

		terminusTxReceiptCtx := context.Background()
		_, terminusTxReceiptErr := bind.WaitMined(terminusTxReceiptCtx, client, terminusTransaction)
		if terminusTxReceiptErr != nil {
			return deployedConfiguration, terminusTxReceiptErr
		}

		terminusAddress = address
		deployedConfiguration.TerminusFacet = address.Hex()
		deployedConfiguration.Transactions["TerminusFacetDeployment"] = terminusTransaction.Hash().Hex()
	} else {
		deployedConfiguration.TerminusFacet = terminusAddress.Hex()
	}

	// Method signature: true if it's already attached and false otherwise
	attachedMethods := make(map[string]bool)

	diamondCutABI, diamondCutABIErr := TerminusDiamondCutFacet.TerminusDiamondCutFacetMetaData.GetAbi()
	if diamondCutABIErr != nil {
		return deployedConfiguration, diamondCutABIErr
	}
	for _, method := range diamondCutABI.Methods {
		attachedMethods[method.Sig] = true
	}

	// Facet cut actions: Add = 0, Replace = 1, Remove = 2

	diamondLoupeCut := TerminusDiamondCutFacet.IDiamondCutFacetCut{FacetAddress: diamondLoupeAddress, Action: 0, FunctionSelectors: make([][4]byte, 0)}
	diamondLoupeABI, diamondLoupeABIErr := TerminusDiamondLoupeFacet.TerminusDiamondLoupeFacetMetaData.GetAbi()
	if diamondLoupeABIErr != nil {
		return deployedConfiguration, diamondLoupeABIErr
	}
	for _, method := range diamondLoupeABI.Methods {
		_, ok := attachedMethods[method.Sig]
		if !ok {
			diamondLoupeCut.FunctionSelectors = append(diamondLoupeCut.FunctionSelectors, [4]byte(method.ID[:4]))
			attachedMethods[method.Sig] = true
		}
	}

	ownershipCut := TerminusDiamondCutFacet.IDiamondCutFacetCut{FacetAddress: ownershipAddress, Action: 0, FunctionSelectors: make([][4]byte, 0)}
	ownershipABI, ownershipABIErr := TerminusOwnershipFacet.TerminusOwnershipFacetMetaData.GetAbi()
	if ownershipABIErr != nil {
		return deployedConfiguration, ownershipABIErr
	}
	for _, method := range ownershipABI.Methods {
		_, ok := attachedMethods[method.Sig]
		if !ok {
			ownershipCut.FunctionSelectors = append(ownershipCut.FunctionSelectors, [4]byte(method.ID[:4]))
			attachedMethods[method.Sig] = true
		}
	}

	// Call data for contract initialization
	var initCalldata []byte

	terminusFacetCut := TerminusDiamondCutFacet.IDiamondCutFacetCut{FacetAddress: terminusAddress, Action: 0, FunctionSelectors: make([][4]byte, 0)}
	terminusABI, terminusABIErr := TerminusFacet.TerminusFacetMetaData.GetAbi()
	if terminusABIErr != nil {
		return deployedConfiguration, terminusABIErr
	}
	for _, method := range terminusABI.Methods {
		// We initialize a Terminus diamond using the TerminusFacet init method.
		if method.Name == "init" {
			initCalldata = method.ID
		}

		_, ok := attachedMethods[method.Sig]
		if !ok {
			terminusFacetCut.FunctionSelectors = append(terminusFacetCut.FunctionSelectors, [4]byte(method.ID[:4]))
			attachedMethods[method.Sig] = true
		}
	}

	diamondForCut, diamondForCutErr := TerminusDiamondCutFacet.NewTerminusDiamondCutFacet(diamondAddress, client)
	if diamondForCutErr != nil {
		return deployedConfiguration, diamondForCutErr
	}

	cuts := []TerminusDiamondCutFacet.IDiamondCutFacetCut{diamondLoupeCut, ownershipCut, terminusFacetCut}

	cutTransaction, cutTransactionErr := diamondForCut.DiamondCut(txOpts, cuts, terminusAddress, initCalldata)
	if cutTransactionErr != nil {
		return deployedConfiguration, cutTransactionErr
	}

	cutTxReceiptCtx := context.Background()
	_, cutTxReceiptErr := bind.WaitMined(cutTxReceiptCtx, client, cutTransaction)
	if cutTxReceiptErr != nil {
		return deployedConfiguration, cutTxReceiptErr
	}

	deployedConfiguration.Transactions["Cut"] = cutTransaction.Hash().Hex()

	return deployedConfiguration, nil
}

func CreateV1Command() *cobra.Command {
	var keyfile, nonce, password, value, gasPrice, maxFeePerGas, maxPriorityFeePerGas, rpc, outfile string
	var gasLimit uint64
	var simulate bool
	var timeout uint

	var contractOwner common.Address
	var contractOwnerRaw string
	var diamondCutFacet, diamondLoupeFacet, ownershipFacet, terminusFacet common.Address
	var diamondCutFacetRaw, diamondLoupeFacetRaw, ownershipFacetRaw, terminusFacetRaw string

	cmd := &cobra.Command{
		Use:   "v1",
		Short: "Deploy a new diamond contract",
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if keyfile == "" {
				return fmt.Errorf("--keystore not specified (this should be a path to an Ethereum account keystore file)")
			}

			if contractOwnerRaw == "" {
				return fmt.Errorf("--contract-owner argument not specified")
			} else if !common.IsHexAddress(contractOwnerRaw) {
				return fmt.Errorf("--contract-owner argument is not a valid Ethereum address")
			}
			contractOwner = common.HexToAddress(contractOwnerRaw)

			if diamondCutFacetRaw != "" {
				if !common.IsHexAddress(diamondCutFacetRaw) {
					return fmt.Errorf("--diamond-cut-facet argument is not a valid Ethereum address")
				}
				diamondCutFacet = common.HexToAddress(diamondCutFacetRaw)
			} else {
				diamondCutFacet = common.BigToAddress(big.NewInt(0))
			}

			if diamondLoupeFacetRaw != "" {
				if !common.IsHexAddress(diamondLoupeFacetRaw) {
					return fmt.Errorf("--diamond-loupe-facet argument is not a valid Ethereum address")
				}
				diamondLoupeFacet = common.HexToAddress(diamondLoupeFacetRaw)
			} else {
				diamondLoupeFacet = common.BigToAddress(big.NewInt(0))
			}

			if ownershipFacetRaw != "" {
				if !common.IsHexAddress(ownershipFacetRaw) {
					return fmt.Errorf("--ownership-facet argument is not a valid Ethereum address")
				}
				ownershipFacet = common.HexToAddress(ownershipFacetRaw)
			} else {
				ownershipFacet = common.BigToAddress(big.NewInt(0))
			}
			if terminusFacetRaw != "" {
				if !common.IsHexAddress(terminusFacetRaw) {
					return fmt.Errorf("--terminus-facet argument is not a valid Ethereum address")
				}
				terminusFacet = common.HexToAddress(terminusFacetRaw)
			} else {
				terminusFacet = common.BigToAddress(big.NewInt(0))
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			client, clientErr := DiamondTerminus.NewClient(rpc)
			if clientErr != nil {
				return clientErr
			}

			key, keyErr := DiamondTerminus.KeyFromFile(keyfile, password)
			if keyErr != nil {
				return keyErr
			}

			chainIDCtx, cancelChainIDCtx := DiamondTerminus.NewChainContext(timeout)
			defer cancelChainIDCtx()
			chainID, chainIDErr := client.ChainID(chainIDCtx)
			if chainIDErr != nil {
				return chainIDErr
			}

			transactionOpts, transactionOptsErr := bind.NewKeyedTransactorWithChainID(key.PrivateKey, chainID)
			if transactionOptsErr != nil {
				return transactionOptsErr
			}

			DiamondTerminus.SetTransactionParametersFromArgs(transactionOpts, nonce, value, gasPrice, maxFeePerGas, maxPriorityFeePerGas, gasLimit, simulate)

			deployedConfiguration, setupErr := DiamondSetupV1(transactionOpts, client, contractOwner, diamondCutFacet, diamondLoupeFacet, ownershipFacet, terminusFacet)
			if setupErr != nil {
				return setupErr
			}

			deployedConfigurationJSON, marshalErr := json.Marshal(deployedConfiguration)
			if marshalErr != nil {
				return marshalErr
			}

			if outfile != "" {
				writeErr := os.WriteFile(outfile, deployedConfigurationJSON, 0644)
				if writeErr != nil {
					return writeErr
				}
			} else {
				cmd.Println(string(deployedConfigurationJSON))
			}
			return nil
		},
	}

	cmd.Flags().StringVar(&rpc, "rpc", "", "URL of the JSONRPC API to use")
	cmd.Flags().StringVar(&keyfile, "keyfile", "", "Path to the keystore file to use for the transaction")
	cmd.Flags().StringVar(&password, "password", "", "Password to use to unlock the keystore (if not specified, you will be prompted for the password when the command executes)")
	cmd.Flags().StringVar(&nonce, "nonce", "", "Nonce to use for the transaction")
	cmd.Flags().StringVar(&value, "value", "", "Value to send with the transaction")
	cmd.Flags().StringVar(&gasPrice, "gas-price", "", "Gas price to use for the transaction")
	cmd.Flags().StringVar(&maxFeePerGas, "max-fee-per-gas", "", "Maximum fee per gas to use for the (EIP-1559) transaction")
	cmd.Flags().StringVar(&maxPriorityFeePerGas, "max-priority-fee-per-gas", "", "Maximum priority fee per gas to use for the (EIP-1559) transaction")
	cmd.Flags().Uint64Var(&gasLimit, "gas-limit", 0, "Gas limit for the transaction")
	cmd.Flags().BoolVar(&simulate, "simulate", false, "Simulate the transaction without sending it")
	cmd.Flags().UintVar(&timeout, "timeout", 60, "Timeout (in seconds) for interactions with the JSONRPC API")

	cmd.Flags().StringVar(&contractOwnerRaw, "contract-owner", "", "Address of account which should own the Diamond")
	cmd.Flags().StringVar(&diamondCutFacetRaw, "diamond-cut-facet", "", "(Optional) address of pre-existing DiamondCutFacet that should be mounted onto the Diamond")
	cmd.Flags().StringVar(&diamondLoupeFacetRaw, "diamond-loupe-facet", "", "(Optional) address of pre-existing DiamondLoupeFacet that should be mounted onto the Diamond")
	cmd.Flags().StringVar(&ownershipFacetRaw, "ownership-facet", "", "(Optional) address of pre-existing OwnershipFacet that should be mounted onto the Diamond")
	cmd.Flags().StringVar(&terminusFacetRaw, "terminus-facet", "", "(Optional) address of pre-existing terminusFacet that should be mounted onto the Diamond")
	cmd.Flags().StringVarP(&outfile, "output", "o", "", "Path to the file where the deployment configuration should be written")

	return cmd
}
