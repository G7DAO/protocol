// External Libraries
import React, { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { ALL_NETWORKS } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import { Bridger } from 'game7-bridge-sdk'
import { Modal } from 'summon-ui/mantine'
// Absolute Imports
import ApproveAllowance from '@/components/bridge/allowance/ApproveAllowance'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import useERC20Balance from '@/hooks/useERC20Balance'
import { ZERO_ADDRESS } from '@/utils/web3utils'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  amount: number
  isDisabled: boolean
  L2L3message?: { destination: string; data: string }
  setErrorMessage: (arg0: string) => void
  bridger?: Bridger
  symbol?: string
}
const ActionButton: React.FC<ActionButtonProps> = ({
  amount,
  isDisabled,
  setErrorMessage,
  L2L3message,
  bridger,
  symbol
}) => {
  const {
    connectedAccount,
    isConnecting,
    selectedHighNetwork,
    selectedLowNetwork,
    connectWallet,
    getProvider,
    selectedBridgeToken
  } = useBlockchainContext()
  const [isAllowanceModalOpened, setIsAllowanceModalOpened] = useState(false)
  const [additionalCost, setAdditionalCost] = useState(ethers.BigNumber.from(0))
  const [feeEstimate, setFeeEstimate] = useState<
    { gasLimit: ethers.BigNumber; maxFeePerGas: ethers.BigNumber } | undefined
  >(undefined)
  const { refetchNewNotifications } = useBridgeNotificationsContext()
  const navigate = useNavigate()

  useEffect(() => {
    setFeeEstimate(undefined)
  }, [L2L3message])

  const { data: lowNetworkBalance } = useERC20Balance({
    tokenAddress: selectedLowNetwork.g7TokenAddress,
    account: connectedAccount,
    rpc: selectedLowNetwork.rpcs[0]
  })

  const getLabel = (): String | undefined => {
    if (isConnecting) {
      return 'Connecting wallet...'
    }
    if (transfer.isLoading) {
      return 'Submitting...'
    }
    if (!connectedAccount) {
      return 'Connect wallet'
    }
    return 'Submit'
  }

  const handleClick = async () => {
    if (isConnecting || transfer.isLoading) {
      return
    }
    if (typeof window.ethereum === 'undefined') {
      setErrorMessage("Wallet isn't installed")
      return
    }
    if (!connectedAccount) {
      await connectWallet()
      return
    }
    setErrorMessage('')
    transfer.mutate(String(amount))
    return
  }

  const queryClient = useQueryClient()
  const transfer = useMutation(
    async (amount: string) => {
      const network = ALL_NETWORKS.find((n) => n.chainId === bridger?.originNetwork.chainId)
      const provider = await getProvider(network!)
      const signer = provider.getSigner()
      const destinationRPC = selectedHighNetwork.rpcs[0]
      const destinationProvider = new ethers.providers.JsonRpcProvider(destinationRPC) as ethers.providers.Provider
      // If deposit
      if (bridger?.isDeposit) {
        if (selectedBridgeToken.address != ZERO_ADDRESS) {
          const allowance = (await bridger?.getAllowance(selectedLowNetwork.rpcs[0], connectedAccount ?? '')) ?? ''
          // approve first
          if (Number(ethers.utils.formatEther(allowance)) < Number(amount)) {
            setIsAllowanceModalOpened(true)
          }
        }
        const tx = await bridger?.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
        await tx.wait()
        return {
          type: 'DEPOSIT',
          amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          lowNetworkHash: tx.hash,
          lowNetworkTimestamp: Date.now() / 1000,
          completionTimestamp: Date.now() / 1000,
          newTransaction: true,
          symbol
        }
      } else {
        const tx = await bridger?.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
        await tx?.wait()
        return {
          type: 'WITHDRAWAL',
          amount: amount,
          lowNetworkChainId: selectedLowNetwork.chainId,
          highNetworkChainId: selectedHighNetwork.chainId,
          highNetworkHash: tx?.hash,
          highNetworkTimestamp: Date.now() / 1000,
          challengePeriod: 60 * 60,
          symbol
        }
      }
    },
    {
      onSuccess: async (record: any) => {
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)
          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push(record)
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['pendingNotifications'])
        queryClient.refetchQueries(['incomingMessages'])
        navigate('/bridge/transactions')
      },
      onError: (e) => {
        console.log(e)
        setErrorMessage('Something went wrong. Try again, please')
      }
    }
  )

  return (
    <>
      <button
        className={styles.container}
        onClick={handleClick}
        disabled={
          getLabel() === 'Submit' &&
          (isDisabled ||
            Number(amount) < 0 ||
            ((!L2L3message?.destination || !L2L3message.data) && Number(amount) === 0))
        }
      >
        <div className={isConnecting || transfer.isLoading ? styles.buttonLabelLoading : styles.buttonLabel}>
          {getLabel() ?? 'Submit'}
        </div>
      </button>
      <Modal
        opened={isAllowanceModalOpened}
        onClose={() => setIsAllowanceModalOpened(false)}
        withCloseButton={false}
        padding={'23px'}
        size={'400px'}
        radius={'12px'}
        classNames={{ body: styles.body }}
      >
        <ApproveAllowance
          balance={lowNetworkBalance?.raw ?? ethers.BigNumber.from('0')}
          amount={ethers.utils.parseUnits(String(amount), 18).add(additionalCost)}
          onSuccess={() => {
            setIsAllowanceModalOpened(false)
            transfer.mutate(String(amount))
          }}
          onClose={() => setIsAllowanceModalOpened(false)}
          allowanceProps={{
            tokenAddress: selectedLowNetwork.g7TokenAddress,
            network: selectedLowNetwork,
            spender: selectedLowNetwork.routerSpender
          }}
        />
      </Modal>
    </>
  )
}

export default ActionButton
