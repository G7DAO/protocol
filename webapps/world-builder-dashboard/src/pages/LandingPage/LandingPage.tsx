import React, { useState } from 'react'
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
    { name: 'Community', link: 'https://discord.com/invite/g7dao' },
    {
      name: 'Docs',
      link: 'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/introducing-the-g7-network/world-builder'
    }
  ]
  const navigate = useNavigate()
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false)
  const smallView = useMediaQuery('(max-width: 750px)')
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
        {(
          <div className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}`}>
            {/* Main */}
            <div>
              <div className={styles.firstSection}>
                <div className={styles.contentContainer}>
                  <div className={styles.pill}>DEVHUB</div>
                  <div className={styles.titleContainer}>
                    <div className={styles.titleText}>COME BUILD <br /> YOUR GAME</div>
                    <div className={styles.subtitleText}>Be a part of the future of gaming</div>
                  </div>
                  {!smallView && (<div className={styles.ctaContainer}>
                    <div className={styles.learnMoreCTA} onClick={() => window.open(
                      'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/introducing-the-g7-network/world-builder',
                      '_blank'
                    )}>
                      Learn more
                    </div>
                    <div className={styles.startBuildingCTA} onClick={startBuilding}>
                      Start building
                    </div>
                  </div>)}
                </div>
              </div>
            </div>
            {/* G7 Benefits */}
            <div className={styles.secondSection}>
              <div className={styles.contentContainer}>
                <div className={styles.sectionTitle}> Get all benefits of the G7 Network</div>
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
                  <div className={styles.sponsorCard}>
                    <div className={styles.sponsorCardImage}>
                      <MarketWarsLogo />
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
                      Get more information about building in the G7 Network
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
                    <div className={styles.networkEssentialCardDescription}>
                      Join our community of builders on Discord
                    </div>
                  </div>
                </div>
              </div>
              {!smallView && (<div className={styles.startBuildingCTA} onClick={startBuilding}>
                Start building
              </div>)}
            </div>
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
