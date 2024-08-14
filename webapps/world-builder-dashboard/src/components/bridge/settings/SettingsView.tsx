import React from 'react'
import styles from './SettingsView.module.css'
import MessagingSettings from '@/components/bridge/settings/MessagingSettings'

interface SettingsViewProps {}
const SettingsView: React.FC<SettingsViewProps> = ({}) => {
  return (
    <div className={styles.container}>
      <MessagingSettings />
    </div>
  )
}

export default SettingsView
