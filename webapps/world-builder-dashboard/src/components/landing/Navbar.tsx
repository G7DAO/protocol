// Navbar.tsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Landing.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'
import IconHamburgerLanding from '@/assets/IconHamburgerLanding'

interface NavbarProps {
  navbarOpen: boolean
  smallView: boolean
  setIsNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>
  startBuilding: () => void
  navigateLink: (item: { name: string; link: string }) => void
  isContainer: boolean
  isSticky: boolean
}

const NAVBAR_ITEMS = [
  { name: 'Home', link: '/' },
  { name: 'Faucet', link: 'faucet' },
  { name: 'Bridge', link: 'relay' },
  { name: 'Community', link: 'https://discord.com/invite/g7dao' },
  {
    name: 'Docs',
    link: 'https://docs.game7.io/'
  }
]

const Navbar: React.FC<NavbarProps> = ({ navbarOpen, smallView, setIsNavbarOpen, startBuilding, navigateLink, isContainer, isSticky }) => {
  const navigate = useNavigate()
  const location = useLocation()
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
          <div className={styles.navbarItemsContainer}>
            {!smallView ? (
              <div className={styles.navbarItems}>
                {NAVBAR_ITEMS.map((item, index) => (
                  <div
                    key={index}
                    className={((location.pathname === '/' || location.pathname === '') && item.name === 'Home') ? styles.navbarItemHome : styles.navbarItem}
                    onClick={() => {
                      navigateLink(item)
                    }}
                  >
                    {item.name}
                  </div>
                ))}
                <div className={styles.navbarCTA} onClick={startBuilding}>
                  Start building
                </div>
              </div>
            ) : (
              <div className={styles.navbarItem}>
                <IconHamburgerLanding onClick={() => setIsNavbarOpen(!navbarOpen)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Navbar for small view */}
      {navbarOpen && smallView && (
        <div className={styles.navContainer}>
          {NAVBAR_ITEMS.map((item, index) => (
            <div
              key={index}
              className={item.name === 'Home' ? styles.navItemHome : styles.navItem}
              onClick={() => navigateLink(item)}
            >
              {item.name}
            </div>
          ))}
          <div className={styles.ctaContainer}>
            <div className={styles.navbarCTA} onClick={startBuilding}>
              Start building
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
