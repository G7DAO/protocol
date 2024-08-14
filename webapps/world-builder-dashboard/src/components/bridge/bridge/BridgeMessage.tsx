import React, { useState } from 'react'
import styles from './BridgeMessage.module.css'
import { ethers } from 'ethers'
import { Tooltip } from 'summon-ui/mantine'
import IconInfoCircle from '@/assets/IconInfoCircle'
import IconPlus from '@/assets/IconPlus'

interface BridgeMessageProps {
  message: { destination: string; data: string }
  setMessage: (arg0: { destination?: string; data?: string }) => void
  errors: { data: string; destination: string }
  setErrors: (arg0: { data?: string; destination?: string }) => void
}
const BridgeMessage: React.FC<BridgeMessageProps> = ({ message, setMessage, errors, setErrors }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newData = e.target.value
    if (!newData || /^0x[0-9a-fA-F]+$/.test(newData)) {
      setErrors({ data: '' })
    } else {
      setErrors({ data: '0x-prefixed hex string is expected' })
    }
    setMessage({ data: newData })
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDestination = e.target.value
    if (!newDestination || ethers.utils.isAddress(newDestination)) {
      setErrors({ destination: '' })
    } else {
      setErrors({ destination: 'invalid address' })
    }
    setMessage({ data: newDestination })
  }

  return (
    <div className={styles.container}>
      <div className={styles.button} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.buttonLabel}>
          <IconPlus className={isExpanded ? styles.iconRotated : styles.icon} />
          <div>Add message</div>
        </div>
        <Tooltip
          arrowSize={8}
          radius={'8px'}
          label={'Send a data message to a contract or address on a destination chain'}
          withArrow
        >
          <IconInfoCircle />
        </Tooltip>
      </div>
      {isExpanded && (
        <div className={styles.expandedContainer}>
          <div className={styles.messageContainer}>
            <div className={styles.messageHeader}>
              Message <div className={styles.errorMessage}>{errors.data}</div>
            </div>
            <textarea
              className={`${errors.data ? styles.inputError : ''}  ${styles.messageInput}`}
              placeholder={'Add message'}
              value={message.data}
              onChange={handleDataChange}
            />
            <div className={styles.messageHeader}>
              Address
              <div className={styles.errorMessage}>{errors.destination}</div>
            </div>
            <input
              type={'text'}
              className={`${errors.destination ? styles.inputError : ''}  ${styles.addressInput}`}
              placeholder={'Enter destination address'}
              value={message.destination}
              onChange={handleAddressChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default BridgeMessage
