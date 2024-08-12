import { ethers } from 'ethers';
import { STAKER_ABI } from '@/web3/ABI/Staker';
import { L3_NETWORKS } from '../bridge/l3Networks';

export const editPool = async (
    poolId: string,
    changeTransferability: boolean,
    transferable: boolean,
    changeLockup: boolean,
    lockupSeconds: string,
    changeCooldown: boolean,
    cooldownSeconds: string,
    connectedAccount: string
) => {
    let provider
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
    } else {
        provider = new ethers.providers.JsonRpcProvider(L3_NETWORKS[2].chainInfo.rpcs[0])
    }
    const StakerContract = new ethers.Contract(
        L3_NETWORKS[2].coreContracts.staking ?? '',
        STAKER_ABI,
        provider
    )
    console.log({ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds, connectedAccount })
    const txRequest = await StakerContract.populateTransaction.updatePoolConfiguration(
        poolId,
        changeTransferability,
        transferable,
        changeLockup,
        lockupSeconds,
        changeCooldown,
        cooldownSeconds
    )

    const txResponse = await provider.getSigner(connectedAccount).sendTransaction(txRequest)
    return await txResponse.wait()
}