import { L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../../../constants'
import styles from './NetworkSelector.module.css'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconArbitrumOne from '@/assets/IconArbitrumOne'
import IconCheck from '@/assets/IconCheck'
import IconChevronDown from '@/assets/IconChevronDown'
import IconEthereum from '@/assets/IconEthereum'
import IconG7T from '@/assets/IconG7T'
import { HighNetworkInterface, NetworkInterface } from '@/contexts/BlockchainContext'
import { Token } from '@/utils/tokens'

type NetworkSelectorProps = {
  networks: NetworkInterface[]
  selectedNetwork: NetworkInterface
  onChange: (network: NetworkInterface | HighNetworkInterface) => void
  selectedToken: Token
} & InputBaseProps

const NetworkSelector = ({ networks, onChange, selectedNetwork, selectedToken }: NetworkSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const networkLogo = (chainId: number) => {
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
      classNames={{ options: styles.options, option: styles.option, dropdown: styles.dropdown }}
    >
      <Combobox.Target>
        <InputBase
          component='button'
          className={styles.inputBase}
          pointer
          variant='unstyled'
          leftSection={networkLogo(selectedNetwork.chainId)}
          rightSection={networks.length > 1 ? <IconChevronDown className={styles.chevron} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          <span className={styles.inputBaseNetworkName}>{selectedNetwork.displayName}</span>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {networks.map((n) => {
            const chainIds = Object.keys(selectedToken.tokenAddressMap)
            const isDisabled = chainIds.includes(String(n.chainId))
            return (
              <Combobox.Option value={String(n.chainId)} key={n.chainId} disabled={!isDisabled}>
                <Group>
                  <div
                    className={
                      n.chainId === selectedNetwork.chainId ? styles.optionContainerSelected : styles.optionContainer
                    }
                  >
                    <div className={styles.optionLeftSection}>
                      {networkLogo(n.chainId)}
                      {n.displayName}
                    </div>
                    {n.chainId === selectedNetwork.chainId && <IconCheck />}
                  </div>
                </Group>
              </Combobox.Option>
            )
          })}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default NetworkSelector
