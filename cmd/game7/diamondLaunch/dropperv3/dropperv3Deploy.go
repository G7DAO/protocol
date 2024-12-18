package dropperv3

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"strings"

	"github.com/G7DAO/protocol/bindings/dropper/v3/DropperV3Facet"
	"github.com/G7DAO/protocol/bindings/utils/diamonds/Diamond"
	"github.com/G7DAO/protocol/bindings/utils/diamonds/DiamondCutFacet"
	"github.com/G7DAO/protocol/bindings/utils/diamonds/DiamondLoupeFacet"
	"github.com/G7DAO/protocol/bindings/utils/diamonds/OwnershipFacet"
	"github.com/spf13/cobra"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Returns true if the given address is the zero address and false otherwise.
func addressIsZero(address common.Address) bool {
	zero := big.NewInt(0)
	return zero.Cmp(address.Big()) == 0
}

type DropperDiamondConfiguration struct {
	Diamond           string
	DiamondCutFacet   string
	DiamondLoupeFacet string
	OwnershipFacet    string
	DropperFacet      string
	Transactions      map[string]string
}

// Sets up a Dropper diamond from scratch. Uses the provided facet addresses if they are non-zero.
func DropperV3DiamondSetup(
	txOpts *bind.TransactOpts,
	client *ethclient.Client,
	owner common.Address,
	adminTerminusAddress common.Address,
	adminPoolID *big.Int,
	diamondCutAddress common.Address,
	diamondLoupeAddress common.Address,
	ownershipAddress common.Address,
	dropperFacetAddress common.Address,
) (DropperDiamondConfiguration, error) {
	deployedConfiguration := DropperDiamondConfiguration{}
	deployedConfiguration.Transactions = make(map[string]string)

	// If diamondCutAddress is not provided, we must deploy a new DiamondCutFacet.
	if addressIsZero(diamondCutAddress) {
		address, diamondCutTransaction, _, diamondCutErr := DiamondCutFacet.DeployDiamondCutFacet(txOpts, client)
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

	fmt.Printf("Diamond Cut Facet: %s\n", diamondCutAddress)

	// Now we deploy a Diamond contract which uses the given DiamondCutFacet.
	diamondAddress, diamondTransaction, _, diamondErr := Diamond.DeployDiamond(txOpts, client, owner, diamondCutAddress)
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
		address, diamondLoupeTransaction, _, diamondLoupeErr := DiamondLoupeFacet.DeployDiamondLoupeFacet(txOpts, client)
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
		address, ownershipTransaction, _, ownershipErr := OwnershipFacet.DeployOwnershipFacet(txOpts, client)
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

	// If dropperFacetAddress is not provided, we must deploy a dropper facet.
	if addressIsZero(dropperFacetAddress) {
		address, dropperTransaction, _, dropperErr := DropperV3Facet.DeployDropperV3Facet(txOpts, client)
		if dropperErr != nil {
			return deployedConfiguration, dropperErr
		}

		dropperTxReceiptCtx := context.Background()
		_, dropperTxReceiptErr := bind.WaitMined(dropperTxReceiptCtx, client, dropperTransaction)
		if dropperTxReceiptErr != nil {
			return deployedConfiguration, dropperTxReceiptErr
		}

		dropperFacetAddress = address
		deployedConfiguration.DropperFacet = address.Hex()
		deployedConfiguration.Transactions["DropperDeployment"] = dropperTransaction.Hash().Hex()
	} else {
		deployedConfiguration.DropperFacet = dropperFacetAddress.Hex()
	}

	// Method signature: true if it's already attached and false otherwise
	attachedMethods := make(map[string]bool)

	diamondCutABI, diamondCutABIErr := DiamondCutFacet.DiamondCutFacetMetaData.GetAbi()
	if diamondCutABIErr != nil {
		return deployedConfiguration, diamondCutABIErr
	}
	for _, method := range diamondCutABI.Methods {
		attachedMethods[method.Sig] = true
	}

	// Facet cut actions: Add = 0, Replace = 1, Remove = 2
	diamondLoupeCut := DiamondCutFacet.IDiamondCutFacetCut{FacetAddress: diamondLoupeAddress, Action: 0, FunctionSelectors: make([][4]byte, 0)}
	diamondLoupeABI, diamondLoupeABIErr := DiamondLoupeFacet.DiamondLoupeFacetMetaData.GetAbi()
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

	ownershipCut := DiamondCutFacet.IDiamondCutFacetCut{FacetAddress: ownershipAddress, Action: 0, FunctionSelectors: make([][4]byte, 0)}
	ownershipABI, ownershipABIErr := OwnershipFacet.OwnershipFacetMetaData.GetAbi()
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
	var initCalldataError error

	dropperFacetCut := DiamondCutFacet.IDiamondCutFacetCut{FacetAddress: dropperFacetAddress, Action: 0, FunctionSelectors: make([][4]byte, 0)}
	dropperFacetABI, dropperFacetABIErr := DropperV3Facet.DropperV3FacetMetaData.GetAbi()
	if dropperFacetABIErr != nil {
		return deployedConfiguration, dropperFacetABIErr
	}
	for _, method := range dropperFacetABI.Methods {
		_, ok := attachedMethods[method.Sig]
		if !ok {
			dropperFacetCut.FunctionSelectors = append(dropperFacetCut.FunctionSelectors, [4]byte(method.ID[:4]))
			attachedMethods[method.Sig] = true
		}
	}

	dropperABI, dropperAbiErr := abi.JSON(strings.NewReader(DropperV3Facet.DropperV3FacetMetaData.ABI))
	if dropperAbiErr != nil {
		fmt.Fprintln(os.Stderr, "dropperAbiErr", dropperAbiErr.Error())
	}

	initCalldata, initCalldataError = dropperABI.Pack("init", adminTerminusAddress, adminPoolID)
	if initCalldataError != nil {
		fmt.Fprintln(os.Stderr, "initCalldataError", initCalldataError.Error())
	}

	diamondForCut, diamondForCutErr := DiamondCutFacet.NewDiamondCutFacet(diamondAddress, client)
	if diamondForCutErr != nil {
		return deployedConfiguration, diamondForCutErr
	}

	cuts := []DiamondCutFacet.IDiamondCutFacetCut{diamondLoupeCut, ownershipCut, dropperFacetCut}

	fmt.Println("Prepared for diamond cut.")

	cutTransaction, cutTransactionErr := diamondForCut.DiamondCut(txOpts, cuts, dropperFacetAddress, initCalldata)
	if cutTransactionErr != nil {
		fmt.Printf("Cut transaction error: %s\n", cutTransactionErr)
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

func CreateDropperV3DeployCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "dropper-v3",
		Short: "Deploy new Termiuns diamond contract",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	gogogoCmd := CreateDropperV3GogogoCommand()
	DropperV3FacetCmd := DropperV3Facet.CreateDropperV3FacetCommand()

	cmd.AddCommand(gogogoCmd, DropperV3FacetCmd)

	return cmd
}

func CreateDropperV3GogogoCommand() *cobra.Command {
	var keyfile, nonce, password, value, gasPrice, maxFeePerGas, maxPriorityFeePerGas, rpc, outfile string
	var gasLimit uint64
	var simulate bool
	var timeout uint
	var adminPoolID *big.Int
	var contractOwner common.Address
	var contractOwnerRaw string
	var diamondCutFacet, diamondLoupeFacet, ownershipFacet, adminTerminusAddress, dropperInitializer common.Address
	var diamondCutFacetRaw, diamondLoupeFacetRaw, ownershipFacetRaw, adminTerminusAddressRaw, dropperFacetAddressRaw, adminPoolIDRaw string

	cmd := &cobra.Command{
		Use:   "gogogo",
		Short: "Deploy a new DropperV3 diamond contract",
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

			if adminTerminusAddressRaw == "" {
				return fmt.Errorf("--admin-terminus-address not specified (this should be a path to an Ethereum address Terminus Address)")
			} else {
				if !common.IsHexAddress(adminTerminusAddressRaw) {
					return fmt.Errorf("--admin-terminus-address argument is not a valid Ethereum address")
				} else {
					adminTerminusAddress = common.HexToAddress(adminTerminusAddressRaw)
				}

			}

			if adminPoolIDRaw == "" {
				return fmt.Errorf("--admin-pool-id argument not specified")
			}

			adminPoolID = new(big.Int)
			adminPoolID.SetString(adminPoolIDRaw, 0)

			fmt.Printf("Terminus address is %s\n", adminTerminusAddressRaw)
			fmt.Printf("Terminus pool ID is %s\n", adminPoolIDRaw)

			if dropperFacetAddressRaw != "" {
				if !common.IsHexAddress(dropperFacetAddressRaw) {
					return fmt.Errorf("--dropper-facet argument is not a valid Ethereum address")
				}
				dropperInitializer = common.HexToAddress(dropperFacetAddressRaw)
			} else {
				dropperInitializer = common.BigToAddress(big.NewInt(0))
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			client, clientErr := Diamond.NewClient(rpc)
			if clientErr != nil {
				return clientErr
			}

			key, keyErr := Diamond.KeyFromFile(keyfile, password)
			if keyErr != nil {
				return keyErr
			}

			chainIDCtx, cancelChainIDCtx := Diamond.NewChainContext(timeout)
			defer cancelChainIDCtx()
			chainID, chainIDErr := client.ChainID(chainIDCtx)
			if chainIDErr != nil {
				return chainIDErr
			}

			transactionOpts, transactionOptsErr := bind.NewKeyedTransactorWithChainID(key.PrivateKey, chainID)
			if transactionOptsErr != nil {
				return transactionOptsErr
			}

			Diamond.SetTransactionParametersFromArgs(transactionOpts, nonce, value, gasPrice, maxFeePerGas, maxPriorityFeePerGas, gasLimit, simulate)

			deployedConfiguration, setupErr := DropperV3DiamondSetup(transactionOpts, client, contractOwner, adminTerminusAddress, adminPoolID, diamondCutFacet, diamondLoupeFacet, ownershipFacet, dropperInitializer)
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
	cmd.Flags().StringVar(&adminTerminusAddressRaw, "admin-terminus-address", "", "Address of terminus contract of the administrator badge")
	cmd.Flags().StringVar(&adminPoolIDRaw, "admin-pool-id", "", "Pool ID of the administrator badge")
	cmd.Flags().StringVar(&dropperFacetAddressRaw, "dropper-facet", "", "(Optional) address of pre-existing Dropper Facet")
	cmd.Flags().StringVarP(&outfile, "output", "o", "", "Path to the file where the deployment configuration should be written")

	return cmd
}
