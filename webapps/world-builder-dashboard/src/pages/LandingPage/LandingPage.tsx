import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import ArbitrumLogo from '@/assets/ArbitrumLogo'
import ConduitLogo from '@/assets/ConduitLogo'
import HyperPlayLogo from '@/assets/HyperPlayLogo'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'
import IconHamburgerLanding from '@/assets/IconHamburgerLanding'
import MarketWarsLogo from '@/assets/MarketWarsLogo'
import SummonLogo from '@/assets/SummonLogo'
import SummonTextLogo from '@/assets/SummonTextLogo'

interface LandingPageProps { }

const LandingPage: React.FC<LandingPageProps> = () => {
  const NAVBAR_ITEMS = [
    { name: 'Home', link: '/' },
    { name: 'Faucet', link: 'faucet' },
    { name: 'Bridge', link: 'bridge' },
    { name: 'Community', link: 'https://discord.com/invite/g7dao' },
    {
      name: 'Docs',
      link: 'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/introducing-the-g7-network/world-builder'
    }
  ]
  const navigate = useNavigate()
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const [scrollThreshold, setScrollThreshold] = useState(0)
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false)
  const smallView = useMediaQuery('(max-width: 750px)')
  const totalSections = 4
  const maxThreshold = 1000

  const handleScroll = (event: { deltaY: number }) => {
    const deltaY = event.deltaY
    let newScrollThreshold = scrollThreshold + deltaY
    const scrollAmount = Math.min(Math.abs(deltaY), maxThreshold / 2) * Math.sign(deltaY)


    if (currentSectionIndex === 0 && newScrollThreshold < 0) {
      newScrollThreshold = 0
    } else if (currentSectionIndex === totalSections - 1 && newScrollThreshold >= maxThreshold) {
      newScrollThreshold = maxThreshold
    } else {
      newScrollThreshold = scrollThreshold + scrollAmount
    }
    setScrollThreshold(newScrollThreshold)

    if (newScrollThreshold > maxThreshold && currentSectionIndex < totalSections - 1) {
      setScrollThreshold(0)
      setCurrentSectionIndex((prevIndex) => prevIndex + 1)
    } else if (newScrollThreshold < 0) {
      if (scrollThreshold > 0) {
        setScrollThreshold(0)
      } else if (currentSectionIndex > 0) {
        setScrollThreshold(maxThreshold)
        setCurrentSectionIndex((prevIndex) => prevIndex - 1)
      }
    }
  }

  useEffect(() => {
    let startY = 0
    let accumulatedDeltaY = 0

    let isTouching = false // New flag to track touch activity

    const handleScrollEvents = (event: WheelEvent | KeyboardEvent | TouchEvent) => {
      if (navbarOpen) return;

      let deltaY = 0

      if ('deltaY' in event) {
        deltaY = event.deltaY
        handleScroll({ deltaY })
      }

      if ('key' in event) {
        if (event.key === 'ArrowUp') {
          deltaY = -100
        } else if (event.key === 'ArrowDown') {
          deltaY = 100
        }
        handleScroll({ deltaY })
      }

      if (event.type === 'touchstart' && 'touches' in event) {
        isTouching = true
        startY = event.touches[0].clientY
        accumulatedDeltaY = 0
      }

      if (event.type === 'touchmove' && 'touches' in event) {
        if (!isTouching) return
        const touchY = event.touches[0].clientY
        deltaY = (startY - touchY)
        accumulatedDeltaY += deltaY
        startY = touchY
      }

      if (event.type === 'touchend') {
        if (!isTouching) return
        isTouching = false

        if (accumulatedDeltaY > 50) {
          handleScroll({ deltaY: maxThreshold / 2 })
        } else if (accumulatedDeltaY < -50) {
          handleScroll({ deltaY: -maxThreshold / 2 })
        }

        accumulatedDeltaY = 0 // Reset after touch end
      }
    }

    window.addEventListener('wheel', handleScrollEvents)
    window.addEventListener('keydown', handleScrollEvents)
    window.addEventListener('touchstart', handleScrollEvents)
    window.addEventListener('touchmove', handleScrollEvents)
    window.addEventListener('touchend', handleScrollEvents)

    return () => {
      window.removeEventListener('wheel', handleScrollEvents)
      window.removeEventListener('keydown', handleScrollEvents)
      window.removeEventListener('touchstart', handleScrollEvents)
      window.removeEventListener('touchmove', handleScrollEvents)
      window.addEventListener('touchend', handleScrollEvents)
    }
  }, [scrollThreshold, currentSectionIndex, navbarOpen])

  const getScrollBarFillStyle = (index: number) => {
    if (index < currentSectionIndex) {
      return {
        height: '100%',
        backgroundColor: '#F04438',
        borderRadius: '100px',
        transition: 'height 0.4s ease-in-out'
      }
    }
    if (index === currentSectionIndex) {
      const fillPercentage = Math.min(Math.abs(scrollThreshold / maxThreshold), 1) * 100
      return {
        height: `${fillPercentage}%`,
        backgroundColor: '#F04438',
        borderRadius: '100px',
        transition: 'height 0.25s ease-in-out'
      }
    }
    return {
      height: '0%',
      backgroundColor: '#F04438',
      borderRadius: '100px',
      transition: 'height 0.25s ease-in-out'
    }
  }

  const startBuilding = () => {
    navigate('/faucet')
  }

  const navigateLink = (item: any) => {
    item.name !== 'Docs' && item.name !== 'Community' ? navigate(`/${item.link}`) : window.open(item.link, '_blank')
  }

  return (
    <>
      <div className={`${styles.layout} ${navbarOpen && styles.layoutBlur}`}>
        {/* NAVBAR */}
        {!navbarOpen && (
          <div className={styles.navbarContainer}>
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
                        className={item.name === 'Home' ? styles.navbarItemHome : styles.navbarItem}
                        onClick={() => navigateLink(item)}
                      >
                        {item.name}
                      </div>
                    ))}
                    <div className={styles.navbarCTA} onClick={startBuilding}>
                      Start building
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.navbarItem}>
                      <IconHamburgerLanding onClick={() => setNavBarOpen(!navbarOpen)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>)}

        {navbarOpen && smallView && (
          <>
            <div className={styles.navbarContainer}>
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
                          className={item.name === 'Home' ? styles.navbarItemHome : styles.navbarItem}
                          onClick={() => navigateLink(item)}
                        >
                          {item.name}
                        </div>
                      ))}
                      <div className={styles.navbarCTA} onClick={startBuilding}>
                        Start building
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.navbarItem}>
                        <IconHamburgerLanding onClick={() => setNavBarOpen(!navbarOpen)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
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
                <div className={styles.startBuildingCTA} onClick={startBuilding}>
                  Start building
                </div>
              </div>
            </div>
          </>
        )}
        {/* MAIN LAYOUT */}
        <div className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}`}>
          {/* Main */}
          {currentSectionIndex === 0 && (
            <div className={styles.contentContainer}>
              <div className={styles.pill}>DEVHUB</div>
              <div className={styles.titleContainer}>
                <div className={styles.titleText}>COME BUILD YOUR GAME</div>
                <div className={styles.subtitleText}>Be a part of the future of gaming</div>
              </div>
              {!smallView ? (
                <div className={styles.ctaContainer}>
                  <div className={styles.learnMoreCTA}>Learn more</div>
                  <div className={styles.startBuildingCTA} onClick={startBuilding}>
                    Start building
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          )}

          {/* G7 Benefits */}
          {currentSectionIndex === 1 && (
            <div className={styles.contentContainer}>
              <div className={styles.sectionTitle}> Get all benefits of the G7 Nation</div>
              <div className={styles.cards}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Build for Gamers</div>
                  <div className={`${styles.cardImage} ${styles.cardImageGamers}`} />
                  <div className={styles.cardDescription}>
                    Bootstrap your game with access to 250k+ citizens and counting
                  </div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Fast and efficient</div>
                  <div className={`${styles.cardImage} ${styles.cardImageLightningQuick}`} />
                  <div className={styles.cardDescription}>Lighting-quick transactions and low cost fees</div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Special economic zone</div>
                  <div className={`${styles.cardImage} ${styles.cardImageSpecialEcon}`} />
                  <div className={styles.cardDescription}>Gain free access to powerful tools as they are released</div>
                </div>
              </div>
              {!smallView ? (
                <div className={styles.ctaContainer}>
                  <div className={styles.learnMoreCTA}>Learn more</div>
                  <div className={styles.startBuildingCTA} onClick={startBuilding}>
                    Start building
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          )}

          {/* Nation Allies */}
          {currentSectionIndex === 2 && (
            <div className={styles.contentContainer}>
              <div className={styles.sectionTitle}> G7 Nation allies </div>
              <div className={styles.sponsorCards}>
                <div className={styles.sponsorCard}>
                  <div className={styles.sponsorCardImage}>
                    <HyperPlayLogo />
                  </div>
                </div>
                <div className={styles.sponsorCard}>
                  <div className={styles.sponsorCardImage}>
                    <div className={styles.summonLogoContainer}>
                      <SummonLogo />
                      <SummonTextLogo />
                    </div>
                  </div>
                </div>
                <div className={styles.sponsorCard}>
                  <div className={styles.sponsorCardImage}>
                    <ArbitrumLogo />
                  </div>
                </div>
                <div className={styles.sponsorCard}>
                  <div className={styles.sponsorCardImage}>
                    <ConduitLogo />
                  </div>
                </div>
                <MarketWarsLogo />
              </div>
              {!smallView ? (
                <div className={styles.ctaContainer}>
                  <div className={styles.learnMoreCTA}>Learn more</div>
                  <div className={styles.startBuildingCTA} onClick={startBuilding}>
                    Start building
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          )}

          {/* Network Essential Cards */}
          {currentSectionIndex === 3 && (
            <div className={styles.contentContainer}>
              <div className={styles.sectionTitle}>Start building with the network essentials</div>
              <div className={styles.networkEssentialCards}>
                <div className={styles.networkEssentialCard} onClick={() => navigate('/faucet')}>
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialFaucet}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Faucet</div>
                    <div className={styles.networkEssentialCardDescription}>
                      Get testnet tokens to start building on G7 testnet
                    </div>
                  </div>
                </div>
                <div className={styles.networkEssentialCard} onClick={() => navigate('/bridge')}>
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialBridge}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Bridge</div>
                    <div className={styles.networkEssentialCardDescription}>
                      Bridge tokens between Ethereum, Arbitrum and the G7 network
                    </div>
                  </div>
                </div>
                <div
                  className={styles.networkEssentialCard}
                  onClick={() => window.open('https://testnet.game7.io/', '_blank')}
                >
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialExplorer}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Explorer</div>
                    <div className={styles.networkEssentialCardDescription}>
                      G7 Network block explorer powered by Blockscout. Track and interact directly with your smart
                      contracts
                    </div>
                  </div>
                </div>
                <div
                  className={styles.networkEssentialCard}
                  onClick={() =>
                    window.open(
                      'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/introducing-the-g7-network/world-builder',
                      '_blank'
                    )
                  }
                >
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialDocs}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Docs</div>
                    <div className={styles.networkEssentialCardDescription}>
                      Get more information about building in the G7 nation
                    </div>
                  </div>
                </div>
              </div>
              {!smallView ? (
                <div className={styles.ctaContainer}>
                  <div className={styles.learnMoreCTA}>Learn more</div>
                  <div className={styles.startBuildingCTA} onClick={startBuilding}>
                    Start building
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          )}
          <div className={styles.scrollbarContainer}>
            {[...Array(totalSections)].map((_, index) => (
              <div key={index} className={styles.scrollBar}>
                <div style={getScrollBarFillStyle(index)} className={styles.scrollBarFill} />
              </div>
            ))}
          </div>
        </div>
        {smallView ? (
          <div className={styles.startBuildingCTA} onClick={startBuilding}>
            Start building
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  )
}

export default LandingPage
