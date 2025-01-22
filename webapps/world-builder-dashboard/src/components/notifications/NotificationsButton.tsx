import React from 'react'
import styles from './NotificationsButton.module.css'
import { Popover, Modal } from 'summon-ui/mantine'
import IconBell from '@/assets/IconBell'
import NotificationsDropModal, { NotificationsModal } from '@/components/notifications/NotificationsDropModal'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import { TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { useMediaQuery } from '@mantine/hooks'

export interface BridgeNotification {
  type: string
  status: string
  timestamp: number
  amount: string
  to: number
  seen: boolean
  tx: TransactionRecord
  symbol: string
}

interface NotificationsButtonProps {
  notifications: BridgeNotification[]
}
const NotificationsButton: React.FC<NotificationsButtonProps> = ({ notifications }) => {
  const { newNotifications, isDropdownOpened, setIsDropdownOpened, isModalOpened, setIsModalOpened } =
    useBridgeNotificationsContext()
  const smallView = useMediaQuery('(max-width: 1199px)')

  return (
    <Popover
      width={300}
      shadow='md'
      position='bottom-end'
      offset={16}
      radius={'8px'}
      opened={isDropdownOpened}
      onChange={setIsDropdownOpened}
      classNames={{ dropdown: styles.dropdown }}
    >
      <Modal
        opened={isModalOpened}
        onClose={() => setIsModalOpened(false)}
        withCloseButton={false}
        padding={'0px'}
        size={'678px'}
        radius={'12px'}
        overlayProps={{
          color: 'rgba(57, 57, 57)',
          backgroundOpacity: 0.7,
          blur: 8
        }}
      >
        <NotificationsModal notifications={notifications} />
      </Modal>
      <Popover.Target>
        <button
          className={styles.container}
          onClick={() => {
            setIsDropdownOpened(!isDropdownOpened)
          }}
        >
          <IconBell className={styles.icon}/>
          {!smallView && <div className={styles.label}>Notifications</div>}
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
