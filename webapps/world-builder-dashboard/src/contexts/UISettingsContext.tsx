import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'

interface UISettingsContextProps {
  isMessagingEnabled: boolean
  faucetTargetChainId: number
  setIsMessagingEnabled: (value: boolean) => void
  setFaucetTargetChainId: (value: number) => void
}

const UISettingsContext = createContext<UISettingsContextProps | undefined>(undefined)

interface UISettingsProviderProps {
  children: ReactNode
}

export const UISettingsProvider: React.FC<UISettingsProviderProps> = ({ children }) => {
  const [isMessagingEnabled, setIsMessagingEnabled] = useState<boolean>(false)
  const [faucetTargetChainId, setFaucetTargetChainId] = useState<number>(1)

  useEffect(() => {
    const storedIsMessagingEnabled = localStorage.getItem('isMessagingEnabled')
    const storedFaucetTargetChainId = localStorage.getItem('faucetTargetChainId')

    if (storedIsMessagingEnabled !== null) {
      setIsMessagingEnabled(JSON.parse(storedIsMessagingEnabled))
    }
    if (storedFaucetTargetChainId !== null) {
      setFaucetTargetChainId(Number(storedFaucetTargetChainId))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('isMessagingEnabled', JSON.stringify(isMessagingEnabled))
  }, [isMessagingEnabled])

  useEffect(() => {
    localStorage.setItem('faucetTargetChainId', faucetTargetChainId.toString())
  }, [faucetTargetChainId])

  return (
    <UISettingsContext.Provider
      value={{
        isMessagingEnabled,
        faucetTargetChainId,
        setIsMessagingEnabled,
        setFaucetTargetChainId
      }}
    >
      {children}
    </UISettingsContext.Provider>
  )
}

export const useUISettings = () => {
  const context = useContext(UISettingsContext)
  if (!context) {
    throw new Error('useUISettings must be used within a UISettingsProvider')
  }
  return context
}
