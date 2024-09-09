import React from 'react'
import { useWallet } from '../contexts/WalletContext.tsx'

const WalletConnection = () => {
  const { account, getProvider, error } = useWallet()

  return (
    <div>
      {!account && <button onClick={() => getProvider()}>Connect Wallet</button>}
      {account && <p>Connected Account: {account}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default WalletConnection
