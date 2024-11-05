// Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';
import IconGame7Logo from '@/assets/IconGame7Logo';
import IconGame7 from '@/assets/IconGame7';
import IconHamburgerLanding from '@/assets/IconHamburgerLanding';

interface NavbarProps {
    navbarOpen: boolean;
    smallView: boolean;
    setIsNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    startBuilding: () => void;
    navigateLink: (item: {name: string, link: string}) => void;
}

const NAVBAR_ITEMS = [
    { name: 'Home', link: '/' },
    { name: 'Faucet', link: 'faucet' },
    { name: 'Bridge', link: 'bridge' },
    { name: 'Community', link: 'https://discord.com/invite/g7dao' },
    {
        name: 'Docs',
        link: 'https://wiki.game7.io/g7-developer-resource/bWmdEUXVjGpgIbH3H5XT/introducing-the-g7-network/world-builder'
    }
];

const Navbar: React.FC<NavbarProps> = ({ navbarOpen, smallView, setIsNavbarOpen, startBuilding, navigateLink }) => {
    const navigate = useNavigate();

    return (
        <>
            {/* Main Navbar */}
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
                            <div className={styles.navbarItem}>
                                <IconHamburgerLanding onClick={() => setIsNavbarOpen(!navbarOpen)} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Navbar for small view */}
            {navbarOpen && smallView && (
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
            )}
        </>
    );
};

export default Navbar;
