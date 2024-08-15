import { ethers } from 'ethers';
import { STAKER_ABI } from '@/web3/ABI/Staker';
import { L3_NETWORKS } from '../bridge/l3Networks';

export enum TokenType {
    NATIVE,
    ERC20,
    ERC721,
    ERC1155
}

export const createPool = async (
    tokenType: string,
    tokenAddress: string,
    tokenId: string,
    lockupSeconds: string,
    cooldownSeconds: string,
    transferable: boolean,
    account: string,
    provider: ethers.providers.Web3Provider
) => {
    const StakerContract = new ethers.Contract(
        L3_NETWORKS[2].coreContracts.staking ?? '',
        STAKER_ABI,
        provider
    )

    const txRequest = await StakerContract.populateTransaction.createPool(
        tokenType,
        tokenAddress,
        tokenId,
        transferable,
        lockupSeconds,
        cooldownSeconds,
    )

    const txResponse = await provider.getSigner(account).sendTransaction(txRequest)

    return await txResponse.wait()
}