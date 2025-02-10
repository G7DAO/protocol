// Navbar.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'

interface NavbarProps {
  navbarOpen: boolean
  smallView: boolean
  setIsNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>
  startBuilding: () => void
  navigateLink: (item: { name: string; link: string }) => void
  isContainer: boolean
  isSticky: boolean
}

const Navbar: React.FC<NavbarProps> = ({ isContainer, isSticky }) => {
  const navigate = useNavigate()
  return (
    <>
      <div className={`${styles.navbarContainer} 
        ${isContainer ? (isSticky ? styles.navbarStickyContainer : '') : (isSticky ? '' : styles.navbarStickyContainer)}`}
      >
        <div className={styles.navbar}>
          <div className={styles.logoWrapper} onClick={() => navigate('/')}>
            <IconGame7Logo />
            <IconGame7 />
          </div>
        </div>
      </div>

    </>
  )
}

export default Navbar
