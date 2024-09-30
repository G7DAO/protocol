import React from 'react'
import styles from './LandingPage.module.css'
import IconGame7 from '@/assets/IconGame7'
import IconGame7Logo from '@/assets/IconGame7Logo'
import IconThemeSwitch from '@/assets/IconThemeSwitch'

interface LandingPageProps { }

const LandingPage: React.FC<LandingPageProps> = () => {
    const NAVBAR_ITEMS = ['Home', 'Faucet', 'Bridge', 'Community', 'Docs']
    return (
        <div className={styles.layout}>
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
                                <div className={styles.navbarItem}>{item}</div>
                            ))}
                            <div className={styles.navbarCTA}>
                                Start building
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage