import React from 'react'
import { HyperPlayLogo, SummonLogo, SummonTextLogo, ArbitrumLogo, ConduitLogo, MarketWarsLogo } from '../../assets'
import styles from './Landing.module.css'

const allies = [
  {
    logo: <HyperPlayLogo />,
    link: 'https://www.hyperplay.xyz/'
  },
  {
    logo: (
      <>
        <SummonLogo /> <SummonTextLogo />
      </>
    ),
    link: 'https://summon.xyz/'
  },
  {
    logo: <ArbitrumLogo />,
    link: 'https://arbitrum.io/'
  },
  {
    logo: <ConduitLogo />,
    link: 'https://www.conduit.xyz/'
  },
  {
    logo: <MarketWarsLogo />,
    link: 'https://www.marketwars.com/'
  }
]

const AlliesSection: React.FC = () => {
  return (
    <div className={styles.thirdSection}>
      <div className={styles.contentContainer}>
        <div className={styles.sectionTitle}>G7 Network allies</div>
        <div className={styles.sponsorCards}>
          {allies.map((ally) => (
            <div className={styles.sponsorCard} onClick={() => window.open(ally.link, '_blank')}>
              {ally.logo}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlliesSection
