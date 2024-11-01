import React from 'react';
import styles from './Landing.module.css';
import { HyperPlayLogo, SummonLogo, SummonTextLogo, ArbitrumLogo, ConduitLogo, MarketWarsLogo } from '../../assets';

const AlliesSection: React.FC = () => {
    return (
        <div className={styles.thirdSection}>
            <div className={styles.contentContainer}>
                <div className={styles.sectionTitle}>G7 Network allies</div>
                <div className={styles.sponsorCards}>
                    <div className={styles.sponsorCard}><HyperPlayLogo /></div>
                    <div className={styles.sponsorCard}><SummonLogo /><SummonTextLogo /></div>
                    <div className={styles.sponsorCard}><ArbitrumLogo /></div>
                    <div className={styles.sponsorCard}><ConduitLogo /></div>
                    <div className={styles.sponsorCard}><MarketWarsLogo /></div>
                </div>
            </div>
        </div>
    );
};

export default AlliesSection;
