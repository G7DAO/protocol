import { ethers } from 'ethers';
import { stakerABI } from '@/web3/ABI/staker';
import { L3_NETWORKS } from '../bridge/l3Networks';

export const editPool = async (
    poolId: string,
    changeTransferability: boolean,
    transferable: boolean,
    changeLockup: boolean,
    lockupSeconds: string,
    changeCooldown: boolean,
    cooldownSeconds: string,
    connectedAccount: string,
    provider: ethers.providers.Web3Provider
) => {
    const StakerContract = new ethers.Contract(
        L3_NETWORKS[2].coreContracts.staking ?? '',
        stakerABI,
        provider
    )
    const txRequest = await StakerContract.populateTransaction.updatePoolConfiguration(
        poolId,
        changeTransferability,
        transferable,
        changeLockup,
        lockupSeconds,
        changeCooldown,
        cooldownSeconds
    )

    const txResponse = await provider?.getSigner(connectedAccount).sendTransaction(txRequest)
    return await txResponse?.wait()
}