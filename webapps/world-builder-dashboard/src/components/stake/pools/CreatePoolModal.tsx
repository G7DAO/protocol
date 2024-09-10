import React, { useEffect, useState } from 'react'
import styles from './CreatePoolModal.module.css'
import EditPoolModal from './EditPoolModal'
import { Modal, ModalProps } from 'summon-ui/mantine'
import { useBlockchainContext } from '@/contexts/BlockchainContext'

interface CreatePoolModalProps {}

const CreatePoolModal: React.FC<CreatePoolModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { connectedAccount } = useBlockchainContext()

  useEffect(() => {
    console.log(isOpen)
  }, [isOpen])

  return (
    <>
      <div
        className={styles.createPoolButton}
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Create Pool
      </div>
      {isOpen && (
        <Modal
          title='Create Pool'
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          onClick={(e) => {
            e.stopPropagation()
          }}
          radius={'12px'}
          padding={'24px'}
          size={'678px'}
          classNames={{ header: styles.header, body: styles.modal }}
          shadow='0px 20px 24px -4px rgba(16, 24, 40, 0.08) 0px 8px 8px -4px rgba(16, 24, 40, 0.03)'
        >
          <div className={styles.stepperContainer}>
            <div className={styles.stepper}>
              <div className={styles.step}>
                <div className={styles.stepText}>Details</div>
              </div>
              <div className={styles.stepLocked}>
                <div className={styles.stepTextLocked}>Tokens</div>
              </div>
              <div className={styles.stepLocked}>
                <div className={styles.stepTextLocked}>Settings</div>
              </div>
              <div className={styles.stepLocked}>
                <div className={styles.stepTextLocked}>Admin</div>
              </div>
            </div>
          </div>
          <div className={styles.inputRow}>
            <div className={styles.inputContainer}>
              <div className={styles.label}>Connected Wallet Address</div>
              <input className={styles.addressText} placeholder={connectedAccount} />
            </div>
            <div className={styles.inputContainer}>
              <div className={styles.label}>Pool Creator</div>
              <div className={styles.addressText}>{connectedAccount}</div>
            </div>
          </div>
          {/* Make component out of this in the future */}
          <div className={styles.inputContainer}>
            <div className={styles.label}>Pool Name</div>
            <input className={styles.addressText} placeholder={'Pool 0'} />
          </div>
          <div className={styles.inputFieldContainer}>
            <div className={styles.label}>Description</div>
            <textarea className={styles.inputField} placeholder={connectedAccount} />
          </div>
        </Modal>
      )}
    </>
  )
}

export default CreatePoolModal
