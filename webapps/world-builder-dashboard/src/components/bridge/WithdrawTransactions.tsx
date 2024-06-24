import React from 'react';
import styles from "./WithdrawTransactions.module.css";
import Withdrawal from "@/components/bridge/Withdrawal";
import {useBlockchainContext} from "@/components/bridge/BlockchainContext";
import {Icon} from "summon-ui";
import {useNavigate} from "react-router-dom";
import { useMessages} from "@/hooks/useL2ToL1MessageStatus";
import {L2_CHAIN} from "../../../constants";

interface WithdrawTransactionsProps {
}
const WithdrawTransactions: React.FC<WithdrawTransactionsProps> = () => {
    // const [filter, setFilter] = useState<'PENDING' | 'SETTLED'>("PENDING");
    // const handleFilterClick = () => {
    //     setFilter((prev) => prev === 'PENDING' ? 'SETTLED' : 'PENDING')
    // }

    const {connectedAccount} = useBlockchainContext();
    const messages= useMessages(connectedAccount, L2_CHAIN)



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
        {messages.data && (
            <div className={styles.transactions}>
                <div className={styles.withdrawsGrid}>
                    {headers.map((h) => <div className={styles.transactionsHeader} key={h}>{h}</div>)}
                    {messages.data.reverse().map((tx: any, idx: number) => <Withdrawal txHash={tx.txHash} chainId={tx.chainId} key={idx} delay={tx.delay}/>)}
                </div>
            </div>
        )}

    </div>
  </div>
  );
};

export default WithdrawTransactions;
