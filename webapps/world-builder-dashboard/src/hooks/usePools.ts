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
    const PoolContract = new ethers.Contract(
        STAKER_ADDRESS ?? "",
        STAKER_ABI,
        provider
    )

    try {
        const totalPools = await PoolContract.TotalPools();
        const totalPoolsNumber = totalPools.toNumber();

        // Create an array of all the PoolIDs in our staker contract
        const allPools = Array.from({ length: totalPoolsNumber }, (_, index) => index)
        const pools: Pool[] = [];

        // Bundle all the encoded functiondata in one variable
        const calls = allPools.map((poolId) => {
            return {
                to: STAKER_ADDRESS,
                data: PoolContract.interface.encodeFunctionData('Pools', [poolId])
            }
        })

        // Make one call
        const callResults = await Promise.all(
            calls.map(call => provider.call(call))
        );

        // Return decoded data
        const decodedData = callResults.map((data) => {
            return PoolContract.interface.decodeFunctionResult('Pools', data);
        });

        for (let i = 0; i < decodedData.length; i++) {
            const pool: Pool = {
                poolId: i.toString(),
                poolName: "Pool " + i.toString(),
                administrator: decodedData[i].administrator,
                owner: decodedData[i].administrator,
                tokenType: (decodedData[i].tokenType).toString(),
                tokenAddress: decodedData[i].tokenAddress,
                tokenId: (decodedData[i].tokenID).toString(),
                lockdownPeriod: decodedData[i].lockupSeconds.toNumber(),
                cooldownPeriod: decodedData[i].cooldownSeconds.toNumber(),
                transferable: decodedData[i].transferable,
                isImmutable: false
            }
            pools.push(pool);
        }
        return pools;

    } catch (error) {
        return console.error("Error fetching pools ", error);
    }
}

const usePools = (connectedAccount: string) => {
    return useQuery('pools', () => fetchPools(), {
        refetchInterval: 60000,
        onError: (error) => {
            console.error('Failed to load pools: ', error)
        }
    });
}

export default usePools