import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'

interface UISettingsContextProps {
  isMessagingEnabled: boolean
  faucetTargetChainId: number
  setIsMessagingEnabled: (value: boolean) => void
  setFaucetTargetChainId: (value: number) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const UISettingsContext = createContext<UISettingsContextProps | undefined>(undefined)

interface UISettingsProviderProps {
  children: ReactNode
}

export const UISettingsProvider: React.FC<UISettingsProviderProps> = ({ children }) => {
  const [isMessagingEnabled, setIsMessagingEnabled] = useState<boolean>(false)
  const [faucetTargetChainId, setFaucetTargetChainId] = useState<number>(1)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const storedIsMessagingEnabled = localStorage.getItem('isMessagingEnabled')
    const storedFaucetTargetChainId = localStorage.getItem('faucetTargetChainId')
    const storedTheme = localStorage.getItem('theme')

    if (storedIsMessagingEnabled !== null) {
      setIsMessagingEnabled(JSON.parse(storedIsMessagingEnabled))
    }
    if (storedFaucetTargetChainId !== null) {
      setFaucetTargetChainId(Number(storedFaucetTargetChainId))
    }
    if (storedTheme) {
      setTheme(storedTheme as 'light' | 'dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('isMessagingEnabled', JSON.stringify(isMessagingEnabled))
  }, [isMessagingEnabled])

  useEffect(() => {
    localStorage.setItem('faucetTargetChainId', faucetTargetChainId.toString())
  }, [faucetTargetChainId])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <UISettingsContext.Provider
      value={{
        isMessagingEnabled,
        faucetTargetChainId,
        setIsMessagingEnabled,
        setFaucetTargetChainId,
        theme,
        toggleTheme
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
