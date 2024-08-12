import { ethers } from 'ethers';
import { useQuery } from 'react-query';
import { STAKER_ABI } from '@/web3/ABI/Staker';
import { L3_NETWORKS } from '@/utils/bridge/l3Networks';
import { Pool } from '@/components/stake/pools/PoolsDesktop';

const STAKER_ADDRESS = L3_NETWORKS[2].coreContracts.staking ?? '';

const fetchPools = async () => {
    let provider;
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
    } else {
        // If no MM or other wallet provider is found, use G7 chain RPC
        provider = new ethers.providers.JsonRpcProvider(L3_NETWORKS[2].chainInfo.rpcs[0])
    }
    const PoolContract = new ethers.Contract(STAKER_ADDRESS ?? "", STAKER_ABI, provider);
    return PoolContract.Pools().then((data: any) => console.log(data));
}

const usePools = () => {
    return useQuery('pools', () => fetchPools(), {
        refetchInterval: 60000
    });
}

export default usePools;