// External Libraries
import React, { useEffect, useState } from 'react'
import OptionsButton from './OptionsButton'
// Styles
import styles from './PoolDesktop.module.css'
import PositionsTable from './PositionsTable'
import { Pagination } from 'summon-ui/mantine'
import usePools from '@/hooks/usePools'
import { formatAddress } from '@/utils/addressFormat'
import { tokenTypes } from '@/utils/web3utils'

interface PoolDesktopProps {}

export interface Pool {
  poolId: string
  poolName: string
  administrator: string
  owner: string
  tokenType: string
  tokenAddress: string
  tokenId: string
  lockdownPeriod: string
  cooldownPeriod: string
  transferable: boolean
  isImmutable: boolean
}

const PoolsDesktop: React.FC<PoolDesktopProps> = () => {
  const { data } = usePools()
  const [activePool, setActivePool] = useState<string | null>(null)
  const [clickedPool, setClickedPool] = useState<number | null>(null)
  const [page, setPage] = useState<number>(0)
  const [maximumPages, setMaximumPages] = useState<number>(0)
  // for future, when the user is able to customize their own entries
  const [entries, setEntries] = useState<number>(10)

  useEffect(() => {
    if (!data) {
      return
    }
    setMaximumPages(Math.ceil(data?.length / entries))
    setEntries(5)
  }, [data])

  const headers = ['ID', 'Name', 'Token Type', 'Period', 'Cooldown', 'Transferrable', '']

  const handleViewPositions = (poolId: string) => {
    setActivePool(activePool === poolId ? null : poolId)
  }

  const getTokenLabel = (tokenValue: string) => {
    const type = tokenTypes.find((token) => token.value === tokenValue)
    return type?.label
  }

  const toggleDropdown = (clickedPoolId: number | null) => {
    if (clickedPoolId === clickedPool) setClickedPool(null)
    else setClickedPool(clickedPoolId)
  }

  return (
    <div className={styles.poolsContainer}>
      <div style={{ margin: 'auto', width: '100%' }}>
        {/* <Pagination
          value={page + 1}
          onChange={(value) => setPage((value - 1) % maximumPages)}
          total={maximumPages}
          style={{ marginBottom: "20px" }}
        /> */}
        <div className={styles.headerContainer}>
          <div className={styles.header}>Pools</div>
          <div className={styles.subtitle}>Manage and view your pools</div>
        </div>
        <div className={styles.gap} />
        <table className={styles.tableStyles}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className={`
                    ${header !== 'ID' && header !== '' ? styles.thStylesWidth : styles.thStyles}  // Conditionally apply 'data' for non-ID and non-empty headers
                  `}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.slice(page * entries, entries * (page + 1)).map((item) => (
              <React.Fragment key={item.poolId}>
                <tr className={styles.trStyles}>
                  <td className={styles.tdStyles}>{item.poolId}</td>
                  <td className={styles.tdStyles}>{item.poolName}</td>
                  <td className={styles.tdStyles}>{getTokenLabel(item.tokenType)}</td>
                  <td className={styles.tdStyles}>{item.lockdownPeriod}</td>
                  <td className={styles.tdStyles}>{item.cooldownPeriod}</td>
                  <td className={styles.tdStyles}>{item.transferable.toString()}</td>
                  <td className={styles.tdStyles}>
                    <OptionsButton
                      onViewPositions={() => handleViewPositions(item.poolId)}
                      poolData={{
                        poolId: item.poolId,
                        transferable: item.transferable,
                        cooldownSeconds: item.cooldownPeriod,
                        lockupSeconds: item.lockdownPeriod
                      }}
                      toggleDropdown={toggleDropdown}
                      clickedPool={clickedPool}
                    />
                  </td>
                </tr>
                {activePool === item.poolId && (
                  <tr className={styles.trStyles}>
                    <td colSpan={headers.length} className={styles.tdStyles}>
                      <PositionsTable />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PoolsDesktop
