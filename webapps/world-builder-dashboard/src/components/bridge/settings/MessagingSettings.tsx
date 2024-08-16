import React, { useEffect, useState } from 'react'
import styles from './MessagingSettings.module.css'
import { Switch } from 'summon-ui/mantine'
import IconMessageSquare02 from '@/assets/IconMessageSquare02'
import { useUISettings } from '@/contexts/UISettingsContext'

interface MessagingSettingsProps {}
const MessagingSettings: React.FC<MessagingSettingsProps> = ({}) => {
  const { isMessagingEnabled, setIsMessagingEnabled } = useUISettings()
  const { theme, toggleTheme } = useUISettings()
  const [typedCharacters, setTypedCharacters] = useState<string>('')

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { key } = event
      if (/^[a-zA-Z]$/.test(key)) {
        setTypedCharacters((prev) => (prev + key).toLowerCase())
      }
    }

    // Add keydown event listener
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      // Clean up event listener on component unmount
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  useEffect(() => {
    if (typedCharacters.includes('light')) {
      if (theme !== 'light') {
        toggleTheme()
      }
      setTypedCharacters('')
    } else if (typedCharacters.includes('dark')) {
      if (theme !== 'dark') {
        toggleTheme()
      }
      setTypedCharacters('')
    } else if (typedCharacters.length > 5) {
      setTypedCharacters('')
    }
  }, [typedCharacters])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <IconMessageSquare02 className={styles.icon} />
        </div>
        <div className={styles.textContainer}>
          <div className={styles.header}>
            <div className={styles.title}>Messaging</div>
            <div className={isMessagingEnabled ? styles.labelEnabled : styles.labelDisabled}>
              {isMessagingEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <div className={styles.supportingText}>
            Toggling on Messages will allow you to call actions on supported testnet networks.
          </div>
        </div>
      </div>
      <Switch
        color='#12B76A'
        checked={isMessagingEnabled}
        onChange={(event) => setIsMessagingEnabled(event.currentTarget.checked)}
        classNames={{ track: styles.track, thumb: styles.thumb }}
        size={'md'}
      />
    </div>
  )
}

export default MessagingSettings
