// LandingPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LegalPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import Navbar from '@/components/landing/Navbar'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import Footer from '@/components/landing/Footer'

const LandingPage: React.FC = () => {
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
            <div className={styles.mainLayout}>
              <div className={styles.legalHeader}>
                <div className={styles.headerContainer}>
                  <div className={styles.titleHeader}>
                    Terms & Conditions
                  </div>
                  <div className={styles.lastUpdated}>
                    Last updated:
                  </div>
                </div>
              </div>
              <div className={styles.legalMain}>
                <div className={styles.legalSection}>
                  <div className={styles.legalTitle}>
                    First
                  </div>
                  <div className={styles.legalContent}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Maecenas vitae mattis tellus. Nullam quis imperdiet augue. Vestibulum auctor ornare leo, non suscipit magna interdum eu. Curabitur pellentesque nibh nibh, at maximus ante fermentum sit amet. Pellentesque commodo lacus at sodales sodales. Quisque sagittis orci ut diam condimentum, vel euismod erat placerat. In iaculis arcu eros, eget tempus orci facilisis id.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi.
                  </div>
                </div>
                <div className={styles.legalSection}>
                  <div className={styles.legalTitle}>
                    First
                  </div>
                  <div className={styles.legalContent}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Maecenas vitae mattis tellus. Nullam quis imperdiet augue. Vestibulum auctor ornare leo, non suscipit magna interdum eu. Curabitur pellentesque nibh nibh, at maximus ante fermentum sit amet. Pellentesque commodo lacus at sodales sodales. Quisque sagittis orci ut diam condimentum, vel euismod erat placerat. In iaculis arcu eros, eget tempus orci facilisis id.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi.
                  </div>
                </div>
                <div className={styles.legalSection}>
                  <div className={styles.legalTitle}>
                    First
                  </div>
                  <div className={styles.legalContent}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Maecenas vitae mattis tellus. Nullam quis imperdiet augue. Vestibulum auctor ornare leo, non suscipit magna interdum eu. Curabitur pellentesque nibh nibh, at maximus ante fermentum sit amet. Pellentesque commodo lacus at sodales sodales. Quisque sagittis orci ut diam condimentum, vel euismod erat placerat. In iaculis arcu eros, eget tempus orci facilisis id.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi.
                  </div>
                </div>
              </div>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LandingPage
