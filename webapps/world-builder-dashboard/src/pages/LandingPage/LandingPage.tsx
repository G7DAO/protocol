import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import ArbitrumLogo from '@/assets/ArbitrumLogo'
import ConduitLogo from '@/assets/ConduitLogo'
import HyperPlayLogo from '@/assets/HyperPlayLogo'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'
import IconHamburgerLanding from '@/assets/IconHamburgerLanding'
import SummonLogo from '@/assets/SummonLogo'
import SummonTextLogo from '@/assets/SummonTextLogo'

interface LandingPageProps { }

const LandingPage: React.FC<LandingPageProps> = () => {
  const NAVBAR_ITEMS = [
    { name: 'Home', link: '/' },
    { name: 'Faucet', link: 'faucet' },
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
  const mediumView = useMediaQuery('(max-width: 1199px)')
  const totalSections = 4
  const maxThreshold = 750
  const networkCardsRef = useRef<HTMLDivElement>(null)

  const handleScroll = (event: { deltaY: number }) => {
    const deltaY = event.deltaY
    let newScrollThreshold = scrollThreshold + deltaY
    const scrollAmount = Math.min(Math.abs(deltaY), maxThreshold) * Math.sign(deltaY)

    if (currentSectionIndex === 0 && newScrollThreshold < 0) {
      newScrollThreshold = 0
    } else if (currentSectionIndex === totalSections - 1 && newScrollThreshold >= maxThreshold) {
      newScrollThreshold = maxThreshold
    } else {
      newScrollThreshold = scrollThreshold + scrollAmount
    }
    setScrollThreshold(newScrollThreshold)

    const networkCardsContainer = networkCardsRef.current
    if (networkCardsContainer) {
      const maxScrollLeft = networkCardsContainer.scrollWidth - networkCardsContainer.clientWidth

      const newScrollLeft = Math.min(networkCardsContainer.scrollLeft + scrollAmount, maxScrollLeft)

      networkCardsContainer.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }

    if (newScrollThreshold > maxThreshold + 250 && currentSectionIndex < totalSections - 1) {
      setScrollThreshold(0)
      setCurrentSectionIndex((prevIndex) => Math.min(prevIndex + 1, totalSections - 1))
    } else if (newScrollThreshold < 0) {
      if (scrollThreshold > 0) {
        setScrollThreshold(0)
      } else if (currentSectionIndex > 0) {
        setScrollThreshold(maxThreshold)
        setCurrentSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0))
      }
    }
  }

  useEffect(() => {
    const handleScrollEvents = (event: WheelEvent | KeyboardEvent | TouchEvent) => {
      if (navbarOpen) return

      let deltaY = 0

      if ('deltaY' in event) {
        deltaY = event.deltaY
        handleScroll({ deltaY: deltaY })
      }

      if ('key' in event) {
        if (event.key === 'ArrowUp') {
          deltaY = -maxThreshold
        } else if (event.key === 'ArrowDown') {
          deltaY = maxThreshold
        }
        handleScroll({ deltaY })
      }
    }

    window.addEventListener('wheel', handleScrollEvents)
    window.addEventListener('keydown', handleScrollEvents)

    return () => {
      window.removeEventListener('wheel', handleScrollEvents)
      window.removeEventListener('keydown', handleScrollEvents)
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
          </div>
        )}

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
        {!smallView && !mediumView && (
          <div
            className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}
            ${(currentSectionIndex === 1 || currentSectionIndex === 2 || currentSectionIndex === 3) && (smallView || mediumView) ? styles.mainLayoutStart : ''}`}
          >
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
                    <div
                      className={styles.learnMoreCTA}
                      onClick={() =>
                        window.open(
                          'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/introducing-the-g7-network/world-builder',
                          '_blank'
                        )
                      }
                    >
                      Learn more
                    </div>
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
                    <div className={styles.cardTitle}>Build for gamers</div>
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
                    <div className={styles.cardDescription}>Access World Builder’s powerful developer tools</div>
                  </div>
                </div>
                {!smallView ? (
                  <div className={styles.ctaContainer}>
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
                </div>
                {!smallView ? (
                  <div className={styles.ctaContainer}>
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
                <div ref={networkCardsRef} className={styles.networkEssentialCards}>
                  <div className={styles.networkEssentialCard} onClick={() => navigate('/faucet')}>
                    <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialFaucet}`} />
                    <div className={styles.networkEssentialCardText}>
                      <div className={styles.networkEssentialCardTitle}>Faucet</div>
                      <div className={styles.networkEssentialCardDescription}>
                        Get testnet tokens to start building on G7 Sepolia
                      </div>
                    </div>
                  </div>
                  <div
                    className={styles.networkEssentialCard}
                    onClick={() => window.open('https://testnet.game7.io/', '_blank')}
                  >
                    <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialExplorer}`} />
                    <div className={styles.networkEssentialCardText}>
                      <div className={styles.networkEssentialCardTitle}>Block explorer</div>
                      <div className={styles.networkEssentialCardDescription}>
                        Track and interact directly with your smart contracts
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
                        Get more information about building in the G7 Nation
                      </div>
                    </div>
                  </div>
                  <div
                    className={styles.networkEssentialCard}
                    onClick={() => window.open('https://discord.com/invite/g7dao', '_blank')}
                  >
                    <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialDiscord}`} />
                    <div className={styles.networkEssentialCardText}>
                      <div className={styles.networkEssentialCardTitle}>Discord</div>
                      <div className={styles.networkEssentialCardDescription}>Join our community of builders on Discord</div>
                    </div>
                  </div>
                </div>
                {!smallView ? (
                  <div className={styles.ctaContainer}>
                    <div className={styles.startBuildingCTA} onClick={startBuilding}>
                      Start building
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            )}
            {!smallView && !mediumView && (
              <div className={styles.scrollbarContainer}>
                {[...Array(totalSections)].map((_, index) => (
                  <div key={index} className={styles.scrollBar}>
                    <div style={getScrollBarFillStyle(index)} className={styles.scrollBarFill} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(smallView || mediumView) && (
          <div className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}`}>
            {/* Main */}
            <div>
              <div className={styles.firstSection}>
                <div className={styles.contentContainer}>
                  <div className={styles.pill}>DEVHUB</div>
                  <div className={styles.titleContainer}>
                    <div className={styles.titleText}>COME BUILD YOUR GAME</div>
                    <div className={styles.subtitleText}>Be a part of the future of gaming</div>
                  </div>
                </div>
              </div>
            </div>
            {/* G7 Benefits */}
            <div className={styles.secondSection}>
              <div className={styles.contentContainer}>
                <div className={styles.sectionTitle}> Get all benefits of the G7 Nation</div>
                <div className={styles.cards}>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Build for gamers</div>
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
                    <div className={styles.cardDescription}>Access World Builder’s powerful developer tools</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Nation Allies */}
            <div className={styles.thirdSection}>
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
                </div>
              </div>
            </div>

            {/* Network Essential Cards */}
            <div className={styles.contentContainer}>
              <div className={styles.sectionTitle}>Start building with the network essentials</div>
              <div className={styles.networkEssentialCards}>
                <div className={styles.networkEssentialCard} onClick={() => navigate('/faucet')}>
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialFaucet}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Faucet</div>
                    <div className={styles.networkEssentialCardDescription}>
                      Get testnet tokens to start building on G7 Sepolia
                    </div>
                  </div>
                </div>
                <div
                  className={styles.networkEssentialCard}
                  onClick={() => window.open('https://testnet.game7.io/', '_blank')}
                >
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialExplorer}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Block explorer</div>
                    <div className={styles.networkEssentialCardDescription}>
                      Track and interact directly with your smart contracts
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
                      Get more information about building in the G7 Nation
                    </div>
                  </div>
                </div>
                <div
                  className={styles.networkEssentialCard}
                  onClick={() => window.open('https://discord.com/invite/g7dao', '_blank')}
                >
                  <div className={`${styles.networkEssentialCardImage} ${styles.networkEssentialDiscord}`} />
                  <div className={styles.networkEssentialCardText}>
                    <div className={styles.networkEssentialCardTitle}>Discord</div>
                    <div className={styles.networkEssentialCardDescription}>Join our community of builders on Discord</div>
                  </div>
                </div>
              </div>
            </div>
            {!smallView && !mediumView && (
              <div className={styles.scrollbarContainer}>
                {[...Array(totalSections)].map((_, index) => (
                  <div key={index} className={styles.scrollBar}>
                    <div style={getScrollBarFillStyle(index)} className={styles.scrollBarFill} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
