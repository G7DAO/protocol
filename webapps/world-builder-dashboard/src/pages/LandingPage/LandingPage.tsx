import React, { useEffect, useState } from 'react'
import styles from './LandingPage.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'

interface LandingPageProps {}

const LandingPage: React.FC<LandingPageProps> = () => {
  const NAVBAR_ITEMS = ['Home', 'Faucet', 'Bridge', 'Community', 'Docs']
  const [scrollPosition, setScrollPosition] = useState<number>(0)
  const threshold = 200

  const handleScroll = () => {
    const position = window.scrollY
    console.log(position)
    setScrollPosition(position)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)

    if (scrollPosition >= threshold) {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrollPosition])

  return (
    <>
      <div className={styles.layout}>
        {/* NAVBAR */}
        <div className={styles.navbarContainer}>
          <div className={styles.navbar}>
            <div className={styles.logoWrapper}>
              <IconGame7Logo />
              <IconGame7 />
            </div>
            <div className={styles.navbarItemsContainer}>
              <div className={styles.navbarItems}>
                {NAVBAR_ITEMS.map((item) => (
                  <div className={item === 'Home' ? styles.navbarItemHome : styles.navbarItem}>{item}</div>
                ))}
                <div className={styles.navbarCTA}>Start building</div>
              </div>
            </div>
          </div>
        </div>
        {/* MAIN LAYOUT */}
        <div className={styles.mainLayout}>
          {/* First page */}
          <div className={styles.pill}>DEVHUB</div>
          <div className={styles.titleContainer}>
            <div className={styles.titleText}>COME BUILD YOUR GAME</div>
            <div className={styles.subtitleText}>Be a part of the future of gaming</div>
          </div>
          <div className={styles.ctaContainer}>
            <div className={styles.learnMoreCTA}>Learn more</div>
            <div className={styles.startBuildingCTA}>Start building</div>
          </div>
        </div>
        {/* Second page */}
        <div className={styles.benefitsLayout}>
          <div className={styles.cardsContainer}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Build for Gamers</div>
              <div className={styles.cardDescription}>
                Bootstrap your game with access to 250k+ citizens and counting
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LandingPage
