import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import styles from './TransferProgress.module.css'

const TransferProgress = ({ start, eta }) => {
    const [timeRemaining, setTimeRemaining] = useState('');
    const [progress, setProgress] = useState(0);


    useEffect(() => {
        const updateProgress = () => {
            const now = new Date().getTime();
            const startTime = new Date(start).getTime();
            const etaTime = new Date(eta).getTime();
            const totalDuration = etaTime - startTime;
            const elapsedTime = now - startTime;

            const percentage = Math.min((elapsedTime / totalDuration) * 100, 100);
            setProgress(percentage);

            const remainingTime = etaTime - now;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            if (remainingTime <= 0) {
                setTimeRemaining('ETA error')
                setProgress(-1)
            } else {
                setTimeRemaining(`${hours}h ${minutes}m`);
            }
        };

        updateProgress();
        const interval = setInterval(updateProgress, 60000);

        return () => clearInterval(interval);
    }, [start, eta]);

    return (
        <div className={styles.container} >
            {progress !== -1 && (

            <CircularProgressbar
                value={progress}
                className={styles.progress}
                strokeWidth={20}
                styles={buildStyles({
                    pathColor: '#378641',
                    textColor: '#000',
                    trailColor: '#d6d6d6',
                    pathTransitionDuration: 1,
                    strokeLinecap: 'butt',
                })}
            />
            )}
            {timeRemaining}
        </div>
    );
};

export default TransferProgress;
