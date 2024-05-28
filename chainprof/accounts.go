package chainprof

import (
	"github.com/ethereum/go-ethereum/accounts/keystore"
)

func CreateAccounts(accountsDir string, numAccounts int, password string) error {
	// WARNING: This is a *very* insecure method to generate accounts. It is using insecure ScryptN and ScryptP parameters!
	// Do not use this for ANYTHING important please.
	s := keystore.NewKeyStore(accountsDir, 2, 8)

	for i := 0; i < numAccounts; i++ {
		_, err := s.NewAccount(password)
		if err != nil {
			return err
		}
	}

	return nil
}
