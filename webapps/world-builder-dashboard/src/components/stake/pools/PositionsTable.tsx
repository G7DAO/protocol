import React from 'react';
import styles from './PositionsTable.module.css';

export interface Position {
    positionId: string;
    staker: string;
    depositorNftTokenId: string;
    amount: string;
    tokenId: string;
    startDate: string;
    endDate: string;
}

interface PositionsTableProps { }

const headers = [
    'Position ID',
    `Opened By`,
    `NFT Token ID`,
    `Amount`,
    `TokenId`,
    `Stake Timestamp`,
    `Unstake Initiated At`
];

const samplePositions: Position[] = [
    {
        positionId: '1',
        staker: '0x0',
        depositorNftTokenId: '1',
        amount: '1',
        tokenId: '1',
        startDate: '2022-01-01',
        endDate: '2022-12-31'
    },
    {
        positionId: '2',
        staker: '0x1',
        depositorNftTokenId: '2',
        amount: '200',
        tokenId: '-',
        startDate: '2022-02-01',
        endDate: '2022-11-30'
    }
];

const PositionsTable: React.FC<PositionsTableProps> = () => {
    return (
        <table className={styles.positionsTable}>
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
                {samplePositions.map((position, index) => (
                    <tr key={index}>
                        <td>{position.positionId}</td>
                        <td>{position.staker}</td>
                        <td>{position.depositorNftTokenId}</td>
                        <td>{position.amount}</td>
                        <td>{position.tokenId}</td>
                        <td>{position.startDate}</td>
                        <td>{position.endDate}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default PositionsTable;
