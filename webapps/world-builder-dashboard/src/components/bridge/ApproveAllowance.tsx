import React, { useState } from 'react'
import { useMutation } from 'react-query'
import styles from './ApproveAllowance.module.css'
import { ethers } from 'ethers'
import IconClose from '@/assets/IconClose'
import AllowanceSelector from '@/components/bridge/AllowanceSelector'
import { NetworkInterface, useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { approve } from '@/components/bridge/approveERC20'

interface ApproveAllowanceProps {
  onSuccess: () => void
  onClose: () => void
  allowance: number
  balance: number
  amount: number
}
const ApproveAllowance: React.FC<ApproveAllowanceProps> = ({ amount, onClose, onSuccess, balance, allowance }) => {
  const [isCloseIconHovered, setIsCloseButtonHovered] = useState(false)
  const [newAllowance, setNewAllowance] = useState(String(balance))
  const { selectedLowNetwork, connectedAccount } = useBlockchainContext()
  // const [error, setError] = useState('')

  const approveAllowanse = useMutation(
    ({ allowance, network }: { allowance: string; network: NetworkInterface }) => {
      if (!connectedAccount) {
        throw new Error("Wallet isn't connected")
      }
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        return approve(allowance, signer, network)
      }
      throw new Error('no window.ethereum')
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
    if (approveAllowanse.isSuccess) {
      onSuccess()
    } else {
      approveAllowanse.mutate({ allowance: newAllowance, network: selectedLowNetwork })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleAndCloseButton}>
          <div className={styles.title}>Approve Allowance</div>
          <IconClose
            onClick={onClose}
            onMouseEnter={() => setIsCloseButtonHovered(true)}
            onMouseLeave={() => setIsCloseButtonHovered(false)}
            className={styles.closeButton}
            stroke={isCloseIconHovered ? '#475467' : undefined}
          />
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
              onChange={(value) => setNewAllowance(String(value))}
              allowance={Number(newAllowance)}
            />
            <button className={styles.minButton} onClick={() => setNewAllowance(String(amount))}>
              MIN
            </button>
          </div>
        </div>
        <div className={styles.hintText}>
          {`You have ${allowance} tokens allowed but need ${amount} allowed. Please select an amount you are comfortable with.`}
        </div>
      </div>
      <button className={styles.approveButton} onClick={handleApprove}>
        {approveAllowanse.isLoading ? 'Approving...' : approveAllowanse.isSuccess ? 'Allowance approved' : 'Approve'}
      </button>
    </div>
  )
}

export default ApproveAllowance
