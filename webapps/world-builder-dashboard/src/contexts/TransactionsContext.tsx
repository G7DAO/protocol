import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useTransactions } from '@/hooks/useTransactions' // Assuming this is the hook for fetching transactions
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { useBlockchainContext } from '@/contexts/BlockchainContext'

interface TransactionsContextType {
  transactions: TransactionRecord[]
  setTransactions: (transactionRecords: TransactionRecord[]) => void
  loading: boolean
  isSpyMode: boolean
  setIsSpyMode: (isSpymode: boolean) => void
  spyAddress: string
  setSpyAddress: (spyAddress: string) => void
}

const TransactionContext = createContext<TransactionsContextType | undefined>(undefined)

interface TransactionProviderProps {
  children: ReactNode
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const { connectedAccount, selectedNetworkType } = useBlockchainContext() // Ensure these are available
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [isSpyMode, setIsSpyMode] = useState(false)
  const [spyAddress, setSpyAddress] = useState('')

  const [loading, setLoading] = useState<boolean>(true)

  // Fetch transactions using the custom hook
  const { mergedTransactions } = useTransactions(isSpyMode ? spyAddress : connectedAccount, selectedNetworkType || 'Testnet')

  useEffect(() => {
    if (mergedTransactions) {
      setTransactions(mergedTransactions)
      setLoading(false) // Set loading to false once transactions are loaded
    }
  }, [mergedTransactions])

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        setTransactions,
        loading,
        isSpyMode,
        setIsSpyMode,
        spyAddress,
        setSpyAddress
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

// Hook to use the context
export const useTransactionContext = () => {
  const context = useContext(TransactionContext)
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider')
  }
  return context
}
