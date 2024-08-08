// External Libraries
import React, { useState } from 'react'
// Styles
import styles from './PoolDesktop.module.css'
import OptionsButton from './OptionsButton';
import PositionsTable, { Position } from './PositionsTable';

interface PoolDesktopProps { }
const PoolsDesktop: React.FC<PoolDesktopProps> = () => {
  const [activePool, setActivePool] = useState<string | null>(null);

  interface Pool {
    poolId: string;
    poolName: string;
    administrator: string;
    owner: string;
    tokenType: string;
    tokenAddress: string;
    tokenId: string;
    lockdownPeriod: string;
    cooldownPeriod: string;
    isTransferable: string;
    isImmutable: string;
  }

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

  const sampleData: Pool[] = [
    {
      poolId: '1',
      poolName: "Knight's Reserve",
      administrator: '0x0',
      owner: '0x0',
      tokenType: 'Native Token',
      tokenAddress: '0xA',
      tokenId: 'N/A',
      lockdownPeriod: '60',
      cooldownPeriod: '30',
      isTransferable: 'true',
      isImmutable: 'false',
    },
    {
      poolId: '2',
      poolName: "Da Boyz Hut",
      administrator: '0x0',
      owner: '0x0',
      tokenType: 'ERC721',
      tokenAddress: '0xB',
      tokenId: 'N/A',
      lockdownPeriod: '60',
      cooldownPeriod: '30',
      isTransferable: 'true',
      isImmutable: 'false',
    },
    {
      poolId: '3',
      poolName: "Treasure Vault",
      administrator: '0x0',
      owner: '0x0',
      tokenType: 'ERC20',
      tokenAddress: '0xC',
      tokenId: 'N/A',
      lockdownPeriod: '60',
      cooldownPeriod: '30',
      isTransferable: 'true',
      isImmutable: 'false',
    },
    {
      poolId: '4',
      poolName: "First Aid Donations",
      administrator: '0x0',
      owner: '0x0',
      tokenType: 'ERC1155',
      tokenAddress: '0xD',
      tokenId: '3',
      lockdownPeriod: '60',
      cooldownPeriod: '30',
      isTransferable: 'true',
      isImmutable: 'false',
    },
    {
      poolId: '5',
      poolName: "Den of Stolen Bracelets",
      administrator: '0x0',
      owner: '0x0',
      tokenType: 'ERC20',
      tokenAddress: '0xE',
      tokenId: 'N/A ',
      lockdownPeriod: '60',
      cooldownPeriod: '30',
      isTransferable: 'true',
      isImmutable: 'false',
    }
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
            {sampleData.map((data, idx) => (
              <React.Fragment key={data.poolId}>
                <tr className={styles.trStyles}>
                  <td className={styles.tdStyles}>{data.poolId}</td>
                  <td className={styles.tdStyles}>{data.poolName}</td>
                  <td className={styles.tdStyles}>{data.administrator}</td>
                  <td className={styles.tdStyles}>{data.owner}</td>
                  <td className={styles.tdStyles}>{data.tokenType}</td>
                  <td className={styles.tdStyles}>{data.tokenAddress}</td>
                  <td className={styles.tdStyles}>{data.tokenId}</td>
                  <td className={styles.tdStyles}>{data.lockdownPeriod}</td>
                  <td className={styles.tdStyles}>{data.cooldownPeriod}</td>
                  <td className={styles.tdStyles}>{data.isTransferable}</td>
                  <td className={styles.tdStyles}>{data.isImmutable}</td>
                  <td className={styles.tdStyles}>
                    <OptionsButton onViewPositions={() => handleViewPositions(data.poolId)} />
                  </td>
                </tr>
                {activePool === data.poolId && (
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
