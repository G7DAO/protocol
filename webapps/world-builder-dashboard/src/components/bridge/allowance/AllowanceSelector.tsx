import styles from './AllowanceSelector.module.css'
import { Icon } from 'summon-ui'
import { Combobox, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconCheck from '@/assets/IconCheck'

type AllowanceSelectorProps = {
  balance: number
  onChange: (newAllowance: number) => void
  allowance: number
  amount: number
} & InputBaseProps

const AllowanceSelector = ({ balance, onChange, allowance, amount }: AllowanceSelectorProps) => {
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
    >
      <Combobox.Target>
        <InputBase
          component='button'
          type='button'
          w={'100%'}
          color={'#344054'}
          pointer
          variant='unstyled'
          className={styles.container}
          rightSection={<Icon name={'ChevronDown'} color={'#667085'} />}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          {allowance}
          <button
            className={styles.button}
            onClick={(e) => {
              onChange(amount)
              e.stopPropagation()
            }}
          >
            MIN
          </button>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className={styles.dropdownContainer}>
        <Combobox.Options>
          {[25, 50, 75, 100].map((n) => (
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
