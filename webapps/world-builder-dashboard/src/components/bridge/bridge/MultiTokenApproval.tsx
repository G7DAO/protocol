import React, { useState, useEffect } from 'react'
import styles from './MultiTokenApproval.module.css'
import { Modal } from 'summon-ui/mantine'
import AllowanceSelector from '../allowance/AllowanceSelector'
import { ethers } from 'ethers'
import { useQueryClient } from 'react-query'
import { useMutation } from 'react-query'
import { Bridger } from 'game7-bridge-sdk'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { getNetworks } from '../../../../constants'
import { Token } from '@/utils/tokens'
import IconCheck from '@/assets/IconCheck'
import IconClose from '@/assets/IconClose'

interface MultiTokenApprovalProps {
  showApproval: boolean
  setShowApproval: (showApproval: boolean) => void
  balance: string | undefined
  nativeBalance: string | undefined
  bridger: Bridger | null
  decimals: number | undefined
  tokens: Token[]
  startingTokenIndex: number
  onApprovalComplete: () => void
  gasFees: string[]
  amount: string
}

export const MultiTokenApproval: React.FC<MultiTokenApprovalProps> = ({ showApproval, setShowApproval, bridger, balance, nativeBalance, decimals, tokens, startingTokenIndex, onApprovalComplete, gasFees, amount }) => {
  const { selectedNetworkType, getProvider } = useBlockchainContext()
  const queryClient = useQueryClient()
  const networks = getNetworks(selectedNetworkType)

  // Initialize approvedTokens with already approved tokens
  const initialApprovedTokens = new Set(
    tokens
      .filter((_, index) => index < startingTokenIndex)
      .map(token => token.symbol)
  )
  const [approvedTokens, setApprovedTokens] = useState<Set<string>>(initialApprovedTokens)
  const [currentTokenIndex, setCurrentTokenIndex] = useState(startingTokenIndex)
  const [newAllowance, setNewAllowance] = useState(() => {
    const currentToken = tokens[currentTokenIndex]
    if (currentTokenIndex === 1) {
      const gasFeeAmount = ethers.utils.parseUnits(
        (gasFees[1] === '0' ? amount : gasFees[1]) || amount,
        currentToken.decimals || 18
      )
      return gasFeeAmount
    }
    return currentTokenIndex === 0
      ? ethers.utils.parseUnits(amount || '0', decimals || 18)
      : ethers.utils.parseUnits(amount || '0', currentToken.decimals || 18)
  })

  const [allowanceInitialized, setAllowanceInitialized] = useState(false)

  useEffect(() => {
    if (currentTokenIndex >= tokens.length) {
      console.warn('Invalid token index:', currentTokenIndex, 'tokens:', tokens)
      return
    }

    if (!allowanceInitialized && currentTokenIndex === 1) {
      const currentToken = tokens[currentTokenIndex]
      const gasFeeAmount = ethers.utils.parseUnits(
        (gasFees[1] === '0' ? amount : gasFees[1]) || amount,
        currentToken.decimals || 18
      )
      setNewAllowance(gasFeeAmount)
      setAllowanceInitialized(true)
    }
  }, [currentTokenIndex, tokens, amount, decimals, gasFees, allowanceInitialized])

  const approve = useMutation(
    async (amount: ethers.BigNumber) => {
      const currentToken = tokens[currentTokenIndex]
      const network = networks?.find((n) => n.chainId === bridger?.originNetwork.chainId)
      if (!network) throw new Error('Network not found')
      const provider = await getProvider(network)
      const signer = provider.getSigner()
      const txApprove = currentTokenIndex === 0
        ? await bridger?.approve(amount, signer)
        : await bridger?.approveNative(newAllowance, signer)
      await txApprove?.wait()
      return { tx: txApprove, tokenSymbol: currentToken.symbol }
    },
    {
      onSuccess: ({ tokenSymbol }) => {
        setApprovedTokens(prev => {
          const newSet = new Set([...prev, tokenSymbol])
          return newSet
        })

        // If there's only one token, complete immediately
        if (tokens.length === 1) {
          handleAllApprovalsComplete()
          return
        }

        // Otherwise continue with multiple token logic
        if (currentTokenIndex < tokens.length - 1) {
          setCurrentTokenIndex(prev => prev + 1)
        } else {
          handleAllApprovalsComplete()
        }
        queryClient.refetchQueries(['ERC20Balance'])
      },
      onError: (e) => {
        console.error('Approval error:', e)
      }
    }
  )

  const handleAllApprovalsComplete = () => {
    setShowApproval(false)
    onApprovalComplete()
  }

  return (
    <Modal
      opened={showApproval}
      radius={'12px'}
      onClose={() => setShowApproval(false)}
      withCloseButton={false}
      padding={'0px'}
      overlayProps={{
        color: 'rgba(57, 57, 57)',
        backgroundOpacity: 0.7,
        blur: 8
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.titleAndCloseButton}>
            <div className={styles.modalTitle}>
              {tokens.length === 1 ? 'Approve Allowance' : 'Approve Tokens'}
            </div>
            <IconClose onClick={() => setShowApproval(false)} className={styles.closeButton} stroke="#fff" />
          </div>
          <div className={styles.modalSubtitle}>Set limit to the token amount that can be processed through the bridge.
          </div>
        </div>
        {tokens.length > 1 && (
          <>
            <div className={styles.space} />
            <div className={styles.tokenApprovalBarContainer}>
              <div className={styles.barContainer}>
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    className={`${styles.bar} ${approvedTokens.has(token.symbol) ? styles.barApproved : ''}`}
                  >
                    <div className={styles.barTitleContainer}>
                      <div className={`${styles.barTitle} ${approvedTokens.has(token.symbol) ? styles.barTitleApproved : ''}`}>
                        Approve {token.symbol}
                      </div>
                      {approvedTokens.has(token.symbol) && <IconCheck stroke="#F04438" />}
                    </div>
                    {approve.isLoading && currentTokenIndex === tokens.indexOf(token) && (
                      <div className={styles.loadingBar} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {currentTokenIndex < tokens.length ? (
          <div className={styles.allowanceSection}>
            <div className={styles.allowanceContainer}>
              <div className={styles.allowanceTitle}>Allowance {currentTokenIndex === 0 ? `(${balance} available)` : `(${nativeBalance} available)`}</div>
              <AllowanceSelector
                token={tokens[currentTokenIndex]}
                balance={currentTokenIndex === 0
                  ? ethers.utils.parseUnits(balance || '0', decimals || 18)
                  : ethers.utils.parseUnits(nativeBalance || '0', tokens[currentTokenIndex].decimals || 18)
                }
                amount={ethers.utils.parseUnits(amount || '0', decimals || 18)}
                onChange={(value) => setNewAllowance(value)}
                allowance={newAllowance}
                disabled={approve.isLoading}
              />
            </div>
          </div>
        ) : (
          <div>Invalid token selection</div>
        )}
        <div className={styles.buttonSpacer} />
        <div className={styles.buttonSection}>
          <div onClick={() => approve.mutate(newAllowance)} className={`${styles.button} ${approve.isLoading ? styles.buttonLoading : ''}`}>
            <div className={`${styles.buttonText} ${approve.isLoading ? styles.buttonLoadingText : ''}`}>
              {approve.isLoading ? 'Approving...' : 'Approve'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
