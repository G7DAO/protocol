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
  const [isMessagingEnabled, setIsMessagingEnabled] = useState<boolean | undefined>(undefined)
  const [faucetTargetChainId, setFaucetTargetChainId] = useState<number>(1)
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>('dark')

  useEffect(() => {
    const storedIsMessagingEnabled = localStorage.getItem('isMessagingEnabled')
    const storedTheme = localStorage.getItem('theme')
    if (storedIsMessagingEnabled !== null) {
      setIsMessagingEnabled(JSON.parse(storedIsMessagingEnabled))
    }
    if (storedTheme) {
      setTheme(storedTheme as 'light' | 'dark')
    }
  }, [])

  useEffect(() => {
    if (isMessagingEnabled !== undefined) {
      localStorage.setItem('isMessagingEnabled', JSON.stringify(isMessagingEnabled))
    }
  }, [isMessagingEnabled])

  useEffect(() => {
    if (theme) {
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <UISettingsContext.Provider
      value={{
        faucetTargetChainId,
        isMessagingEnabled: isMessagingEnabled ?? true,
        setIsMessagingEnabled,
        setFaucetTargetChainId,
        theme: theme ?? 'dark',
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
