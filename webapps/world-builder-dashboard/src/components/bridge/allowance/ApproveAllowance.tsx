import React, { useState } from 'react'
import { useMutation } from 'react-query'
import styles from './ApproveAllowance.module.css'
import { ethers } from 'ethers'
import IconClose from '@/assets/IconClose'
import AllowanceSelector from '@/components/bridge/allowance/AllowanceSelector'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { approve } from '@/utils/bridge/approveERC20'

interface ApproveAllowanceProps {
  onSuccess: () => void
  onClose: () => void
  allowance: number
  balance: number
  amount: number
}
const ApproveAllowance: React.FC<ApproveAllowanceProps> = ({ amount, onClose, onSuccess, balance, allowance }) => {
  const [newAllowance, setNewAllowance] = useState(String(balance))
  const { selectedLowNetwork, connectedAccount } = useBlockchainContext()

  const approveAllowance = useMutation(
    ({ allowance, network }: { allowance: string; network: NetworkInterface }) => {
      if (!connectedAccount) {
        throw new Error("Wallet isn't connected")
      }
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        return approve(allowance, signer, network)
      }
      throw new Error("Wallet isn't installed")
    },
    {
      onSuccess: () => {
        setTimeout(() => onSuccess(), 2000)
      },
      onError: (e: Error) => {
        console.log(e)
      }
    }
  )

  const handleApprove = () => {
    if (approveAllowance.isSuccess) {
      onSuccess()
    } else {
      approveAllowance.mutate({ allowance: newAllowance, network: selectedLowNetwork })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleAndCloseButton}>
          <div className={styles.title}>Approve Allowance</div>
          <IconClose onClick={onClose} className={styles.closeButton} />
        </div>
        <div className={styles.supportingText}>
          {allowance && allowance > 0
            ? 'We need permission for higher token allowances in order to facilitate this transaction.'
            : 'Our contracts need permission to interact with your tokens on your behalf.'}
        </div>
        <div className={styles.divider} />
      </div>
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <div className={styles.inputLabel}>{`Allowance (${balance} Avail.)`}</div>
          <div className={styles.inputRow}>
            <AllowanceSelector
              balance={balance}
              amount={amount}
              onChange={(value) => setNewAllowance(String(value))}
              allowance={Number(newAllowance)}
            />
          </div>
        </div>
        <div className={styles.hintText}>
          {`You have ${allowance} tokens allowed but need ${amount} allowed. Please select an amount you are comfortable with.`}
        </div>
      </div>
      <button className={styles.approveButton} onClick={handleApprove}>
        {approveAllowance.isLoading ? 'Approving...' : approveAllowance.isSuccess ? 'Allowance approved' : 'Approve'}
      </button>
    </div>
  )
}

export default ApproveAllowance