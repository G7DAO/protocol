// External Libraries
import React, { useEffect, useState } from 'react'
// Styles
import styles from './PoolDesktop.module.css'
import OptionsButton from './OptionsButton';
import PositionsTable, { Position } from './PositionsTable';
import usePools from '@/hooks/usePools';
import { formatAddress } from '@/utils/addressFormat';

interface PoolDesktopProps { }


export interface Pool {
  poolId: string;
  poolName: string;
  administrator: string;
  owner: string;
  tokenType: string;
  tokenAddress: string;
  tokenId: string;
  lockdownPeriod: string;
  cooldownPeriod: string;
  transferable: boolean;
  isImmutable: boolean;
}

const PoolsDesktop: React.FC<PoolDesktopProps> = () => {
  const { data } = usePools();
  const [activePool, setActivePool] = useState<string | null>(null);

  const headers = [
    'Pool ID',
    'Pool Name',
    'Administrator',
    'Owner',
    'Token Type',
    'Token Address',
    'Token ID',
    'Lockdown period (s)',
    'Cooldown period (s)',
    'Is transferable?',
    `Is immutable?`,
    ''
  ];

  const handleViewPositions = (poolId: string) => {
    setActivePool(activePool === poolId ? null : poolId);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ margin: 'auto', width: '100%' }}>
        <table className={styles.tableStyles}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className={styles.thStyles}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((item) => (
              <React.Fragment key={item.poolId}>
                <tr className={styles.trStyles}>
                  <td className={styles.tdStyles}>{item.poolId}</td>
                  <td className={styles.tdStyles}>{item.poolName}</td>
                  <td className={styles.tdStyles}>{formatAddress(item.administrator)}</td>
                  <td className={styles.tdStyles}>{formatAddress(item.owner)}</td>
                  <td className={styles.tdStyles}>{item.tokenType}</td>
                  <td className={styles.tdStyles}>{formatAddress(item.tokenAddress)}</td>
                  <td className={styles.tdStyles}>{item.tokenId}</td>
                  <td className={styles.tdStyles}>{item.lockdownPeriod}</td>
                  <td className={styles.tdStyles}>{item.cooldownPeriod}</td>
                  <td className={styles.tdStyles}>{item.transferable.toString()}</td>
                  <td className={styles.tdStyles}>{item.isImmutable.toString()}</td>
                  <td className={styles.tdStyles}>
                    <OptionsButton
                      onViewPositions={() => handleViewPositions(item.poolId)}
                      poolData={{
                        poolId: item.poolId,
                        transferable: item.transferable,
                        cooldownSeconds: item.cooldownPeriod,
                        lockdownSeconds: item.lockdownPeriod
                      }}
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
