import { useEffect, useState } from 'react'
import styles from './LegalPage.module.css'
import { useMediaQuery } from 'summon-ui/mantine'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import axios from 'axios'

interface NodeStatus {
  name: string
  normalized_name: string
  status: string
  response: {
    current_block_number?: number
    balance?: string
    status: string
    timestamp_delays?: {
      [blockchain: string]: string
    }
  }
}

interface TimestampDelays {
  [blockchain: string]: string
}

const CORS_PROXY = 'https://corsproxy.io/'
const NODE_STATUS_URL = 'https://nodes.monitoring.game7.build/status'
const GAME7_STATUS_URL = 'https://game7.monitoring.moonstream.to/status'
const SEER_STATUS_URL = 'https://seer.monitoring.moonstream.to/status'

const StatusPage: React.FC = () => {
  const [navbarOpen, setNavBarOpen] = useState<boolean>(false)
  const smallView = useMediaQuery('(max-width: 750px)')
  const [nodes, setNodes] = useState<NodeStatus[]>([])
  const [game7Statuses, setGame7Statuses] = useState<NodeStatus[]>([])
  const [timestampDelays, setTimestampDelays] = useState<TimestampDelays | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesResponse, game7Response, seerResponse] = await Promise.all([
          axios.get<NodeStatus[]>(`${CORS_PROXY}${NODE_STATUS_URL}`),
          axios.get<NodeStatus[]>(`${CORS_PROXY}${GAME7_STATUS_URL}`),
          axios.get<NodeStatus[]>(`${CORS_PROXY}${SEER_STATUS_URL}`)
        ])

        setNodes(nodesResponse.data)

        const filteredGame7Statuses = game7Response.data.filter((item) =>
          item.name === 'faucetbalanace' || item.name === 'protocolapi'
        )
        setGame7Statuses(filteredGame7Statuses)

        const timestampData = seerResponse.data.find((item) => item.name === 'mdb_v3_database')?.response.timestamp_delays
        if (timestampData) {
          setTimestampDelays(timestampData)
        }
      } catch (error) {
        console.error('Error fetching status data:', error)
        setError('Failed to load node status')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // @ts-ignore
  return (
    <>
      <div className={styles.container}>
        <div className={styles.viewContainer}>
          <div className={`${styles.layout} ${navbarOpen && styles.layoutBlur}`}>
            <Navbar
              navbarOpen={navbarOpen}
              smallView={!!smallView}
              setIsNavbarOpen={setNavBarOpen}
              isContainer={false}
              isSticky={false}
              startBuilding={() => {}}
              navigateLink={() => {}}
            />
            <div className={styles.legalHeader}>
              <div className={styles.headerContainer}>
                <div className={styles.titleHeader}>Status</div>
              </div>
            </div>

            <div className={styles.legalMain}>
              <div className={styles.legalSection}>
                <div className={styles.legalContent}>
                  {loading ? (
                    <p>Loading node status...</p>
                  ) : error ? (
                    <p className={styles.error}>{error}</p>
                  ) : (
                    <>
                      {/* Блокчейн-ноды */}
                      <ul className={styles.nodeList}>
                        {nodes.map((node) => (
                          <li key={node.name} className={styles.nodeItem}>
                            <span className={styles.nodeName}>{node.normalized_name}</span>
                            <span
                              className={
                                node.response.status === 'ok' ? styles.nodeStatusOk : styles.nodeStatusError
                              }
                            >
                              {node.response.status === 'ok' ? 'Available' : 'Unavailable'}
                            </span>
                            {node.response.current_block_number && (
                              <span className={styles.blockNumber}>
                                Current block: {node.response.current_block_number}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Дополнительные статусы */}
                      <ul className={styles.nodeList}>
                        {game7Statuses.map((status) => (
                          <li key={status.name} className={styles.nodeItem}>
                            <span className={styles.nodeName}>{status.normalized_name}</span>
                            <span
                              className={
                                status.response.status === 'ok' ? styles.nodeStatusOk : styles.nodeStatusError
                              }
                            >
                              {status.response.status === 'ok' ? 'Available' : 'Unavailable'}
                            </span>
                            {status.response.balance && (
                              <span className={styles.blockNumber}>Balance: {status.response.balance}</span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Seer API - Timestamp Delays */}
                      {timestampDelays && (
                        <div className={styles.timestampSection}>
                          <h3>Blockchain Delays</h3>
                          <ul className={styles.nodeList}>
                            {Object.entries(timestampDelays).map(([blockchain, delay]) => (
                              <li key={blockchain} className={styles.nodeItem}>
                                <span className={styles.nodeName}>{blockchain}</span>
                                <span className={styles.blockNumber}>{delay}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div style={{ width: 'calc(100% + 24px)' }}>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StatusPage
