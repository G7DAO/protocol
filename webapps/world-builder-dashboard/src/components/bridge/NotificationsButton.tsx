import React, { useState } from 'react'
import styles from './NotificationsButton.module.css'
import { Modal, Popover } from 'summon-ui/mantine'
import IconBell from '@/assets/IconBell'
import { NetworkInterface } from '@/components/bridge/BlockchainContext'
import NotificationsDropModal from '@/components/bridge/NotificationsDropModal'

export interface BridgeNotification {
  type: 'WITHDRAWAL' | 'DEPOSIT'
  status: 'COMPLETED' | 'CLAIMABLE' | 'FAILED'
  timestamp: number
  amount: string
  to: number
  seen: boolean
}

interface NotificationsButtonProps {
  notifications: BridgeNotification[]
}
const NotificationsButton: React.FC<NotificationsButtonProps> = ({ notifications }) => {
  return (
    <Popover width={300} shadow='md' position='bottom-end' offset={16} radius={'8px'}>
      <Popover.Target>
        <button className={styles.container}>
          <IconBell />
          <div className={styles.label}>Notifications</div>
          {notifications.filter((n) => !n.seen).length > 0 && (
            <div className={styles.badge}>{notifications.filter((n) => !n.seen).length}</div>
          )}
        </button>
      </Popover.Target>
      <Popover.Dropdown>
        <NotificationsDropModal notifications={notifications} />
      </Popover.Dropdown>
    </Popover>
  )
}

export default NotificationsButton
