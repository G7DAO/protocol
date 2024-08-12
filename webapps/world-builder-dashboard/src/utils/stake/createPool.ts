import {ethers, providers, utils} from 'ethers';
import { STAKER_ABI } from '@/web3/ABI/Staker';
import { L3_NETWORKS } from '../bridge/l3Networks';

export enum TokenType {
    NATIVE,
    ERC20,
    ERC721,
    ERC1155
}

export const createPool = async (
    tokenType: TokenType,
    tokenAddress: string,
    tokenId: string,
    lockdownPeriod: string,
    cooldownPeriod: string,
    isTransferable: boolean,
    isImmutable: boolean,
    account: string
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
    const txRequest = await StakerContract.populateTransaction.createPool(
        tokenType,
        tokenAddress,
        tokenId,
        isTransferable,
        lockdownPeriod,
        cooldownPeriod,
    )

    const txResponse = await provider.getSigner(account).sendTransaction(txRequest)

    return await txResponse.wait()
}