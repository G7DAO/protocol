import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { BridgeNotification } from '@/components/notifications/NotificationsButton'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { getNotifications } from '@/hooks/useL2ToL1MessageStatus'

interface BridgeNotificationsContext {
  newNotifications: BridgeNotification[]
  refetchNewNotifications: (connectedAccount: string) => void
  cleanNewNotifications: (connectedAccount: string) => void
  isDropdownOpened: boolean
  isModalOpened: boolean
  setIsDropdownOpened: (arg0: boolean) => void
  setIsModalOpened: (arg0: boolean) => void
}

const BridgeNotificationsContext = createContext<BridgeNotificationsContext | undefined>(undefined)

interface BridgeNotificationsProviderProps {
  children: ReactNode
}

export const BridgeNotificationsProvider: React.FC<BridgeNotificationsProviderProps> = ({ children }) => {
  const [newNotifications, setNewNotifications] = useState<BridgeNotification[]>([])
  const { connectedAccount, selectedNetworkType } = useBlockchainContext()
  const [isDropdownOpened, setIsDropdownOpened] = useState(false)
  const [isModalOpened, setIsModalOpened] = useState(false)

  const fetchNewNotifications = (connectedAccount: string) => {
    const storageKey = `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
    const transactionsString = localStorage.getItem(storageKey)
    let transactions
    if (transactionsString) {
      try {
        transactions = JSON.parse(transactionsString)
        if (Array.isArray(transactions)) {
          const notifications = getNotifications(transactions)
          const newNotifications = notifications.filter((n: any) => !n.seen)
          setNewNotifications(newNotifications)
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  const cleanNewNotifications = (connectedAccount: string) => {
    const storageKey = `bridge-${connectedAccount}-transactions-${selectedNetworkType}`
    const transactionsString = localStorage.getItem(storageKey)
    let transactions
    if (transactionsString) {
      try {
        transactions = JSON.parse(transactionsString)
        if (Array.isArray(transactions) && transactions.some((t) => t.newTransaction)) {
          const newTransactions = transactions.map((t: any) => ({ ...t, newTransaction: null, seen: true }))
          localStorage.setItem(storageKey, JSON.stringify(newTransactions))
          setNewNotifications([])
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  useEffect(() => {
    if (connectedAccount) {
      fetchNewNotifications(connectedAccount)
    }
  }, [connectedAccount])

  return (
    <BridgeNotificationsContext.Provider
      value={{
        newNotifications,
        refetchNewNotifications: fetchNewNotifications,
        cleanNewNotifications,
        isDropdownOpened,
        isModalOpened,
        setIsDropdownOpened,
        setIsModalOpened
      }}
    >
      {children}
    </BridgeNotificationsContext.Provider>
  )
}

// Hook to use the context
export const useBridgeNotificationsContext = () => {
  const context = useContext(BridgeNotificationsContext)
  if (context === undefined) {
    throw new Error('useBridgeNotificationsContext must be used within a BridgeNotificationsProvider')
  }
  return context
}
