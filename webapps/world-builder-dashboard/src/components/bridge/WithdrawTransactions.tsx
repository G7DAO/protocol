import React, {useEffect, useState} from 'react';
import styles from "./WithdrawTransactions.module.css";
import {useQuery, useQueryClient} from "react-query";
import Withdrawal from "@/components/bridge/Withdrawal";
import {useBlockchainContext} from "@/components/bridge/BlockchainContext";
import {Icon} from "summon-ui";
import {useNavigate} from "react-router-dom";

interface WithdrawTransactionsProps {
}
const WithdrawTransactions: React.FC<WithdrawTransactionsProps> = () => {
    const [filter, setFilter] = useState<'PENDING' | 'SETTLED'>("PENDING");
    const handleFilterClick = () => {
        setFilter((prev) => prev === 'PENDING' ? 'SETTLED' : 'PENDING')
    }
    const {L3Provider, connectedAccount} = useBlockchainContext();


    // const txs = useQuery(["incomingMessages", connectedAccount], () => {
    //     return [
    //         // {txHash: "0x8f6dc2e0c892bb97465c5e72718519cb88879741f3b33b198053273708d5106b", chainId: 1398587, delay: 15 * 60 },
    //         // {txHash: "0xe7c19970aaded18b26f0d7f2dae3244cf7a09b4c0806c209dba812a3e051b932",  chainId: 1398587, delay: 15 * 60 },
    //         // {txHash: "0xed4a7149543497167d779789d8e79ef6155cf4640556cd5fe26917cbbfff920c", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x0785921358d1af5f6423d05d0249e93b906aa82fad791d5fe575e715f3d3ffd1", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x478107cfefc8e01c64098c922415f8a5af80c1f5db5d834ad45758ae754d4e74", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x88d55459af84e1395a69e1eea281b887b390054950d8ebd23bc4f80fedaf3013", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x2f6f305784ffff4dec4b96f9b9a4f8a9436ea7e436e0269bf9d6129de7a736ea", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x2a24d4992cff92b526d27571a37448eeb536a6cf71466a78073452a11c899e6d", chainId: 1398587, delay: 15 * 60 },
    //         // {txHash: "0x8e762b1f219fa5c571973c8d092792d68e602ffbd9aae9f3cc9c3df5d453fd61", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x968a96df2454bd844d18db8bc7e60487266223ad031319a375e5c4b4c3688e69", chainId: 1398587, delay: 15 * 60 },
    //         {txHash: "0x1984b9885e68cba70988cfa4befb6700aa516650fe2316d273a5e6d534f2b950", chainId: 1398587, delay: 15 * 60 },
    //     ];
    // })
    const queryClient = useQueryClient();
    const [cachedTxsData, setCachedTxsData] = useState(() => queryClient.getQueryData(["incomingMessages", connectedAccount]));
    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe(() => {
            const data = queryClient.getQueryData(["incomingMessages", connectedAccount]);
            setCachedTxsData(data);
        });

        return () => {
            unsubscribe();
        };
    }, [queryClient]);


  const headers = ["Time", "Token", "From", "To", "Status", ""];
    const navigate = useNavigate();

  return (
  <div className={styles.container}>
    <div className={styles.content}>
        <div className={styles.filtersContainer}>
            <Icon name={'ArrowNarrowLeft'} onClick={() => navigate('/bridge')} />
            {/*<div className={styles.filterButtons}>*/}
            {/*    <button*/}
            {/*        onClick={handleFilterClick}*/}
            {/*        className={`${styles.filterButtonLeft} ${filter === 'PENDING' ? styles.filterButtonSelected : ""}`}>Pending*/}
            {/*    </button>*/}
            {/*    <button*/}
            {/*        onClick={handleFilterClick}*/}
            {/*        className={`${styles.filterButtonRight} ${filter === 'SETTLED' ? styles.filterButtonSelected : ""}`}>Settled*/}
            {/*    </button>*/}
            {/*</div>*/}
        </div>
        {!!cachedTxsData && L3Provider && (
            <div className={styles.transactions}>
                <div className={styles.withdrawsGrid}>
                    {headers.map((h) => <div className={styles.transactionsHeader} key={h}>{h}</div>)}
                    {cachedTxsData.map((tx, idx) => <Withdrawal txHash={tx.txHash} chainId={tx.chainId} key={idx} delay={tx.delay}/>)}
                </div>
            </div>
        )}

    </div>
  </div>
  );
};

export default WithdrawTransactions;
