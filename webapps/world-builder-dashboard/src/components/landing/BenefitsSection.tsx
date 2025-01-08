import React from 'react';
import styles from './Landing.module.css';

const benefits = [
    {
        title: "Build for gamers",
        imageClass: styles.cardImageGamers,
        description: "Bootstrap your game with access to 470k+ citizens and counting",
    },
    {
        title: "Fast and efficient",
        imageClass: styles.cardImageLightningQuick,
        description: "Lighting-quick transactions and low cost fees",
    },
    {
        title: "Special economic zone",
        imageClass: styles.cardImageSpecialEcon,
        description: "Access World Builder’s powerful developer tools",
    },
];

const BenefitsSection: React.FC = () => {
    return (
        <div className={styles.secondSection}>
            <div className={styles.contentContainer}>
                <div className={styles.sectionTitle}>Get all of the benefits of the G7 Network</div>
                <div className={styles.cards}>
                    {benefits.map((benefit, index) => (
                        <div className={styles.card} key={index}>
                            <div className={styles.cardTitle}>{benefit.title}</div>
                            <div className={`${styles.cardImage} ${benefit.imageClass}`} />
                            <div className={styles.cardDescription}>{benefit.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BenefitsSection;
