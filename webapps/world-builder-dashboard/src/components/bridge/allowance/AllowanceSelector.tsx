import styles from './AllowanceSelector.module.css'
import { ethers } from 'ethers'
import { Combobox, Tooltip, useCombobox } from 'summon-ui/mantine'
import IconAlertCircle from '@/assets/IconChevronDownToggle'
import IconCheck from '@/assets/IconCheck'
import IconChevronDown from '@/assets/IconChevronDown'
import { Token } from '@/utils/tokens'

type AllowanceSelectorProps = {
  balance: ethers.BigNumber
  onChange: (newAllowance: ethers.BigNumber) => void
  allowance: ethers.BigNumber
  amount: ethers.BigNumber
  disabled: boolean
  token: Token
}

const AllowanceSelector = ({ balance, onChange, allowance, amount, disabled, token }: AllowanceSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const amountInWei = ethers.utils.parseUnits(val, token.decimals)
        try {
          onChange(ethers.BigNumber.from(amountInWei))
        } catch (e) {
          console.log(e)
        }
        combobox.closeDropdown()
      }}
      disabled={disabled}
    >
      <Combobox.Target>
        <div
          className={disabled ? styles.containerDisabled : styles.container}
          onClick={() => combobox.toggleDropdown()}
        >
          <div className={styles.tokenAmountContainer}>
            {token?.Icon && <token.Icon />}
            <div className={styles.value}>
              {allowance.eq(ethers.constants.MaxUint256) 
                ? `Infinity ${token?.symbol}`
                : `${ethers.utils.formatUnits(allowance, token.decimals)} ${token?.symbol}`
              }
            </div>
          </div>
          <button
              className={styles.minButton}
            onClick={(e) => {
              onChange(amount)
              e.stopPropagation()
            }}
            disabled={disabled}
          >
            MIN
          </button>
          <IconChevronDown className={styles.chevron} />
        </div>
      </Combobox.Target>
      <Combobox.Dropdown className={styles.dropdownContainer}>
        <Combobox.Options>
          {[25, 50, 75, 100]
            .map((n) => {
              const percentage = balance.mul(ethers.BigNumber.from(n)).div(ethers.BigNumber.from(100))
              return { n, percentage }
            })
            .filter(({ percentage }) => percentage.gt(amount))
            .map(({ n, percentage }) => (
              <Combobox.Option className={styles.optionContainer} value={ethers.utils.formatUnits(percentage, token.decimals)} key={n}>
                <div className={styles.optionPercent}>{`${n}%`}</div>
                <div className={styles.optionValue}>{ethers.utils.formatUnits(percentage, token.decimals)} {token?.symbol}</div>
                {allowance.eq(percentage) && <IconCheck />}
              </Combobox.Option>
            ))}
          <Combobox.Option
            className={styles.optionContainer}
            value={ethers.utils.formatEther(ethers.constants.MaxUint256)}
          >
            <div className={styles.optionPercent}>Infinite</div>
            <div className={styles.optionValue}>
              (Testnet Only)
              <Tooltip arrowSize={8} radius={'8px'} label={'For developers and testnet purposes only.'} withArrow>
                <IconAlertCircle className={styles.chevron} />
              </Tooltip>
            </div>

            {allowance.eq(ethers.constants.MaxUint256) && <IconCheck />}
          </Combobox.Option>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default AllowanceSelector
