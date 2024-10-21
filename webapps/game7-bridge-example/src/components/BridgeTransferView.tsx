import React from 'react';
import styles from "./BridgeTransferView.module.css";
import {BridgeToken, BridgeTransferInfo, BridgeTransferStatus} from "game7-bridge-sdk";
import {ethers} from "ethers";
import {useMutation, useQuery, useQueryClient} from "react-query";
import {BridgeTransfer} from "game7-bridge-sdk/dist/bridgeTransfer";
import {getRPC, NETWORKS} from "../networks.ts";
import {useWallet} from "../contexts/WalletContext.tsx";
import TransferProgress from "./TransferProgress.tsx";

interface BridgeTransferViewProps {
    info: BridgeTransferInfo,
    token: BridgeToken,
    isIncome: boolean,
}

const BridgeTransferView: React.FC<BridgeTransferViewProps> = ({info, token, isIncome}) => {

    const {getSigner} = useWallet()
    const status = useQuery(["transferStatus", info.initTxExplorerUrl], async () => {
        const {txHash, originNetworkChainId, destinationNetworkChainId} = info
        const bridgeTransfer = new BridgeTransfer({txHash, originNetworkChainId, destinationNetworkChainId})
        return bridgeTransfer.getStatus()
    }, {
        onSuccess: (data: any) => {
            console.log(data)
        }
    })

    const queryClient = useQueryClient()
    const execute = useMutation({
        mutationFn: async (amount: string) => {
            const network = NETWORKS.find((n) => n.chainId === info.destinationNetworkChainId)
            const signer = await getSigner(network)
            const {txHash, destinationNetworkChainId, originNetworkChainId} = info
            const bridgeTransfer = new BridgeTransfer({txHash, destinationNetworkChainId, originNetworkChainId})
            return bridgeTransfer.execute(signer)
        },
        onSuccess: (data) => {
            console.log(data)
            status.refetch()
        }
    })

  return (
  <div className={isIncome ? styles.containerIn : styles.containerOut}>
      {info.amount && <div className={isIncome ? styles.amountIn : styles.amountOut}>{`${isIncome ? '+' : '-'} ${ethers.utils.formatEther(info.amount)} ${info.tokenSymbol ?? ''}`}</div>}
      {isIncome && info.originNetworkChainId && <a href={info.initTxExplorerUrl} target={'_blank'} className={styles.from}>from {info.originName}</a> }
      {!isIncome && info.originNetworkChainId && <a href={info.initTxExplorerUrl} target={'_blank'} className={styles.from}>to {info.destinationName}</a> }
      {(status.data?.status === BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED || status.data?.status === BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD) && <a href={status.data.completionExplorerLink} target={'_blank'} className={styles.from}>completed</a>}
      {status.data?.status === BridgeTransferStatus.WITHDRAW_CONFIRMED && <button className={styles.claimButton} onClick={execute.mutate}>claim</button> }
      {status.data?.status === BridgeTransferStatus.WITHDRAW_EXECUTED && <div className={styles.executed}>executed</div> }
      {status.data?.status === BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED || status.data?.status === BridgeTransferStatus.DEPOSIT_GAS_PENDING || status.data?.status === BridgeTransferStatus.WITHDRAW_UNCONFIRMED && <TransferProgress eta={status.data.ETA} start={info.timestamp * 1000} />}


  </div>
  );
};

export default BridgeTransferView;
