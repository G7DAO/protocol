import { ethers } from 'ethers'
import { useQuery } from 'react-query'
import { STAKER_ABI } from '@/web3/ABI/Staker'
import { MULTICALL_ABI } from '@/web3/ABI/Multicall'
import { L3_NETWORKS } from '@/utils/bridge/l3Networks'
import { Pool } from '@/components/stake/pools/PoolsDesktop'

const STAKER_ADDRESS = L3_NETWORKS[2].coreContracts.staking ?? ''
const MULTICALL_ADDRESS = L3_NETWORKS[2].tokenBridgeContracts.l3Contracts.multicall;

const fetchPools = async () => {
    const provider = new ethers.providers.JsonRpcProvider(L3_NETWORKS[2].chainInfo.rpcs[0])

    const stakerContract = new ethers.Contract(
        STAKER_ADDRESS ?? "",
        STAKER_ABI,
        provider
    )

    const multicallContract = new ethers.Contract(
        MULTICALL_ADDRESS ?? "",
        MULTICALL_ABI,
        provider
    )

    try {
        const totalPools = await stakerContract.TotalPools();
        const totalPoolsNumber = totalPools.toNumber();

        const calls = []

        for (let i = 0; i < totalPoolsNumber; i++) {
            calls.push({ target: STAKER_ADDRESS, callData: stakerContract.interface.encodeFunctionData('Pools', [i]) })
        }

        // Aggregate all calls as one
        const callData = multicallContract.interface.encodeFunctionData('tryAggregate', [false, calls]);

        // define a raw call to be used with provider.call(), to avoid transacting.
        const rawCall = {
            to: MULTICALL_ADDRESS,
            data: callData
        };

        // Execute the call using the provider
        const result = await provider.call(rawCall);

        // Decode the result from the tryAggregate call
        const decodedResult = multicallContract.interface.decodeFunctionResult('tryAggregate', result);

        // Extract and decode the return data from each call
        const poolDataArray = decodedResult[0].map((resultData: any) => {
            return stakerContract.interface.decodeFunctionResult('Pools', resultData.returnData);
        });

        const pools: Pool[] = poolDataArray.map((poolData: any, i: number) => {
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
                transferable: poolData.transferable,
                isImmutable: false
            }
            return pool
        })
        return pools;

    } catch (error) {
        return console.error("Error fetching pools ", error);
    }
}

const usePools = () => {
    return useQuery('pools', () => fetchPools(), {
        refetchInterval: 60000
    });
}

export default usePools