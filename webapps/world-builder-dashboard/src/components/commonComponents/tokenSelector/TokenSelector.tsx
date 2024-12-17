import styles from './TokenSelector.module.css'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconCheck from '@/assets/IconCheck'
import IconChevronDown from '@/assets/IconChevronDown'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { Token } from '@/utils/tokens'
type TokenSelectorProps = {
  tokens: Token[]
  selectedToken: Token
  onChange: (token: Token) => void
  onTokenAdded: () => void
  selectedChainId: number
} & InputBaseProps

const TokenSelector = ({ tokens, onChange, selectedToken }: TokenSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const { selectedHighNetwork, selectedLowNetwork } = useBlockchainContext()

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = tokens.find((n: Token) => String(n.address) === val)
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
          leftSection={<selectedToken.Icon />}
          rightSection={tokens && tokens.length > 0 ? <IconChevronDown className={styles.chevron} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          <span className={styles.inputBaseNetworkName}>{selectedToken.symbol}</span>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {tokens.map((n: Token) => {
            const highNetworkChainId = String(selectedHighNetwork.chainId)
            const lowNetworkChainId = String(selectedLowNetwork.chainId)
            // can create token address map here
            const chainIds = Object.keys(n.tokenAddressMap ?? [])
            const isChainIdValid = chainIds.includes(highNetworkChainId) && chainIds.includes(lowNetworkChainId)
            if (!isChainIdValid) return
            return (
              <Combobox.Option value={String(n.address)} key={n.address}>
                <Group>
                  <div
                    className={
                      n.address === selectedToken.address ? styles.optionContainerSelected : styles.optionContainer
                    }
                  >
                    <div className={styles.optionLeftSection}>
                      {<n.Icon />}
                      {n.symbol}
                    </div>
                    {n.address === selectedToken.address && <IconCheck />}
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
export default TokenSelector
