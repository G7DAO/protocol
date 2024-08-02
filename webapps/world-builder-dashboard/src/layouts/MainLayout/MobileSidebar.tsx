import React from 'react'
import parentStyles from './MainLayout.module.css'
import styles from './MobileSidebar.module.css'
import IconMenu02 from '@/assets/IconMenu02'
import Game7Logo from '@/layouts/MainLayout/Game7Logo'

interface MobileSidebarProps {}
const MobileSidebar: React.FC<MobileSidebarProps> = ({}) => {
  return (
    <div className={styles.container}>
      <Game7Logo />
      <div className={styles.iconContainer}>
        <IconMenu02 className={parentStyles.iconButton} />
      </div>
    </div>
  )
}

export default MobileSidebar
