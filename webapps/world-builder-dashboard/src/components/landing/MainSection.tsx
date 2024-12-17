import React from 'react';
import styles from './Landing.module.css';

interface MainSectionProps {
    smallView: boolean;
    startBuilding: () => void;
}

const MainSection: React.FC<MainSectionProps> = ({ smallView, startBuilding }) => {
    return (
        <div className={styles.firstSection}>
            <div className={styles.contentContainer}>
                <div className={styles.pill}>DEVHUB</div>
                <div className={styles.titleContainer}>
                    <div className={styles.titleText}>Build Your Game</div>
                    <div className={styles.subtitleText}>Be a part of the future of gaming</div>
                </div>
                {!smallView && (
                    <div className={styles.ctaContainer}>
                        <div
                            className={styles.learnMoreCTA}
                            onClick={() =>
                                window.open(
                                    'https://docs.game7.io/',
                                    '_blank'
                                )
                            }
                        >
                            Learn more
                        </div>
                        <div className={styles.startBuildingCTA} onClick={startBuilding}>
                            Start building
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainSection;
