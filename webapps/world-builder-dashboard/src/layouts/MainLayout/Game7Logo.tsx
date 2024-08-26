import React from 'react'
import styles from './MainLayout.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'

interface LogoProps {}
const Game7Logo: React.FC<LogoProps> = ({}) => {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logoWrapper}>
        <IconGame7Logo />
        <IconGame7 />
      </div>
    </div>
  )
}

export default Game7Logo
