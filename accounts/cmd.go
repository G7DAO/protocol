package accounts

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pborman/uuid"
	"github.com/quan8/go-ethereum/accounts/keystore"
	"github.com/quan8/go-ethereum/crypto"
	"github.com/spf13/cobra"
)

type outputGenerate struct {
	Address      string
	AddressEIP55 string
}

func CreateAccountsCommand() *cobra.Command {
	crossChainCmd := &cobra.Command{
		Use:   "accounts",
		Short: "Accounts to be used for transactions",
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	generateKeyfile := CreateGenerateKeyFileCommand()

	crossChainCmd.AddCommand(generateKeyfile)

	return crossChainCmd
}

// Source: https://github.com/quan8/go-ethereum/blob/v1.9.5/cmd/ethkey/generate.go
func CreateGenerateKeyFileCommand() *cobra.Command {
	var keyfileDir, password, privateKeyRaw string

	createCmd := &cobra.Command{
		Use:   "keyfile",
		Short: "Generate a keyfile for use with transactions",
		Long:  `Generate a keyfile for use with transactions`,

		PreRunE: func(cmd *cobra.Command, args []string) error {
			if keyfileDir == "" {
				return errors.New("keyfile is required")
			}

			if password == "" {
				return errors.New("password is required")
			}

			if privateKeyRaw == "" {
				return errors.New("private key is required")
			}

			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {

			privateKey, privateKeyErr := crypto.HexToECDSA(privateKeyRaw)
			if privateKeyErr != nil {
				fmt.Printf("Error parsing private key: %v", privateKeyErr)
				return privateKeyErr
			}

			// Create the keyfile object with a random UUID.
			id := uuid.NewRandom()
			key := &keystore.Key{
				Id:         id,
				Address:    crypto.PubkeyToAddress(privateKey.PublicKey),
				PrivateKey: privateKey,
			}

			keyJson, keyJsonErr := keystore.EncryptKey(key, password, keystore.StandardScryptN, keystore.StandardScryptP)
			if keyJsonErr != nil {
				fmt.Printf("Error encrypting key: %v", keyJsonErr)
				return keyJsonErr
			}

			// Store the file to disk.
			if mkdirErr := os.MkdirAll(filepath.Dir(keyfileDir), 0700); mkdirErr != nil {
				fmt.Printf("Could not create directory %s", filepath.Dir(keyfileDir))
				return mkdirErr
			}
			if writeFileErr := os.WriteFile(keyfileDir, keyJson, 0600); writeFileErr != nil {
				fmt.Printf("Could not write keyfile to %s", keyfileDir)
				return writeFileErr
			}

			// Output some information.
			out := outputGenerate{
				Address: key.Address.Hex(),
			}

			fmt.Println("Address:", out.Address)

			return nil
		},
	}

	createCmd.Flags().StringVar(&privateKeyRaw, "private-key", "", "Private key to sign transaction with")
	createCmd.Flags().StringVar(&keyfileDir, "output", "", "Directory to output keyfile to")
	createCmd.Flags().StringVar(&password, "password", "", "Password to encrypt keyfile with")

	return createCmd
}
