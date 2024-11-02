import React from 'react';
import styles from './SegmentedProgressBar.module.css';

interface SegmentedProgressBarProps {
    numberOfSegments: number;
    progress: number; // Percentage (0-100)
}

const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({ numberOfSegments, progress }) => {
    const percentPerSegment = 100 / numberOfSegments;
    return (
        <div className={styles.container}>
            {Array.from({ length: numberOfSegments }, (_, index) => {
                const segmentStart = index * percentPerSegment;
                const segmentEnd = segmentStart + percentPerSegment;
                let fillPercentage
                if (progress > segmentEnd) {
                    fillPercentage = 100;
                } else {
                    fillPercentage = progress < segmentStart ? 0 : (progress - segmentStart) / percentPerSegment * 100
                }

                return (
                    <div
                        key={index}
                        className={styles.segment}
                    >
                        <div
                            className={styles.fill}
                            style={{height: `${fillPercentage}%`}}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default SegmentedProgressBar;
