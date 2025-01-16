import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import styles from './ApproveAllowance.module.css'
import { ethers } from 'ethers'
import IconClose from '@/assets/IconClose'
import AllowanceSelector from '@/components/bridge/allowance/AllowanceSelector'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { ERC20AllowanceProps } from '@/types'
import { approve } from '@/utils/bridge/approveERC20'
import { formatBigNumber } from '@/utils/web3utils'
interface ApproveAllowanceProps {
  onSuccess: () => void
  onClose: () => void
  amount: ethers.BigNumber
  balance: ethers.BigNumber
  allowanceProps: ERC20AllowanceProps
}
const ApproveAllowance: React.FC<ApproveAllowanceProps> = ({ amount, balance, onClose, onSuccess, allowanceProps }) => {
  const [newAllowance, setNewAllowance] = useState(amount)
  const { getProvider, selectedBridgeToken } = useBlockchainContext()

  const approveAllowance = useMutation({
    mutationFn: async ({
      newAllowance,
      allowanceProps
    }: {
      newAllowance: ethers.BigNumber
      allowanceProps: ERC20AllowanceProps
    }) => {
      const provider = await getProvider(allowanceProps.network)
      const signer = provider.getSigner()
      return approve(newAllowance, signer, allowanceProps.tokenAddress, allowanceProps.spender)
    },
    onSuccess: () => {
      setTimeout(() => onSuccess(), 2000)
    },
    onError: (e: Error) => {
      console.log(e)
    }
  })

  const handleApprove = () => {
    if (approveAllowance.isSuccess) {
      onSuccess()
    } else {
      approveAllowance.mutateAsync({ newAllowance, allowanceProps })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleAndCloseButton}>
          <div className={styles.titleAndCloseButtonContainer}>
            <div className={styles.title}>
              Approve Allowance
            </div>
            <IconClose onClick={onClose} className={styles.closeButton} />
          </div>
        </div>
        <div className={styles.supportingText}>
          We need permission for token allowances in order to facilitate transactions.
        </div>
        <div className={styles.divider} />
      </div>
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <div className={styles.inputLabel}>{`Allowance (${formatBigNumber(balance)} Avail.)`}</div>
          <div className={styles.inputRow}>
            <AllowanceSelector
              balance={balance}
              amount={amount}
              onChange={(value) => setNewAllowance(value)}
              allowance={newAllowance}
              disabled={approveAllowance.isPending}
              token={selectedBridgeToken}
            />
          </div>
        </div>
        <div className={styles.hintText}>
          Set token limit to allow the bridge contract to perform token transfers on your behalf. It cannot move funds
          without your permission.
        </div>
      </div>
      <button className={styles.approveButton} onClick={handleApprove} disabled={approveAllowance.isPending}>
        <div className={approveAllowance.isPending ? styles.approveButtonLabelLoading : styles.approveButtonLabel}>
          {approveAllowance.isPending ? 'Approving...' : approveAllowance.isSuccess ? 'Allowance approved' : 'Approve'}
        </div>
      </button>
    </div>
  )
}

export default ApproveAllowance
