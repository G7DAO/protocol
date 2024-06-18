import React, {useState} from 'react';
import styles from "./WithdrawTransactions.module.css";
import {useQuery} from "react-query";
import Withdrawal from "@/components/bridge/Withdrawal";
import {useBlockchainContext} from "@/components/bridge/BlockchainContext";

interface WithdrawTransactionsProps {
}
const WithdrawTransactions: React.FC<WithdrawTransactionsProps> = () => {
    const [filter, setFilter] = useState<'PENDING' | 'SETTLED'>("PENDING");
    const handleFilterClick = () => {
        setFilter((prev) => prev === 'PENDING' ? 'SETTLED' : 'PENDING')
    }
    const {L3Provider, connectedAccount} = useBlockchainContext();

    const txs = useQuery(["incomingMessages", connectedAccount], () => {
        return [
            {txHash: "0x8f6dc2e0c892bb97465c5e72718519cb88879741f3b33b198053273708d5106b", chainId: 1398587},
            {txHash: "0xe7c19970aaded18b26f0d7f2dae3244cf7a09b4c0806c209dba812a3e051b932",  chainId: 1398587},
            {txHash: "0xed4a7149543497167d779789d8e79ef6155cf4640556cd5fe26917cbbfff920c", chainId: 1398587},
            {txHash: "0x0785921358d1af5f6423d05d0249e93b906aa82fad791d5fe575e715f3d3ffd1", chainId: 1398587},
            {txHash: "0x478107cfefc8e01c64098c922415f8a5af80c1f5db5d834ad45758ae754d4e74", chainId: 1398587},
            {txHash: "0x88d55459af84e1395a69e1eea281b887b390054950d8ebd23bc4f80fedaf3013", chainId: 1398587},
            {txHash: "0x2f6f305784ffff4dec4b96f9b9a4f8a9436ea7e436e0269bf9d6129de7a736ea", chainId: 1398587},
        ];
    })


  const headers = ["Time", "Token", "From", "To", "Status", ""];

  return (
  <div className={styles.container}>
    <div className={styles.content}>
        <div className={styles.filtersContainer}>
            <div className={styles.filterButtons}>
                <button
                    onClick={handleFilterClick}
                    className={`${styles.filterButtonLeft} ${filter === 'PENDING' ? styles.filterButtonSelected : ""}`}>Pending
                </button>
                <button
                    onClick={handleFilterClick}
                    className={`${styles.filterButtonRight} ${filter === 'SETTLED' ? styles.filterButtonSelected : ""}`}>Settled
                </button>
            </div>
        </div>
        {txs.data && L3Provider && (
            <div className={styles.transactions}>
                <div className={styles.withdrawsGrid}>
                    {headers.map((h) => <div className={styles.transactionsHeader} key={h}>{h}</div>)}
                    {txs.data.map((tx, idx) => <Withdrawal txHash={tx.txHash} chainId={tx.chainId} key={idx} />)}
                </div>
            </div>
        )}

    </div>
  </div>
  );
};

export default WithdrawTransactions;
