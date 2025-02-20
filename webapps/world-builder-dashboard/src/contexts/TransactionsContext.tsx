import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useTransactions } from '@/hooks/useTransactions' // Assuming this is the hook for fetching transactions
import { useBlockchainContext, TransactionRecord } from '@/contexts/BlockchainContext'

interface TransactionsContextType {
  transactions: TransactionRecord[]
  setTransactions: (transactionRecords: TransactionRecord[]) => void
  loading: boolean
  isSpyMode: boolean
  setIsSpyMode: (isSpymode: boolean) => void
  spyAddress: string
  setSpyAddress: (spyAddress: string) => void
  fetchNextPage: () => Promise<void>  // Add this
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
  const [currentOffset, setCurrentOffset] = useState(0)
  const [loading, setLoading] = useState<boolean>(true)

  const { mergedTransactions } = useTransactions(
    isSpyMode ? spyAddress : connectedAccount, 
    selectedNetworkType ?? '',
    currentOffset
  )

  const fetchNextPage = async () => {
    setCurrentOffset(prev => prev + 50)  // Just update the offset
  }

  // Watch for mergedTransactions changes
  useEffect(() => {
    if (mergedTransactions) {
      setTransactions(mergedTransactions)
      setLoading(false)
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
        setSpyAddress,
        fetchNextPage
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
