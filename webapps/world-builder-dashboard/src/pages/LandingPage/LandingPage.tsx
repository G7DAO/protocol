// LandingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';
import { useMediaQuery } from 'summon-ui/mantine';
import MainSection from "@/components/landing/MainSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import AlliesSection from "@/components/landing/AlliesSection";
import NetworkEssentials from "@/components/landing/NetworksEssentials";
import Navbar from "@/components/landing/Navbar";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false);
  const smallView = useMediaQuery('(max-width: 750px)');

  const startBuilding = () => {
    navigate('/faucet');
  };

  const navigateLink = (item: any) => {
    item.name !== 'Docs' && item.name !== 'Community'
        ? navigate(`/${item.link}`)
        : window.open(item.link, '_blank');
  };

  return (
      <>
        <div className={`${styles.layout} ${navbarOpen && styles.layoutBlur}`}>
          <Navbar
              navbarOpen={navbarOpen}
              smallView={!!smallView}
              setNavBarOpen={setNavBarOpen}
              startBuilding={startBuilding}
              navigateLink={navigateLink}
          />

          <div className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}`}>
            <MainSection smallView={!!smallView} startBuilding={startBuilding} />
            <BenefitsSection />
            <AlliesSection />
            <NetworkEssentials smallView={!!smallView} startBuilding={startBuilding} />
          </div>

          {smallView && (
              <div className={styles.startBuildingCTA} onClick={startBuilding}>
                Start building
              </div>
          )}
        </div>
      </>
  );
};

export default LandingPage;
