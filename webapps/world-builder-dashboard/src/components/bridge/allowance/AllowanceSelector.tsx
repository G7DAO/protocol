import styles from './AllowanceSelector.module.css'
import { ethers } from 'ethers'
import { Combobox, useCombobox } from 'summon-ui/mantine'
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

  const formatAllowanceDisplay = () => {
    if (allowance.eq(ethers.constants.MaxUint256)) {
      return `Infinite ${token?.symbol}`
    }
    const formattedAllowance = ethers.utils.formatUnits(allowance, token.decimals)
    return `${formattedAllowance} ${token?.symbol}`
  }

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        try {
          const amountInWei = ethers.utils.parseUnits(val, token.decimals)
          onChange(amountInWei)
        } catch (e) {
          console.error('Error parsing units:', e)
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
              {formatAllowanceDisplay()}
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
            // Only show percentages that are greater than the required amount
            .filter(({ percentage }) => percentage.gte(amount))
            .map(({ n, percentage }) => (
              <Combobox.Option
                className={styles.optionContainer}
                value={ethers.utils.formatUnits(percentage, token.decimals)}
                key={n}
              >
                <div className={styles.optionPercent}>{`${n}%`}</div>
                <div className={styles.optionValue}>
                  {ethers.utils.formatUnits(percentage, token.decimals)} {token?.symbol}
                </div>
                {allowance.eq(percentage) && <IconCheck />}
              </Combobox.Option>
            ))}
          <Combobox.Option
            className={styles.optionContainer}
            value={ethers.utils.formatUnits(ethers.constants.MaxUint256, token.decimals)}
          >
            <div className={styles.optionPercent}>Infinite</div>

            {allowance.eq(ethers.constants.MaxUint256) && <IconCheck />}
          </Combobox.Option>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default AllowanceSelector
