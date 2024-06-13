import React from 'react';
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
    ethBalance: number;
    ethRate: number;
    tokenSymbol: string;
    tokenRate: number;
}
const TransactionSummary: React.FC<TransactionSummaryProps> = ({ethBalance, address, transferTime, fee, ethRate, tokenRate, tokenSymbol, value}) => {

  return (
      <div className={styles.container}>
          <div className={parentStyles.label}>Transaction Summary</div>
          <div className={styles.divider}/>
          <div className={styles.dataRow}>
              <div className={styles.itemName}>-{'>'} To address</div>
              <div className={styles.address}>{address}</div>
          </div>
          <div className={styles.dataRow}>
              <div className={styles.itemName}>Transfer time</div>
              <div className={styles.value}>{transferTime}</div>
          </div>
          <div className={styles.dataRow}>
              <div className={styles.itemName}>Estimated gas fee</div>
              <div className={styles.valueContainer}>
                  <div className={styles.value}>{`${fee} ETH`}</div>
                  <div className={styles.valueNote}>{formatCurrency(fee * ethRate)}</div>
              </div>
          </div>
          <div className={styles.dataRow}>
              <div className={styles.itemName}>ETH available</div>
              <div className={styles.valueContainer}>
                  <div className={styles.value}>{`${ethBalance} ETH`}</div>
                  <div className={styles.valueNote}>{formatCurrency(ethBalance * ethRate)}</div>
              </div>
          </div>
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
