package chainprof

import (
	"github.com/ethereum/go-ethereum/accounts/keystore"
)

func CreateAccounts(accountsDir string, numAccounts int, password string) error {
	s := keystore.NewKeyStore(accountsDir, keystore.StandardScryptN, keystore.StandardScryptP)

	for i := 0; i < numAccounts; i++ {
		_, err := s.NewAccount(password)
		if err != nil {
			return err
		}
	}

	return nil
}
