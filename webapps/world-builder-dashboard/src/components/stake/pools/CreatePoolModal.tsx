import React, { useEffect, useState } from 'react'
import styles from './CreatePoolModal.module.css'
import EditPoolModal from './EditPoolModal'
import { Modal, ModalProps } from 'summon-ui/mantine'

interface CreatePoolModalProps {}

const CreatePoolModal: React.FC<CreatePoolModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false)

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
          <div className={styles.stepper}>
            <div className={styles.step}>
              <div className={styles.stepText}>Details</div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepText}>Tokens</div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepText}>Settings</div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepText}>Admin</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CreatePoolModal
