import React from 'react';
import styles from "./WithdrawTransactions.module.css";
import useL2ToL1MessageStatus from "@/hooks/useL2ToL1MessageStatus";
import {L2_CHAIN, L3_NATIVE_TOKEN_SYMBOL} from "../../../constants";
import {L3_NETWORKS} from "@/components/bridge/l3Networks";
import {L2ToL1MessageStatus} from "@arbitrum/sdk";

const timeAgo = (timestamp: number)  => {
  const now = new Date().getTime();
  const date = new Date(Number(timestamp) * 1000).getTime();
  const timeDifference = Math.floor((now - date) / 1000); // Difference in seconds

  const units = [
    { name: 'year',   inSeconds: 60 * 60 * 24 * 365 },
    { name: 'month',  inSeconds: 60 * 60 * 24 * 30 },
    { name: 'day',    inSeconds: 60 * 60 * 24 },
    { name: 'hour',   inSeconds: 60 * 60 },
    { name: 'minute', inSeconds: 60 },
    { name: 'second', inSeconds: 1 },
  ];
  console.log(timestamp, date, now, timeDifference);

  for (const unit of units) {
    const value = Math.floor(timeDifference / unit.inSeconds);
    if (value >= 1) {
      return `${value} ${unit.name}${value > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

const networkName = (chainId: number) => {
    const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId);
    return network?.chainInfo.chainName;
}

interface WithdrawalProps {
  txHash: string;
  chainId: number;
}
const Withdrawal: React.FC<WithdrawalProps> = ({txHash, chainId}) => {

  const status = useL2ToL1MessageStatus(txHash, chainId);

  return (
      <>
          <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
          <div className={styles.gridItem}>{`${status.data?.value} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
          <div className={styles.gridItem}>{networkName(chainId) ?? ''}</div>
          <div className={styles.gridItem}>{L2_CHAIN.displayName}</div>
          {status.data?.status === L2ToL1MessageStatus.EXECUTED && <div className={styles.gridItem}><div className={styles.settled}>Settled</div> </div>}
          {status.data?.status === L2ToL1MessageStatus.CONFIRMED && <div className={styles.gridItem}><div className={styles.claimable}>Claimable</div> </div>}
          {status.data?.status === L2ToL1MessageStatus.UNCONFIRMED && <div className={styles.gridItem}><div className={styles.pending}>Pending</div> </div>}

          <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
      </>
  );
};

export default Withdrawal;
