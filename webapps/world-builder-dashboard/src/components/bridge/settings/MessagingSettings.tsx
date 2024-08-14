import React from 'react'
import styles from './MessagingSettings.module.css'
import { Switch } from 'summon-ui/mantine'
import IconMessageSquare02 from '@/assets/IconMessageSquare02'
import { useUISettings } from '@/contexts/UISettingsContext'

interface MessagingSettingsProps {}
const MessagingSettings: React.FC<MessagingSettingsProps> = ({}) => {
  const { isMessagingEnabled, setIsMessagingEnabled } = useUISettings()

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <IconMessageSquare02 />
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
      />
    </div>
  )
}

export default MessagingSettings
