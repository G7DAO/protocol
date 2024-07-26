import React from 'react'
import styles from './NotificationsButton.module.css'
import { Popover } from 'summon-ui/mantine'
import IconBell from '@/assets/IconBell'
import { useBridgeNotificationsContext } from '@/components/bridge/BridgeNotificationsContext'
import NotificationsDropModal from '@/components/bridge/NotificationsDropModal'

export interface BridgeNotification {
  type: string
  status: string
  timestamp: number
  amount: string
  to: number
  seen: boolean
}

interface NotificationsButtonProps {
  notifications: BridgeNotification[]
}
const NotificationsButton: React.FC<NotificationsButtonProps> = ({ notifications }) => {
  const { newNotifications, isModalOpened, setIsModalOpened, isDropdownOpened, setIsDropdownOpened } =
    useBridgeNotificationsContext()
  return (
    <Popover
      width={300}
      shadow='md'
      position='bottom-end'
      offset={16}
      radius={'8px'}
      opened={isDropdownOpened}
      onChange={setIsDropdownOpened}
    >
      <Popover.Target>
        <button
          className={styles.container}
          onClick={() => {
            setIsDropdownOpened(!isDropdownOpened)
          }}
        >
          <IconBell />
          <div className={styles.label}>Notifications</div>
          {newNotifications.length > 0 && <div className={styles.badge}>{newNotifications.length}</div>}
        </button>
      </Popover.Target>
      <Popover.Dropdown>
        <NotificationsDropModal notifications={notifications} />
      </Popover.Dropdown>
    </Popover>
  )
}

export default NotificationsButton
