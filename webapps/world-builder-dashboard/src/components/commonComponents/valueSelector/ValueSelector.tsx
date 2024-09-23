import styles from './ValueSelector.module.css'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconCheck from '@/assets/IconCheck'
import IconChevronDown from '@/assets/IconChevronDown'

export interface ValueSelect {
  valueId: number,
  displayName: string
}

type ValueSelectorProps = {
  values: ValueSelect[]
  selectedValue: ValueSelect
  onChange: (value: ValueSelect) => void
} & InputBaseProps

const ValueSelector = ({ values, onChange, selectedValue }: ValueSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = values.find((n) => String(n.valueId) === val)
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
          rightSection={values.length > 1 ? <IconChevronDown className={styles.chevron} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          <span className={styles.inputBaseNetworkName}>{selectedValue.displayName}</span>
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {values
            .sort((a, b) => {
              if (a.valueId === selectedValue.valueId) return 1
              if (b.valueId === selectedValue.valueId) return -1
              return 0
            })
            .map((n) => (
              <Combobox.Option value={String(n.valueId)} key={n.valueId}>
                <Group>
                  <div
                    className={
                      n.valueId === selectedValue.valueId ? styles.optionContainerSelected : styles.optionContainer
                    }
                  >
                    <div className={styles.optionLeftSection}>
                      {n.displayName}
                    </div>
                    {n.valueId === selectedValue.valueId && <IconCheck />}
                  </div>
                </Group>
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default ValueSelector
