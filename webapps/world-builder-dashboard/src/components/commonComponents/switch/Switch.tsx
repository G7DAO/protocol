import React from 'react'
import styles from './Switch.module.css'

interface SwitchProps {
  checked: boolean
  onToggle: () => void
}
const Switch: React.FC<SwitchProps> = ({ checked, onToggle }) => {
  return (
    <div className={checked ? styles.containerOn : styles.containerOff} onClick={onToggle}>
      <div className={checked ? styles.thumbOn : styles.thumbOff} />
    </div>
  )
}

export default Switch
