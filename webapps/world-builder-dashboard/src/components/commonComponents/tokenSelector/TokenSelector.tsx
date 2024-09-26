import { useState } from 'react'
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

const TokenSelector = ({ tokens, onChange, selectedToken, onTokenAdded, selectedChainId }: TokenSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const [tokenAddress, setTokenAddress] = useState<string>('')
  const { connectedAccount } = useBlockchainContext()

  const addToken = (tokenAddress: string) => {
    const storageKey = `${connectedAccount}-${selectedChainId}`
    const existingTokens = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const token = {
      name: tokenAddress,
      symbol: 'TEST',
      address: tokenAddress,
      rpc: ''
    }

    const updatedTokens = [...existingTokens, token]
    localStorage.setItem(storageKey, JSON.stringify(updatedTokens))
    onTokenAdded()
  }

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
          {tokens
            .sort((a, b) => {
              if (a.address === selectedToken.address) return 1
              if (b.address === selectedToken.address) return -1
              return 0
            })
            .map((n) => (
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
            ))}
          {/* <Combobox>
            <Group>
            </Group>
          </Combobox> */}
        </Combobox.Options>
        <div className={styles.tokenAdderContainer}>
          <input
            className={styles.tokenAddressInput}
            value={tokenAddress}
            placeholder='Token address'
            onChange={(e) => {
              setTokenAddress(e.target.value)
            }}
          />
          <div className={styles.importButton} onClick={() => addToken(tokenAddress)}>
            <div className={styles.importText}>Import</div>
          </div>
        </div>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default TokenSelector
