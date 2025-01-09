// LandingPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LegalPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import Navbar from '@/components/landing/Navbar'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Footer from '@/components/landing/Footer'

interface LegalPageProps {
  legalContent: any
}

const LandingPage: React.FC<LegalPageProps> = ({legalContent}) => {
  const navigate = useNavigate()
  const { setSelectedNetworkType } = useBlockchainContext()
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false)
  const smallView = useMediaQuery('(max-width: 750px)')



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


  return (
    <>
      <div className={styles.container}>
        <div className={styles.viewContainer}>
          <div className={`${styles.layout} ${navbarOpen && styles.layoutBlur}`}>
            <Navbar
              navbarOpen={navbarOpen}
              smallView={!!smallView}
              setIsNavbarOpen={setNavBarOpen}
              startBuilding={startBuilding}
              navigateLink={navigateLink}
              isSticky={true}
            />
            {/* <div className={styles.mainLayout}> */}
            <div className={styles.legalHeader}>
              <div className={styles.headerContainer}>
                <div className={styles.titleHeader}>
                  {legalContent.title}
                </div>
                <div className={styles.lastUpdated}>
                  Last updated: {legalContent.lastUpdated}
                </div>
              </div>
            </div>
            <div className={styles.legalMain}>
              {legalContent.sections.map((section: any, index: number) => (
                <div key={index} className={styles.legalSection}>
                  <div className={styles.legalTitle}>
                    {section.title}
                  </div>
                  <div className={styles.legalContent}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ width: 'calc(100% + 24px)' }}>
              <Footer />
            </div>
          </div>
        </div>
      </div>
      {/* </div> */}
    </>
  )
}

export default LandingPage
