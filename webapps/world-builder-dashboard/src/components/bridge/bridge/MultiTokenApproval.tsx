import React, { useState } from 'react';
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

interface MultiTokenApprovalProps {
  showApproval: boolean
  setShowApproval: (showApproval: boolean) => void
  balance: string | undefined
  amount: string
  bridger: Bridger | undefined
  decimals: number | undefined
  tokens: Token[]
}

export const MultiTokenApproval: React.FC<MultiTokenApprovalProps> = ({ showApproval, setShowApproval, bridger, amount, balance, decimals, tokens }) => {
  const { selectedNetworkType, getProvider } = useBlockchainContext()
  const queryClient = useQueryClient()
  const networks = getNetworks(selectedNetworkType)
  const [newAllowance, setNewAllowance] = useState(ethers.utils.parseUnits(amount || '0', 18))
  const [approvedTokens, setApprovedTokens] = useState<Set<string>>(new Set())
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0)
  
  const approve = useMutation(
    async (amount: ethers.BigNumber) => {
      const currentToken = tokens[currentTokenIndex];
      const network = networks?.find((n) => n.chainId === bridger?.originNetwork.chainId)!
      const provider = await getProvider(network)
      const signer = provider.getSigner()
      const txApprove = await bridger?.approve(amount, signer)
      await txApprove?.wait()
      return { tx: txApprove, tokenSymbol: currentToken.symbol }
    },
    {
      onSuccess: ({tokenSymbol}) => {
        setApprovedTokens(prev => new Set([...prev, tokenSymbol]))
        if (currentTokenIndex < tokens.length - 1) {
          setCurrentTokenIndex(prev => prev + 1)
        }
        queryClient.refetchQueries(['ERC20Balance'])
      },
      onError: (e) => {
        console.log(e)
      }
    }
  )
  
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
          <div className={styles.modalTitle}>Approve Tokens</div>
          <div className={styles.modalSubtitle}>Approve the tokens you want to bridge</div>
        </div>
        <div className={styles.space} />
        <div className={styles.tokenApprovalBarContainer}>
          <div className={styles.barContainer}>
            {tokens.map((token) => (
              <div key={token.symbol} className={styles.bar}>
                <div className={styles.barTitle}>Approve {token.symbol}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.allowanceSection}>
          <div className={styles.allowanceContainer}>
            <div className={styles.allowanceTitle}>Allowance {balance ? `(${balance} available)` : ''}</div>
            <AllowanceSelector
              token={tokens[currentTokenIndex]}
              balance={ethers.utils.parseUnits(balance || '0', decimals || 18)}
              amount={ethers.utils.parseUnits(amount || '0', decimals || 18)}
              onChange={(value) => setNewAllowance(value)}
              allowance={newAllowance}
              disabled={approve.isLoading}
              decimals={decimals || 18}
            />
          </div>
          <div className={styles.hintText}>
            Set token limit to allow the bridge contract to perform token transfers on your behalf. It cannot move funds without your permission.
          </div>
          <div className={styles.hintBadge}>
            <div className={styles.hintBadgeText}>
              ~0.0001 Arbitrum One ETH will be used for gas
            </div>
          </div>
        </div>
        <div className={styles.buttonSpacer} />
        <div className={styles.buttonSection}>
          <div className={styles.button}>
            <div className={styles.buttonText}>Approve</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
