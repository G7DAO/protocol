import { ethers } from 'ethers'
import { useQuery } from 'react-query'
import { stakerABI } from '@/web3/ABI/staker'
import { MULTICALL_ABI } from '@/web3/ABI/Multicall'
import { L3_NETWORKS } from '@/utils/bridge/l3Networks'
import { Pool } from '@/components/stake/pools/PoolsDesktop'

const STAKER_ADDRESS = L3_NETWORKS[2].coreContracts.staking ?? ''
const MULTICALL_ADDRESS = L3_NETWORKS[2].tokenBridgeContracts.l3Contracts.multicall;

const fetchPools = async () => {
    const provider = new ethers.providers.JsonRpcProvider(L3_NETWORKS[2].chainInfo.rpcs[0])

    const stakerContract = new ethers.Contract(
        STAKER_ADDRESS ?? "",
        stakerABI,
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

        const poolCalls = []
        const positionsCalls = []

        for (let i = 0; i < totalPoolsNumber; i++) {
            poolCalls.push({ target: STAKER_ADDRESS, callData: stakerContract.interface.encodeFunctionData('Pools', [i]) })
            positionsCalls.push({ target: STAKER_ADDRESS, callData: stakerContract.interface.encodeFunctionData('CurrentPositionsInPool', [i]) })
        }

        // Aggregate all calls as one
        const poolsCallData = multicallContract.interface.encodeFunctionData('tryAggregate', [false, poolCalls])
        const positionsCallData = multicallContract.interface.encodeFunctionData('tryAggregate', [false, positionsCalls])

        // define a raw call to be used with provider.call(), to avoid transacting.
        const poolsRawCall = {
            to: MULTICALL_ADDRESS,
            data: poolsCallData
        }

        const positionsRawCall = {
            to: MULTICALL_ADDRESS,
            data: positionsCallData
        }


        // Execute the call using the provider
        const poolsResult = await provider.call(poolsRawCall)
        const positionsResult = await provider.call(positionsRawCall)

        // Decode the result from the tryAggregate call
        const poolsDecodedResult = multicallContract.interface.decodeFunctionResult('tryAggregate', poolsResult);
        const positionsDecodedResult = multicallContract.interface.decodeFunctionResult('tryAggregate', positionsResult);

        // Extract and decode the return data from each call
        const poolDataArray = poolsDecodedResult[0].map((resultData: any) => {
            return stakerContract.interface.decodeFunctionResult('Pools', resultData.returnData);
        });

        const positionsDataArray = positionsDecodedResult[0].map((resultData: any) => {
            return stakerContract.interface.decodeFunctionResult('CurrentPositionsInPool', resultData.returnData);
        });

        const positionNumbers = positionsDataArray.map((totalPositions: any) => {
            console.log(totalPositions[0].toNumber())
            return totalPositions[0];
        })

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
                positions: positionNumbers[i].toNumber(),
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