import React, { useState, useEffect } from 'react';
import styles from './MultiTokenApproval.module.css';
import { Modal } from 'summon-ui/mantine';
import AllowanceSelector from '../allowance/AllowanceSelector';
import { ethers } from 'ethers';
import { useQueryClient } from 'react-query';
import { useMutation } from 'react-query';
import { Bridger } from 'game7-bridge-sdk';
import { useBlockchainContext } from '@/contexts/BlockchainContext';
import { getNetworks } from '../../../../constants';
import { Token } from '@/utils/tokens';
import IconCheck from '@/assets/IconCheck';
import IconClose from '@/assets/IconClose';

interface MultiTokenApprovalProps {
  showApproval: boolean
  setShowApproval: (showApproval: boolean) => void
  balance: string | undefined
  nativeBalance: string | undefined
  bridger: Bridger | undefined
  decimals: number | undefined
  tokens: Token[]
  startingTokenIndex: number
  onApprovalComplete: () => void
  gasFees: string[]
}

export const MultiTokenApproval: React.FC<MultiTokenApprovalProps> = ({ showApproval, setShowApproval, bridger, balance, nativeBalance, decimals, tokens, startingTokenIndex, onApprovalComplete, gasFees }) => {
  const { selectedNetworkType, getProvider, selectedNativeToken } = useBlockchainContext()
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
    const currentToken = tokens[currentTokenIndex];
    console.log('=== Initializing newAllowance ===', {
      currentTokenIndex,
      balance,
      nativeBalance,
      decimals: currentToken.decimals,
      tokenSymbol: currentToken.symbol
    });

    const initialAmount = currentTokenIndex === 0
      ? ethers.utils.parseUnits(balance || '0', decimals || 18)
      : ethers.utils.parseUnits(nativeBalance || '0', currentToken.decimals || 18);
    
    const calculatedAllowance = initialAmount.mul(25).div(100);
    console.log('Calculated allowance:', {
      initialAmount: initialAmount.toString(),
      calculatedAllowance: calculatedAllowance.toString(),
      decimals: currentToken.decimals
    });
    
    return calculatedAllowance;
  });

  useEffect(() => {
    const currentToken = tokens[currentTokenIndex];
    const initialAmount = currentTokenIndex === 0
      ? ethers.utils.parseUnits(balance || '0', decimals || 18)
      : ethers.utils.parseUnits(nativeBalance || '0', currentToken.decimals || 18);
    
    const calculatedAllowance = initialAmount.mul(25).div(100);
    console.log('Resetting allowance for new token:', {
      tokenSymbol: currentToken.symbol,
      decimals: currentToken.decimals,
      initialAmount: initialAmount.toString(),
      calculatedAllowance: calculatedAllowance.toString()
    });
    
    setNewAllowance(calculatedAllowance);
  }, [currentTokenIndex, balance, nativeBalance, decimals, tokens]);

  const approve = useMutation(
    async (amount: ethers.BigNumber) => {
      console.log('=== Starting Approval Process ===', {
        amount: amount.toString(),
        currentTokenIndex,
        tokenSymbol: tokens[currentTokenIndex].symbol
      });
      const currentToken = tokens[currentTokenIndex]
      const network = networks?.find((n) => n.chainId === bridger?.originNetwork.chainId)
      if (!network) throw new Error('Network not found')
      const provider = await getProvider(network)
      const signer = provider.getSigner()

      console.log('Approving token:', {
        currentIndex: currentTokenIndex,
        tokenSymbol: currentToken.symbol,
        isNative: currentTokenIndex === 1
      })

      const txApprove = currentTokenIndex === 0
        ? await bridger?.approve(amount, signer)
        : await bridger?.approveNative(newAllowance, signer)
        console.log(tokens.length)
      await txApprove?.wait()
      return { tx: txApprove, tokenSymbol: currentToken.symbol }
    },
    {
      onSuccess: ({ tokenSymbol }) => {
        console.log('=== Approval onSuccess ===')
        setApprovedTokens(prev => {
          const newSet = new Set([...prev, tokenSymbol])
          return newSet;
        })

        // If there's only one token, complete immediately
        if (tokens.length === 1) {
          handleAllApprovalsComplete()
          return
        }

        // Otherwise continue with multiple token logic
        if (currentTokenIndex < tokens.length - 1) {
          console.log('Moving to next token')
          setCurrentTokenIndex(prev => prev + 1)
        } else {
          console.log('All tokens approved, triggering completion')
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
    console.log('=== handleAllApprovalsComplete ===')
    console.log('Closing approval modal and triggering completion callback')
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
              Approve Tokens
            </div>
            <IconClose onClick={() => setShowApproval(false)} className={styles.closeButton} stroke="#fff" />
          </div>
          <div className={styles.modalSubtitle}>Approve the tokens you want to bridge</div>
        </div>
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
        <div className={styles.allowanceSection}>
          <div className={styles.allowanceContainer}>
            <div className={styles.allowanceTitle}>Allowance {currentTokenIndex === 0 ? `(${balance} available)` : `(${nativeBalance} available)`}</div>
            <AllowanceSelector
              token={tokens[currentTokenIndex]}
              balance={currentTokenIndex === 0
                ? ethers.utils.parseUnits(balance || '0', decimals || 18)
                : ethers.utils.parseUnits(nativeBalance || '0', tokens[currentTokenIndex].decimals || 18)
              }
              amount={currentTokenIndex === 0
                ? ethers.utils.parseUnits(balance || '0', decimals || 18).mul(25).div(100)
                : ethers.utils.parseUnits(nativeBalance || '0', tokens[currentTokenIndex].decimals || 18).mul(25).div(100)
              }
              onChange={(value) => setNewAllowance(value)}
              allowance={newAllowance}
              disabled={approve.isLoading}
            />
          </div>
          <div className={styles.hintText}>
            Set token limit to allow the bridge contract to perform token transfers on your behalf. It cannot move funds without your permission.
          </div>
          <div className={styles.hintBadge}>
            <div className={styles.hintBadgeText}>
              ~{gasFees[currentTokenIndex]} {selectedNativeToken?.symbol} will be used for gas
            </div>
          </div>
        </div>
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