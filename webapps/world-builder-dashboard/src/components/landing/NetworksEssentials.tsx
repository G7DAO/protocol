import React from 'react'
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
      setSelectedNetworkType('testnet')
      navigate('/faucet')
    }
  },
  {
    title: 'Bridge',
    description: 'Bridge tokens between Ethereum, Arbitrum and the G7 network',
    imageClass: styles.networkEssentialBridge,
    onClick: (navigate: (path: string) => void, setSelectedNetworkType: (type: NetworkType) => void) => {
      setSelectedNetworkType('mainnet')
      navigate('/bridge')
    }
  },
  {
    title: 'Block explorer',
    description: 'Track and interact directly with your smart contracts',
    imageClass: styles.networkEssentialExplorer,
    onClick: () => window.open('https://testnet.game7.io/', '_blank')
  },
  {
    title: 'Docs',
    description: 'Get more information about building on the G7 Network',
    imageClass: styles.networkEssentialDocs,
    onClick: () => window.open('https://wiki.game7.io/g7-developer-resource/', '_blank')
  },
  {
    title: 'Discord',
    description: 'Join our community of builders on Discord',
    imageClass: styles.networkEssentialDiscord,
    onClick: () => window.open('https://discord.com/invite/g7dao', '_blank')
  }
]

const NetworkEssentials: React.FC<NetworkEssentialsProps> = ({ smallView, startBuilding }) => {
  const navigate = useNavigate()
  const { setSelectedNetworkType } = useBlockchainContext()
  return (
    <div className={styles.contentContainer}>
      <div className={styles.sectionTitle}>Start building with the network essentials</div>
      <div className={styles.networkEssentialCards}>
        {essentials.map((essential, index) => (
          <div
            className={styles.networkEssentialCard}
            onClick={() => essential.onClick(navigate, setSelectedNetworkType)}
            key={index}
          >
            <div className={`${styles.networkEssentialCardImage} ${essential.imageClass}`} />
            <div className={styles.networkEssentialCardText}>
              <div className={styles.networkEssentialCardTitle}>{essential.title}</div>,
              <div className={styles.networkEssentialCardDescription}>{essential.description}</div>
            </div>
          </div>
        ))}
      </div>
      {!smallView && (
        <div className={styles.startBuildingCTA} onClick={startBuilding}>
          Start Building
        </div>
      )}
    </div>
  )
}

export default NetworkEssentials
