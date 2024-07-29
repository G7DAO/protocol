import { L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../../constants'
import styles from './BridgeView.module.css'
import { Icon } from 'summon-ui'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconArbitrumOne from '@/assets/IconArbitrumOne'
import IconEthereum from '@/assets/IconEthereum'
import IconG7T from '@/assets/IconG7T'
import { HighNetworkInterface, NetworkInterface } from '@/components/bridge/BlockchainContext'

type NetworkSelectorProps = {
  networks: NetworkInterface[]
  selectedNetwork: NetworkInterface
  onChange: (network: NetworkInterface | HighNetworkInterface) => void
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
  const icon = (chainId: number) => {
    switch (chainId) {
      case L1_NETWORK.chainId:
        return <IconEthereum />
      case L2_NETWORK.chainId:
        return <IconArbitrumOne />
      case L3_NETWORK.chainId:
        return <IconG7T />
      default:
        return <></>
    }
  }

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = networks.find((n) => String(n.chainId) === val)
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
          leftSection={
            selectedNetwork.chainId === L3_NETWORK.chainId ? (
              <IconG7T />
            ) : selectedNetwork.chainId === L1_NETWORK.chainId ? (
              <IconEthereum />
            ) : (
              <IconArbitrumOne />
            )
          }
          rightSection={networks.length > 1 ? <Icon name={'ChevronDown'} color={'#667085'} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          {selectedNetwork.displayName}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {networks.map((n) => (
            <Combobox.Option className='!px-0' value={String(n.chainId)} key={n.chainId}>
              <Group>
                {icon(n.chainId)}
                {n.displayName}
              </Group>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default NetworkSelector
