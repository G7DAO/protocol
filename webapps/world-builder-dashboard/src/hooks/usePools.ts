import { ethers } from 'ethers'
import { useQuery } from 'react-query'
import { STAKER_ABI } from '@/web3/ABI/Staker'
import { L3_NETWORKS } from '@/utils/bridge/l3Networks'
import { Pool } from '@/components/stake/pools/PoolsDesktop'

const STAKER_ADDRESS = L3_NETWORKS[2].coreContracts.staking ?? ''


const fetchPools = async () => {
    let provider
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
    } else {
        // If no MM or other wallet provider is found, use G7 chain RPC
        provider = new ethers.providers.JsonRpcProvider(L3_NETWORKS[2].chainInfo.rpcs[0])
    }
    const PoolContract = new ethers.Contract(STAKER_ADDRESS ?? "", STAKER_ABI, provider)

    try {
        const totalPools = await PoolContract.TotalPools();
        const totalPoolsNumber = totalPools.toNumber();
        const pools: Pool[] = [];

        for (let i = 0; i < totalPoolsNumber; i++) {
            const poolData = await PoolContract.Pools(i);
            const pool: Pool = {
                poolId: i.toString(),
                poolName: "Pool " + i.toString(),
                administrator: poolData.administrator,
                owner: poolData.administrator,
                tokenType: (poolData.tokenType).toString(),
                tokenAddress: poolData.tokenAddress,
                tokenId: (poolData.tokenID).toString(),
                lockdownPeriod: poolData.lockupSeconds.toNumber(),
                cooldownPeriod: poolData.cooldownSeconds.toNumber(),
                isTransferable: poolData.transferable,
                isImmutable: false
            }
            pools.push(pool);
        }
        return pools;

    } catch (error) {
        return console.error("Error fetching pools ", error);
    }
}

const usePools = () => {
    return useQuery('pools', () => fetchPools(), {
        refetchInterval: 60000,
        onError: (error) => {
            console.error('Failed to load pools: ', error)
        }
    });
}

export default usePools