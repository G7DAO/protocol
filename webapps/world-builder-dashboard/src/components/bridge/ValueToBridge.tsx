import React from 'react'
import styles from './BridgeView.module.css'

const balanceString = (balance: string | undefined, symbol: string) => {
  return `${balance ?? '0'} ${symbol} Available`
}

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
  title: string
  symbol: string
  value: string
  setValue: (value: string) => void
  balance: string | undefined
  rate: number
}
const ValueToBridge: React.FC<ValueToBridgeProps> = ({ title, setValue, value, balance, symbol, rate }) => {
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

  return (
    <div className={styles.valueBlockContainer}>
      <div className={styles.valueContainer}>
        <div className={styles.label}>{title}</div>
        <input className={styles.valueInput} value={value} onChange={(e) => setValue(e.target.value)} />
        <div className={styles.balance}>{formatCurrency(Number(value) * rate)}</div>
      </div>
      <div className={styles.symbolContainer}>
        {symbol && <div className={styles.symbol}>{symbol}</div>}
        <div className={styles.balanceContainer}>
          <div className={styles.balance}>{balanceString(balance, symbol)}</div>
          <button type={'button'} className={styles.maxButton} onClick={() => setValue(String(balance))}>
            MAX
          </button>
        </div>
      </div>
    </div>
  )
}

export default ValueToBridge
