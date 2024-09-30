import React from 'react'
import styles from './LandingPage.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'
import IconThemeSwitch from '@/assets/IconThemeSwitch'
import IconScrollBar from '@/assets/IconScrollBar'

interface LandingPageProps { }

const LandingPage: React.FC<LandingPageProps> = () => {
    const NAVBAR_ITEMS = ['Home', 'Faucet', 'Bridge', 'Community', 'Docs']
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
                                <div className={styles.themeSwitchButton}>
                                    <IconThemeSwitch />
                                </div>
                                {NAVBAR_ITEMS.map(item => (
                                    <div className={item === 'Home' ? styles.navbarItemHome : styles.navbarItem}>{item}</div>
                                ))}
                                <div className={styles.navbarCTA}>
                                    Start building
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* MAIN LAYOUT */}
                <div className={styles.mainLayout}>
                    <div className={styles.titleContainer}>
                        <div className={styles.titleText}>
                            COME BUILD YOUR GAME
                        </div>
                        <div className={styles.subtitleText}>
                            Be a part of the future of gaming
                        </div>
                    </div>
                    <div className={styles.ctaContainer}>
                        <div className={styles.learnMoreCTA}>
                            Learn more
                        </div>
                        <div className={styles.startBuildingCTA}>
                            Start building
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LandingPage