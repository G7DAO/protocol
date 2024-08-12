import {ethers, providers, utils} from 'ethers';
import { STAKER_ABI } from '@/web3/ABI/Staker';
import { L3_NETWORKS } from '../bridge/l3Networks';

enum TokenType {
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
    networkProvider: ethers.providers.Web3Provider,
    account: string
) => {
    const StakerContract = new ethers.Contract(
        L3_NETWORKS[2].coreContracts.staking ?? '',
        STAKER_ABI,
        networkProvider
    )
    const txRequest = await StakerContract.populateTransaction.createPool(
        tokenType,
        tokenAddress,
        tokenId,
        isTransferable,
        lockdownPeriod,
        cooldownPeriod,
    )

    const txResponse = await networkProvider.getSigner(account).sendTransaction(txRequest);

    return await txResponse.wait();
}