import React, {useState} from 'react'
import styles from './ValueToBridge.module.css'
import IconTokenSymbol from "@/assets/IconTokenSymbol";



const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(value)
}

interface ValueToBridgeProps {
  symbol: string
  value: string
  setValue: (value: string) => void
  balance: string | undefined
  rate: number
  isFetchingBalance?: boolean
}
const ValueToBridge: React.FC<ValueToBridgeProps> = ({ setValue, value, balance, symbol, rate, isFetchingBalance }) => {
  // const [balanceRepresentation, setBalanceRepresentation] = useState('0');
  // const [balanceHasChanged, setBalanceHasChanged] = useState(false);
  //
  // useEffect(() => {
  //     if (balance !== balanceRepresentation && balance) {
  //         setBalanceHasChanged(true);
  //         setTimeout(() => {
  //             setBalanceRepresentation(balance);
  //             setBalanceHasChanged(false);
  //         }, 1000)
  //     }
  // }, [balance]);

  const [errorMsg] = useState("");
  return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.label}>Amount</div>
          <div className={styles.label}>{errorMsg}</div>
        </div>
        <div className={styles.inputGroup}>
          <input className={styles.input} value={value} onChange={(e) => setValue(e.target.value)} />
          <button className={styles.maxButton} onClick={() => setValue(String(balance))}>MAX</button>
          <div className={styles.tokenGroup}>
            <IconTokenSymbol />
            <div className={styles.tokenSymbol}>
              G7T
            </div>
          </div>
        </div>
        <div className={styles.header}>
          <div className={styles.label}>
            {formatCurrency(Number(value) * rate)}
          </div>
          <div className={styles.available}>
            <div className={`${styles.label} ${isFetchingBalance ? styles.blink : ''}`}>
              {balance ?? '0'}
            </div>
            <div className={styles.label}>
              {`${symbol} Available`}
            </div>
          </div>
        </div>
      </div>

  )
}

export default ValueToBridge
