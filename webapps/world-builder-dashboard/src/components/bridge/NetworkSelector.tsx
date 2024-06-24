import styles from './BridgeView.module.css'
import { Icon } from 'summon-ui'
import { Combobox, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import { L3NetworkConfiguration } from '@/components/bridge/l3Networks'

type NetworkSelectorProps = {
  networks: L3NetworkConfiguration[]
  selectedNetwork: L3NetworkConfiguration
  onChange: (network: L3NetworkConfiguration) => void
} & InputBaseProps

const NetworkSelector = ({ networks, onChange, selectedNetwork }: NetworkSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const leftSection = (
    <div
      style={{
        marginLeft: '-10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        fontWeight: '900',
        fontSize: '13px',
        color: '#FFF',
        backgroundColor: '#EF233B'
      }}
    >
      L3
    </div>
  )

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = networks.find((n) => String(n.chainInfo.chainId) === val)
        if (newSelection) {
          onChange(newSelection)
        }
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          component='button'
          className={styles.networkSelectSelect}
          pointer
          variant='unstyled'
          leftSection={leftSection}
          rightSection={networks.length > 1 ? <Icon name={'ChevronDown'} color={'#667085'} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          {selectedNetwork.chainInfo.chainName}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {networks.map((n) => (
            <Combobox.Option className='!px-0' value={String(n.chainInfo.chainId)} key={n.chainInfo.chainId}>
              {n.chainInfo.chainName}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default NetworkSelector
