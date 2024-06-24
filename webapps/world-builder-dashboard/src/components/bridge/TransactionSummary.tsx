import React, {useState} from 'react';
import styles from "./TransactionSummary.module.css";
import parentStyles from './BridgeView.module.css'

const formatCurrency = (value: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formatter.format(value);
}

interface TransactionSummaryProps {
    address: string;
    transferTime: string;
    fee: number;
    value: number;
    gasBalance: number;
    ethRate: number;
    tokenSymbol: string;
    tokenRate: number;
    direction: "DEPOSIT" | "WITHDRAW";
}
const TransactionSummary: React.FC<TransactionSummaryProps> = ({direction, gasBalance, address, transferTime, fee, ethRate, tokenRate, tokenSymbol, value}) => {

  const [showFullAddress, setShowFullAddress] = useState(false);
  const getAddress = (address: string, showFullAddress: boolean) => {
      if (showFullAddress) { return address }
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
      <div className={styles.container}>
          <div className={parentStyles.label}>Transaction Summary</div>
          <div className={styles.divider}/>
          <div className={styles.dataRow} onMouseEnter={() => setShowFullAddress(true)} onMouseLeave={() => setShowFullAddress(false)}>
              <div className={styles.itemName}>-{'>'} To address</div>
              <div className={styles.address}>{getAddress(address, showFullAddress)}</div>
          </div>
          <div className={styles.dataRow}>
              <div className={styles.itemName}>Transfer time</div>
              <div className={styles.value}>{transferTime}</div>
          </div>
          <div className={styles.dataRow}>
              <div className={styles.itemName}>Estimated gas fee</div>
              <div className={styles.valueContainer}>
                  <div className={styles.value}>{`${fee} ${direction === 'DEPOSIT' ? 'ETH' : tokenSymbol}`}</div>
                  <div className={styles.valueNote}>{formatCurrency(fee * (direction === 'DEPOSIT' ? ethRate : tokenRate))}</div>
              </div>
          </div>
          {direction === "DEPOSIT" && (
              <div className={styles.dataRow}>
                  <div className={styles.itemName}>ETH available</div>
                  <div className={styles.valueContainer}>
                      <div className={styles.value}>{`${gasBalance} ETH`}</div>
                      <div className={styles.valueNote}>{formatCurrency(gasBalance * ethRate)}</div>
                  </div>
              </div>
          )}
          {direction === "WITHDRAW" && (
              <div className={styles.dataRow}>
                  <div className={styles.itemName}>{`${tokenSymbol} available`}</div>
                  <div className={styles.valueContainer}>
                      <div className={styles.value}>{`${gasBalance} ${tokenSymbol}`}</div>
                      <div className={styles.valueNote}>{formatCurrency(gasBalance * tokenRate)}</div>
                  </div>
              </div>
          )}
          <div className={styles.dataRow}>
              <div className={styles.itemName}>You will receive</div>
              <div className={styles.valueContainer}>
                  <div className={styles.value}>{`${value} ${tokenSymbol}`}</div>
                  <div className={styles.valueNote}>{formatCurrency(value * tokenRate)}</div>
              </div>
          </div>
      </div>
  );
};

export default TransactionSummary;
