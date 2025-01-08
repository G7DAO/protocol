// LandingPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import AlliesSection from '@/components/landing/AlliesSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import Container from '@/components/landing/Container'
import MainSection from '@/components/landing/MainSection'
import Navbar from '@/components/landing/Navbar'
import NetworkEssentials from '@/components/landing/NetworksEssentials'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import backgroundImage from "@/assets/G7LandingPageBGDark.jpg";
import IconForkTheWorld from '@/assets/IconForkTheWorld'
import IconTelegram from '@/assets/IconTelegram'
import IconDiscord from '@/assets/IconDiscord'
import IconMail from '@/assets/IconMail'
import IconX from '@/assets/IconX'
import IconGitHub from '@/assets/IconGithub'
import IconLinkedIn from '@/assets/IconLinkedIn'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { setSelectedNetworkType } = useBlockchainContext()
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false)
  const smallView = useMediaQuery('(max-width: 750px)')
  const isLargeView = useMediaQuery('(min-width: 1440px)')

  const [backgroundStyle, setBackgroundStyle] = useState<string | undefined>();

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage as string;

    img.onload = () => {
      setBackgroundStyle(`#1b1b1b url(${backgroundImage}) 50% / cover no-repeat`);
    };
  }, []);

  const startBuilding = () => {
    setSelectedNetworkType('Testnet')
    navigate('/faucet')
  }

  const navigateLink = (item: any) => {
    if (item.name === 'Faucet') {
      setSelectedNetworkType('Testnet')
      navigate(`/${item.link}`)
    } else if (item.name === "Bridge") {
      setSelectedNetworkType('Mainnet')
      navigate(`/${item.link}`)
    } else {
      window.open(item.link, '_blank')
    }
  }

  const slides = [
    <MainSection key='main' smallView={!!smallView} startBuilding={startBuilding} />,
    <BenefitsSection key='benefits' />,
    <AlliesSection key='allies' />,
    <NetworkEssentials smallView={!!smallView} startBuilding={startBuilding} key='essentials' />
  ]

  return (
    <>
      {isLargeView ? (
        <>
          <Container
            components={slides}
            isNavbarOpen={navbarOpen}
            setIsNavbarOpen={setNavBarOpen}
            isSmallView={!!smallView}
            startBuilding={startBuilding}
            navigateLink={navigateLink}
          />
          <div className={styles.footer}>
            <div className={styles.footerContent}>
              <IconForkTheWorld />
              <div className={styles.footerLinks}>
                <div className={styles.footerSection}>
                  <div className={styles.footerSectionHeader}>
                    DevHub
                  </div>
                  <div className={styles.footerSectionLink}>
                    Faucet
                  </div>
                  <div className={styles.footerSectionLink}>
                    Bridge
                  </div>
                  <div className={styles.footerSectionLink}>
                    Documentation
                  </div>
                  <div className={styles.footerSectionLink}>
                    Explorer
                  </div>
                </div>
                <div className={styles.footerSection}>
                  <div className={styles.footerSectionHeader}>
                    Media
                  </div>
                  <div className={styles.footerSectionLink}>
                    Community
                  </div>
                  <div className={styles.footerSectionLink}>
                    Telegram
                  </div>
                </div>
                <div className={styles.footerSection}>
                  <div className={styles.footerSectionHeader}>
                    Legal
                  </div>
                  <div className={styles.footerSectionLink}>
                    Terms
                  </div>
                  <div className={styles.footerSectionLink}>
                    Privacy
                  </div>
                </div>
              </div>
              <div className={styles.footerIcons}>
                <IconTelegram />
                <IconDiscord />
                <IconMail />
                <IconX />
                <IconGitHub />
                <IconLinkedIn />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`${styles.layout} ${navbarOpen && styles.layoutBlur}`}>
          <Navbar
            navbarOpen={navbarOpen}
            smallView={!!smallView}
            setIsNavbarOpen={setNavBarOpen}
            startBuilding={startBuilding}
            navigateLink={navigateLink}
          />

          <div className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}`}
            style={backgroundStyle ? { background: backgroundStyle } : undefined}
          >
            <MainSection smallView={!!smallView} startBuilding={startBuilding} />
            <BenefitsSection />
            <AlliesSection />
            <NetworkEssentials smallView={!!smallView} startBuilding={startBuilding} />
          </div>

          {smallView && (
            <div className={styles.startBuildingCTA} onClick={startBuilding}>
              Start building
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default LandingPage
