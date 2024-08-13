import { ethers } from 'ethers'
import { useQuery } from 'react-query'
import { STAKER_ABI } from '@/web3/ABI/Staker'
import { MULTICALL_ABI } from '@/web3/ABI/Multicall'
import { L3_NETWORKS } from '@/utils/bridge/l3Networks'
import { Pool } from '@/components/stake/pools/PoolsDesktop'

const STAKER_ADDRESS = L3_NETWORKS[2].coreContracts.staking ?? ''
const MULTICALL_ADDRESS = L3_NETWORKS[2].tokenBridgeContracts.l3Contracts.multicall;



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

    const MulticallContract = new ethers.Contract(
        MULTICALL_ADDRESS ?? "",
        MULTICALL_ABI,
        provider
    )

    try {
        const totalPools = await PoolContract.TotalPools();
        const totalPoolsNumber = totalPools.toNumber();

        // Create an array of all the PoolIDs in our staker contract
        const allPools = Array.from({ length: totalPoolsNumber }, (_, index) => index)
        const pools: Pool[] = []

        // Map every pool ID to an encoded function call
        const calls = allPools.map((poolId) => {
            return {
                target: STAKER_ADDRESS,
                callData: PoolContract.interface.encodeFunctionData('Pools', [poolId])
            };
        });

        // Aggregate all calls as one
        const callData = MulticallContract.interface.encodeFunctionData('tryAggregate', [false, calls]);

        // define a raw call to be used with provider.call(), to avoid transacting.
        const rawCall = {
            to: MULTICALL_ADDRESS,
            data: callData
        };

        // Execute the call using the provider
        const result = await provider.call(rawCall);

        // Decode the result from the tryAggregate call
        const decodedResult = MulticallContract.interface.decodeFunctionResult('tryAggregate', result);

        // Extract and decode the return data from each call
        const poolDataArray = decodedResult[0].map((resultData: any) => {
            return PoolContract.interface.decodeFunctionResult('Pools', resultData.returnData);
        });

        console.log(poolDataArray)

        // console.log(poolData)
        for (let i = 0; i < totalPoolsNumber; i++) {
            const pool: Pool = {
                poolId: i.toString(),
                poolName: "Pool " + i.toString(),
                administrator: poolDataArray[i].administrator,
                owner: poolDataArray[i].administrator,
                tokenType: (poolDataArray[i].tokenType).toString(),
                tokenAddress: poolDataArray[i].tokenAddress,
                tokenId: (poolDataArray[i].tokenID).toString(),
                lockdownPeriod: poolDataArray[i].lockupSeconds.toNumber(),
                cooldownPeriod: poolDataArray[i].cooldownSeconds.toNumber(),
                transferable: poolDataArray[i].transferable,
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