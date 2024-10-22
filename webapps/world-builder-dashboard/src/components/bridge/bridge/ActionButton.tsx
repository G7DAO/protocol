// External Libraries
import React, { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
// Constants
import { ALL_NETWORKS, L3_NETWORK } from '../../../../constants'
// Styles
import styles from './ActionButton.module.css'
import { ethers } from 'ethers'
import { Modal } from 'summon-ui/mantine'
// Absolute Imports
import ApproveAllowance from '@/components/bridge/allowance/ApproveAllowance'
import { HighNetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { useBridgeNotificationsContext } from '@/contexts/BridgeNotificationsContext'
import useERC20Balance, { fetchERC20Allowance } from '@/hooks/useERC20Balance'
import { estimateCreateRetryableTicketFee, sendL2ToL3Message } from '@/utils/bridge/createRetryableTicket'
import { depositERC20ArbitrumSDK, TransactionRecord } from '@/utils/bridge/depositERC20ArbitrumSDK'
import { sendDepositERC20ToNativeTransaction } from '@/utils/bridge/depositERC20ToNative'
import { sendWithdrawERC20Transaction } from '@/utils/bridge/withdrawERC20'
import { sendWithdrawTransaction } from '@/utils/bridge/withdrawNativeToken'
import { parseUntilDelimiter } from '@/utils/web3utils'
import { L2ToL1MessageStatus } from '@arbitrum/sdk'
import { Bridger } from 'game7-bridge-sdk'

interface ActionButtonProps {
  direction: 'DEPOSIT' | 'WITHDRAW'
  amount: number
  isDisabled: boolean
  L2L3message?: { destination: string; data: string }
  setErrorMessage: (arg0: string) => void
  bridger?: Bridger
}
const ActionButton: React.FC<ActionButtonProps> = ({ direction, amount, isDisabled, setErrorMessage, L2L3message, bridger }) => {
  const { connectedAccount, isConnecting, selectedHighNetwork, selectedLowNetwork, connectWallet, getProvider } =
    useBlockchainContext()
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
    if (deposit.isLoading || withdraw.isLoading) {
      return 'Submitting...'
    }
    if (!connectedAccount) {
      return 'Connect wallet'
    }
    return 'Submit'
  }

  const handleClick = async () => {
    if (isConnecting || deposit.isLoading || withdraw.isLoading) {
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
    if (direction === 'DEPOSIT') {
      deposit.mutate(String(amount))
      return
    }
    if (direction === 'WITHDRAW') {
      withdraw.mutate(String(amount))
      return
    }
  }

  const queryClient = useQueryClient()
  const deposit = useMutation(
    async (amount: string) => {
      const provider = await getProvider(selectedLowNetwork)
      if (!provider || !connectedAccount) {
        setErrorMessage("Wallet isn't connected")
        throw new Error("Wallet isn't connected")
      }
      const allowance = await fetchERC20Allowance({
        tokenAddress: selectedLowNetwork.g7TokenAddress,
        owner: connectedAccount,
        spender: selectedLowNetwork.routerSpender,
        rpc: selectedLowNetwork.rpcs[0]
      })

      const signer = provider.getSigner()
      let messageExecutionCost = additionalCost
      let estimate: { gasLimit: ethers.BigNumber; maxFeePerGas: ethers.BigNumber } | undefined
      if (L2L3message?.data && L2L3message.destination && messageExecutionCost.eq(ethers.BigNumber.from(0))) {
        try {
          estimate = await estimateCreateRetryableTicketFee(
            '',
            selectedLowNetwork,
            L2L3message.destination ?? '',
            L2L3message.data
          )
          if (estimate) {
            setFeeEstimate(estimate)
            messageExecutionCost = estimate.maxFeePerGas.mul(estimate.gasLimit)
          }
        } catch (e) {
          setErrorMessage('Estimation message execution fee error')
          console.log(`Estimation message execution fee error:  ${e}`)
        }
      }

      setAdditionalCost(messageExecutionCost)
      if (allowance.raw.lt(ethers.utils.parseUnits(amount, 18).add(messageExecutionCost))) {
        setIsAllowanceModalOpened(true)
        return
      }
      if (selectedHighNetwork.chainId === L3_NETWORK.chainId) {
        if (L2L3message?.data && L2L3message.destination) {
          return sendL2ToL3Message(
            selectedLowNetwork,
            selectedHighNetwork,
            amount,
            signer,
            connectedAccount,
            L2L3message.destination,
            L2L3message.data,
            estimate ?? feeEstimate
          )
        }
        return sendDepositERC20ToNativeTransaction(
          selectedLowNetwork,
          selectedHighNetwork as HighNetworkInterface,
          amount,
          signer,
          connectedAccount
        )
      }
      return depositERC20ArbitrumSDK(selectedLowNetwork, selectedHighNetwork, amount, signer)
    },
    {
      onSuccess: (deposit: TransactionRecord | undefined) => {
        if (!deposit) {
          return
        }
        try {
          const transactionsString = localStorage.getItem(`bridge-${connectedAccount}-transactions`)

          let transactions = []
          if (transactionsString) {
            transactions = JSON.parse(transactionsString)
          }
          transactions.push({ ...deposit, isDeposit: true })
          localStorage.setItem(`bridge-${connectedAccount}-transactions`, JSON.stringify(transactions))
        } catch (e) {
          console.log(e)
        }
        refetchNewNotifications(connectedAccount ?? '')
        queryClient.invalidateQueries(['ERC20Balance'])
        queryClient.invalidateQueries(['pendingTransactions'])
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.refetchQueries(['incomingMessages'])
        queryClient.refetchQueries(['pendingNotifications'])
        navigate('/bridge/transactions')
      },
      onError: (e: Error) => {
        const error = parseUntilDelimiter(e)
        console.log(error)
        setErrorMessage('Something went wrong. Try again, please')
      }
    }
  )

  const withdraw = useMutation(
    async (amount: string) => {
      const provider = await getProvider(selectedHighNetwork)
      const signer = provider.getSigner()
      if (!provider || !connectedAccount) {
        throw new Error("Wallet isn't connected")
      }
      if (selectedHighNetwork.chainId !== L3_NETWORK.chainId) {
        return sendWithdrawERC20Transaction(amount, connectedAccount, signer)
      }
      return sendWithdrawTransaction(amount, connectedAccount, signer)
    },
    {
      onSuccess: async (record: TransactionRecord) => {
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
        queryClient.setQueryData(
          ['withdrawalStatus', record.highNetworkHash, selectedLowNetwork.rpcs[0], selectedHighNetwork.rpcs[0]],
          () => {
            return {
              timestamp: new Date().getTime() / 1000,
              status: L2ToL1MessageStatus.UNCONFIRMED,
              value: record.amount,
              confirmations: 1
            }
          }
        )
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

  const transfer = useMutation({
    mutationFn: async (amount: string) => {
      console.log(bridger)
      const network = ALL_NETWORKS.find((n) => n.chainId === bridger?.originNetwork.chainId)
      console.log(network)
      const provider = await getProvider(network!)
      const signer = provider.getSigner()
      const destinationRPC = selectedHighNetwork.rpcs[0]
      const destinationProvider = new ethers.providers.JsonRpcProvider(destinationRPC) as ethers.providers.Provider
      return bridger?.transfer({ amount: ethers.utils.parseUnits(amount), signer, destinationProvider })
    },
    onSuccess: (data) => {
      console.log(data)
      //0x5ce56d7cf0554bec609e995f3f3e98ad495a08fe29e66b91a9d951840fce6674
      // 0x68bb539766ba5fcc6eba8536eaa5ac3f7e346e2eab8b6ebbaa9a976d6b8786ec
      //0x630d46c87e1df9ab91b8f6311b711033fc11b95ef3487135af5e0726506f4135
      // 0xc2c6cff17958df71b2507aa41393d9085ad4492b631271a590fdc7a834cb4275 L2->L3
      // 0x9a0d867b6523f1d55bbb0d1b16779c5cb433744f646bd9209f382142bb10ec06 L2->L1
      // 0x4f7aaf3d84d69a27123523deb85827982143c83fe6862eb1dca8c5ebef369740 L3->L2
      // 0x4d011728e4b8002750a0dcb8f2b18d7f17a08c278acda381d26d6eb9c460157f L3->L2
      // 0x8460187b8602c2cf2436f7821836c9097182d550a31cefaa07fb6352c013981e L2->L3
      // 0x6db1d677bc87d64d0adf0ef89d059e0a6b9a8f765af5dc0d2977f9d87aaf8677 L2->L1 ETH
      // 0xb5ba500f030e662a3bd4742c8f090b819881c508c9b748d699cf7820253afea8 L2->L1 ETH
      // 0x5311d470b7956262ad3329ea75bebb9fc01d9f07dde419e4dbcddae440215415 L2->L1 TG7T
      // 0x3b3581e5000f84ddfd22e61e6a800a01ceba6246fb2042816967a0034978e9ec L2->L1 TG7T
    }
  })
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
        <div
          className={
            isConnecting || deposit.isLoading || withdraw.isLoading ? styles.buttonLabelLoading : styles.buttonLabel
          }
        >
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
            deposit.mutate(String(amount))
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
