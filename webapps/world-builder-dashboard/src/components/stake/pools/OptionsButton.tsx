import React, { useEffect, useState } from 'react'
import EditPoolModal from './EditPoolModal'
import styles from './OptionsButton.module.css'
import IconThreeDots from '@/assets/IconThreeDots'

interface OptionsButtonProps {
  onViewPositions: () => void
  poolData: {
    poolId: string
    transferable: boolean
    cooldownSeconds: string
    lockupSeconds: string
  }
  toggleDropdown: (clickedPoolId: number) => void
  clickedPool: number | null
}

const OptionsButton: React.FC<OptionsButtonProps> = ({ onViewPositions, poolData, toggleDropdown, clickedPool }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (clickedPool === Number(poolData.poolId)) setIsOpen(true)
    else setIsOpen(false)
  }, [clickedPool])

  const handleOptionClick = (option: string) => {
    if (option === 'View Positions') {
      onViewPositions()
    } else if (option === 'Edit Pool') {
      setIsModalOpen(!isModalOpen)
    }
    setIsOpen(false)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <div
      onClick={() => {
        toggleDropdown(Number(poolData.poolId))
      }}
    >
      <IconThreeDots />
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownItem} onClick={() => handleOptionClick('View Positions')}>
            View Positions
          </div>
          <div className={styles.dropdownItem} onClick={() => handleOptionClick('Edit Pool')}>
            Edit Pool
          </div>
        </div>
      )}
      {isModalOpen && <EditPoolModal opened={isModalOpen} onClose={handleModalClose} poolData={poolData} />}
    </div>
  )
}

export default OptionsButton
