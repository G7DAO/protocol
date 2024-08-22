import styles from './AllowanceSelector.module.css'
import { Combobox, useCombobox } from 'summon-ui/mantine'
import IconCheck from '@/assets/IconCheck'
import IconChevronDown from '@/assets/IconChevronDown'

type AllowanceSelectorProps = {
  balance: number
  onChange: (newAllowance: number) => void
  allowance: number
  amount: number
  disabled: boolean
}

const AllowanceSelector = ({ balance, onChange, allowance, amount, disabled }: AllowanceSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        onChange(Number(val))
        combobox.closeDropdown()
      }}
      disabled={disabled}
    >
      <Combobox.Target>
        <div
          className={disabled ? styles.containerDisabled : styles.container}
          onClick={() => combobox.toggleDropdown()}
        >
          <div className={styles.value}>{allowance}</div>
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
            .filter((n) => (n * balance) / 100 >= amount)
            .map((n) => (
              <Combobox.Option className={styles.optionContainer} value={String((balance * n) / 100)} key={n}>
                <div className={styles.optionPercent}>{`${n}%`}</div>
                <div className={styles.optionValue}>{(balance * n) / 100}</div>
                {allowance === (balance * n) / 100 && <IconCheck />}
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default AllowanceSelector
