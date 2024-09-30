import React, { useMemo } from 'react'
import styles from './TransferStatus.module.css'
import { getRPC, NETWORKS } from '../networks.ts'
import { useQuery } from 'react-query'
import { BridgeTransfer } from 'game7-bridge-sdk/dist/bridgeTransfer'
import { useWallet } from '../contexts/WalletContext.tsx'

interface TransferStatusProps {
  originChainId: number
  destinationChainId: number
  txHash: string
}
const TransferStatus: React.FC<TransferStatusProps> = ({ originChainId, destinationChainId, txHash }) => {
  const { getSigner } = useWallet()
  const originRpc = useMemo(() => getRPC(originChainId), [originChainId])
  const destinationRpc = useMemo(() => getRPC(destinationChainId), [destinationChainId])
  const transferStatus = useQuery(['transferStatus', txHash], async () => {
    const transfer = await BridgeTransfer.create({
      originSignerOrProviderOrRpc: originRpc,
      destinationSignerOrProviderOrRpc: destinationRpc,
      txHash
    })
    console.log(transfer)
    return transfer
  })
  const handleClick = async () => {
    const destinationNetwork = NETWORKS.find((n) => n.chainId === destinationChainId)
    const signer = await getSigner(destinationNetwork)
    const res = await transferStatus.data?.execute(signer)
    console.log(res)
  }
  return (
    <div className={styles.container} onClick={handleClick}>
      {txHash}
    </div>
  )
}

export default TransferStatus
