import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MainLayout.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'

interface LogoProps {}
const Game7Logo: React.FC<LogoProps> = ({}) => {
  const navigate = useNavigate()
  return (
    <div className={styles.logoContainer} onClick={() => navigate('/')}>
      <div className={styles.logoWrapper}>
        <IconGame7Logo />
        <IconGame7 />
      </div>
    </div>
  )
}

export default Game7Logo
