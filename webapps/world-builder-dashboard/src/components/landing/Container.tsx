import React, { ReactNode, useEffect, useRef, useState } from 'react';
import styles from "./Container.module.css";
import parentStyles from "./Landing.module.css"
import SegmentedProgressBar from "./SegmentedProgressBar";
import Navbar from "@/components/landing/Navbar";
import backgroundImage from "../../assets/G7LandingPageBGDark.jpg";
import Footer from './Footer';


interface ContainerProps {
    components: ReactNode[]
    isNavbarOpen: boolean
    setIsNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSmallView: boolean
    navigateLink: (item: { name: string, link: string }) => void
    startBuilding: () => void
}



const Container: React.FC<ContainerProps> = ({ components, isNavbarOpen, setIsNavbarOpen, isSmallView, navigateLink, startBuilding }) => {
    const [progress, setProgress] = useState(0);
    const [page, setPage] = useState(0)

    const [pageToRender, setPageToRender] = useState(0) //delay for fadeOut animation
    const [isFadingOut, setIsFadingOut] = useState(false)
    const hasRunOnce = useRef(false) //to not fade out at first render

    const [backgroundStyle, setBackgroundStyle] = useState<string | undefined>();

    useEffect(() => {
        const img = new Image();
        img.src = backgroundImage as string;

        img.onload = () => {
            setBackgroundStyle(`#1b1b1b url(${backgroundImage}) 50% / cover no-repeat`);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const progress = window.scrollY / (5000 - window.innerHeight)
            setProgress(progress * 100)
            setPage(Math.min(Math.floor(progress * components.length), components.length - 1));
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);



    useEffect(() => {
        if (!hasRunOnce.current) {
            hasRunOnce.current = true;
            return
        }
        setIsFadingOut(true)
        setTimeout(() => {
            setIsFadingOut(false)
            setPageToRender(page);
        }, 250)
    }, [page]);


    return (
        <div className={styles.container}>
            <div className={styles.viewContainer}>
                <div className={styles.sticky}>
                    <div className={`${parentStyles.layout} ${isNavbarOpen && parentStyles.layoutBlur}`}>
                        <Navbar
                            navbarOpen={isNavbarOpen}
                            smallView={isSmallView}
                            setIsNavbarOpen={setIsNavbarOpen}
                            startBuilding={startBuilding}
                            navigateLink={navigateLink}
                            isSticky={progress > 100}
                        />
                        <div className={`${parentStyles.mainLayout} ${isNavbarOpen ? styles.layoutDarkened : ''}`}
                            style={backgroundStyle ? { background: backgroundStyle } : undefined}>
                            <div className={isFadingOut ? styles.fadeOut : styles.fadeIn}>
                                {components[pageToRender]}
                            </div>
                        </div>
                        {isSmallView && (
                            <div className={parentStyles.startBuildingCTA} onClick={startBuilding}>
                                Start building
                            </div>
                        )}
                    </div>
                    <div className={styles.progressBar}>
                        <SegmentedProgressBar numberOfSegments={components.length} progress={progress} />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Container;
