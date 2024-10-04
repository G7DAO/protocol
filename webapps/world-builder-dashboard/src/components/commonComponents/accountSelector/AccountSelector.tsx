import styles from './AccountSelector.module.css'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconCheck from '@/assets/IconCheck'
import IconChevronDownSelector from '@/assets/IconChevronDownSelector'

export type AccountType = 'External Address' | 'Connected Account'

type AccountSelectorProps = {
  values: AccountType[]
  selectedValue: AccountType 
  onChange: (value: AccountType) => void
} & InputBaseProps

const AccountSelector = ({ values, onChange, selectedValue }: AccountSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = values.find((n) => String(n) === val)
        if (newSelection) {
          onChange(newSelection)
        }
        combobox.closeDropdown()
      }}
      classNames={{ options: styles.options, option: styles.option, dropdown: styles.dropdown }}
    >
      <Combobox.Target>
        <InputBase
          component='button'
          className={styles.inputBase}
          pointer
          variant='unstyled'
          rightSection={values.length > 0 ? <IconChevronDownSelector className={styles.chevron} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          <span className={styles.inputBaseNetworkName}>{selectedValue}</span>
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {values
            .sort((a, b) => {
              if (a === selectedValue) return 1
              if (b === selectedValue) return -1
              return 0
            })
            .map((n) => (
              <Combobox.Option value={n} key={n}>
                <Group>
                  <div
                    className={
                      n === selectedValue ? styles.optionContainerSelected : styles.optionContainer
                    }
                  >
                    <div className={styles.optionLeftSection}>
                      {n}
                    </div>
                    {n === selectedValue && <IconCheck />}
                  </div>
                </Group>
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default AccountSelector
