    import React, { useRef, useEffect } from 'react'
    import { useNavigate } from 'react-router-dom'
    import styles from './Landing.module.css'
    import { NetworkType, useBlockchainContext } from '@/contexts/BlockchainContext'

    interface NetworkEssentialsProps {
      smallView: boolean
      startBuilding: () => void
    }

    const essentials = [
      {
        title: 'Faucet',
        description: 'Get testnet tokens to start building on G7 Sepolia',
        imageClass: styles.networkEssentialFaucet,
        onClick: (navigate: (path: string) => void, setSelectedNetworkType: (type: NetworkType) => void) => {
          setSelectedNetworkType('Testnet')
          navigate('/faucet')
        }
      },
      {
        title: 'Bridge',
        description: 'Bridge tokens between Ethereum, Arbitrum and the G7 network',
        imageClass: styles.networkEssentialBridge,
        onClick: (navigate: (path: string) => void, setSelectedNetworkType: (type: NetworkType) => void) => {
          setSelectedNetworkType('Mainnet')
          navigate('/bridge')
        }
      },
      {
        title: 'Block explorer',
        description: 'Track and interact directly with your smart contracts',
        imageClass: styles.networkEssentialExplorer,
        onClick: () => window.open('https://mainnet.game7.io/', '_blank')
      },
      {
        title: 'Docs',
        description: 'Get more information about building on the G7 Network',
        imageClass: styles.networkEssentialDocs,
        onClick: () => window.open('https://docs.game7.io/', '_blank')
      },
      {
        title: 'Discord',
        description: 'Join our community of builders on Discord',
        imageClass: styles.networkEssentialDiscord,
        onClick: () => window.open('https://discord.com/invite/g7dao', '_blank')
      },
      {
          title: 'Camelot',
          description: 'Power your token swaps and liquidity provisioning with Camelot, the native DEX for the G7 Network',
          imageClass: styles.networkEssentialCamelot,
          onClick: () => window.open('https://app.camelot.exchange/?token1=0xfa3ed70386b9255fC04aA008A8ad1B0CDa816Fac&token2=0x401eCb1D350407f13ba348573E5630B83638E30D&chainId=2187', '_blank')
      },
      {
          title: 'Reservoir',
          description: 'Access aggregated NFT liquidity and build custom marketplaces with Reservoir',
          imageClass: styles.networkEssentialReservoir,
          onClick: () => window.open('https://reservoir.tools/', '_blank')
      },
      {
          title: 'Safe',
          description: 'Secure your smart contracts with Safe, the leading multi-sig wallet for asset management, powered by Protofire',
          imageClass: styles.networkEssentialSafe,
          onClick: () => window.open('https://app.safe.global/', '_blank')
      }
    ]



    const NetworkEssentials: React.FC<NetworkEssentialsProps> = ({ smallView, startBuilding }) => {
      const navigate = useNavigate()
      const { setSelectedNetworkType } = useBlockchainContext()
      const containerRef = useRef<HTMLDivElement>(null)

      const onWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return;
        if (containerRef?.current) {
          containerRef.current.scrollTo({
            left: containerRef.current.scrollLeft + e.deltaY * 400,
            behavior: 'smooth',
            });
        }
      };

      useEffect(() => {
            document.addEventListener('wheel', onWheel);
          return () => {
            document.removeEventListener('wheel', onWheel);
          };
        }, []);
      
    

      return (
        <div className={styles.contentContainer}>
          <div className={styles.sectionTitle}>Start building with the network essentials</div>
          <div className={styles.networkEssentialCards} ref={containerRef}>
            {essentials.map((essential, index) => (
              <div
                className={styles.networkEssentialCard}
                onClick={() => essential.onClick(navigate, setSelectedNetworkType)}
                key={index}
              >
                <div className={`${styles.networkEssentialCardImage} ${essential.imageClass}`} />
                <div className={styles.networkEssentialCardText}>
                  {/* тут была запятая и она ломала верстку лол, DEV-136 и мб затрагивает DEV-66 и  */}
                  <div className={styles.networkEssentialCardTitle}>{essential.title}</div>
                  <div className={styles.networkEssentialCardDescription}>{essential.description}</div>
                </div>
              </div>
            ))}
          </div>
          {!smallView && (
            <div className={styles.startBuildingCTA} onClick={startBuilding}>
              Start building
            </div>
          )}
        </div>
      )
    }

    export default NetworkEssentials
