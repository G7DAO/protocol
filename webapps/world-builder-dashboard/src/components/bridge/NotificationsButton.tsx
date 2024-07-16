import React from 'react'
import styles from './NotificationsButton.module.css'
import IconBell from '@/assets/IconBell'

interface NotificationsButtonProps {}
const NotificationsButton: React.FC<NotificationsButtonProps> = ({}) => {
  return (
    <button className={styles.container}>
      <IconBell />
      <div className={styles.label}>Notifications</div>
      <div className={styles.badge}>2</div>
    </button>
  )
}

export default NotificationsButton
