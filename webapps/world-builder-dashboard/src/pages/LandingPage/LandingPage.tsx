// LandingPage.tsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import AlliesSection from '@/components/landing/AlliesSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import Container from '@/components/landing/Container'
import MainSection from '@/components/landing/MainSection'
import Navbar from '@/components/landing/Navbar'
import NetworkEssentials from '@/components/landing/NetworksEssentials'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import backgroundImage from "@/assets/G7LandingPageBGDark.jpg";
import Footer from '@/components/landing/Footer'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { setSelectedNetworkType } = useBlockchainContext()
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false)
  const smallView = useMediaQuery('(max-width: 750px)')
  const isLargeView = useMediaQuery('(min-width: 1440px)')
  const mainLayoutRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [backgroundStyle, setBackgroundStyle] = useState<string | undefined>();
  const [isHeaderSticky, setIsHeaderSticky] = useState<boolean>(false)
  const [wasAtBottom, setWasAtBottom] = useState<boolean>(false)

  useEffect(() => {
    const img = new Image()
    img.src = backgroundImage as string

    img.onload = () => {
      setBackgroundStyle(`#1b1b1b url(${backgroundImage}) 50% / cover no-repeat`)
    }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(([element])=>{
      setIsHeaderSticky(element.isIntersecting)
    }, {root: null, rootMargin: '0px', threshold: 1.0})
  }, [observerRef])

  useEffect(() => {
    if (observerRef?.current && headerRef?.current) {
      observerRef.current.observe(headerRef.current);
    }

    return () => {
      if (observerRef?.current) {
        observerRef?.current?.disconnect();
      }
    };
  }, [observerRef, headerRef]);

  useEffect(() => {
    const element = mainLayoutRef.current;
    if (!element) return;
    const initIsAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 1
    if (initIsAtBottom) {
      setWasAtBottom(true)
    }
    
    let lastScrollTop = element.scrollTop;
    const handleScroll = () => {
      const currentScrollTop = element.scrollTop;
      const isScrollingUp = Math.round(currentScrollTop) - Math.round(lastScrollTop) <= 0
      lastScrollTop = currentScrollTop;
      const isAtTop = element.scrollTop < 1
      const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 1

      if (wasAtBottom && !isAtBottom) {
        headerRef.current?.scrollIntoView({ behavior: 'smooth' })
      }

      if (isAtBottom && !isScrollingUp) {
        footerRef.current?.scrollIntoView({ behavior: 'smooth' })
        setWasAtBottom(true)
      } else {
        setWasAtBottom(false)
      }

      if (isAtTop) {
        headerRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [wasAtBottom]);


  const startBuilding = () => {
    setSelectedNetworkType('Testnet')
    navigate('/faucet')
  }

  const navigateLink = (item: any) => {
    if (item.name === 'Faucet') {
      setSelectedNetworkType('Testnet')
      navigate(`/${item.link}`)
    } else if (item.name === "Bridge") {
      setSelectedNetworkType('Mainnet')
      navigate(`/${item.link}`)
    } else {
      window.open(item.link, '_blank')
    }
  }

  const slides = [
    <MainSection key='main' smallView={!!smallView} startBuilding={startBuilding} />,
    <BenefitsSection key='benefits' />,
    <AlliesSection key='allies' />,
    <NetworkEssentials smallView={!!smallView} startBuilding={startBuilding} key='essentials' />
  ]

  return (
    <>
      {isLargeView ? (
        <>
          <Container
            components={slides}
            isNavbarOpen={navbarOpen}
            setIsNavbarOpen={setNavBarOpen}
            isSmallView={!!smallView}
            startBuilding={startBuilding}
            navigateLink={navigateLink}
          />
        </>
      ) : (<>
        <div className={styles.container}>
          <div className={styles.viewContainer}>
            <div className={`${styles.layout} ${navbarOpen && styles.layoutBlur}`} ref={headerRef}>
              <Navbar
                navbarOpen={navbarOpen}
                smallView={!!smallView}
                setIsNavbarOpen={setNavBarOpen}
                startBuilding={startBuilding}
                navigateLink={navigateLink}
                isContainer={false}
                isSticky={isHeaderSticky}
              />
              <div ref={mainLayoutRef} className={`${styles.mainLayout} ${navbarOpen ? styles.layoutDarkened : ''}`}
                style={backgroundStyle ? { background: backgroundStyle } : undefined}>
                <MainSection smallView={!!smallView} startBuilding={startBuilding} />
                <BenefitsSection />
                <AlliesSection />
                <NetworkEssentials smallView={!!smallView} startBuilding={startBuilding}/>
              </div>
              {smallView && (
                <div className={styles.startBuildingCTA} onClick={startBuilding}>
                  Start building
                </div>
              )}
            </div>
          </div>
          <div ref={footerRef}>
            <Footer />
          </div>
        </div>
      </>
      )}
    </>
  )
}

export default LandingPage
