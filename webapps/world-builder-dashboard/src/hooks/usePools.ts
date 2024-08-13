import { ethers } from 'ethers'
import { useQuery } from 'react-query'
import { STAKER_ABI } from '@/web3/ABI/Staker'
import { MULTICALL_ABI } from '@/web3/ABI/Multicall'
import { L3_NETWORKS } from '@/utils/bridge/l3Networks'
import { Pool } from '@/components/stake/pools/PoolsDesktop'
import { useBlockchainContext } from '@/contexts/BlockchainContext'

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
        const pools: Pool[] = [];

        // Map every pool ID to an encoded function call
        const calls = allPools.map((poolId) => {
            return {
                target: STAKER_ADDRESS,
                callData: PoolContract.interface.encodeFunctionData('Pools', [poolId])
            };
        });
        
        // Aggregate all calls as one
        const callData = MulticallContract.interface.encodeFunctionData('tryAggregate', [false, calls]);

        // Here, we need ot define a raw call to be call() by provider. The reason why is because regular 
        // invocation makes it a transaction and we don't want that. Bad UX
        const rawCall = {
            to: MULTICALL_ADDRESS,
            data: callData
        };
        const result = await provider.call(rawCall);

        // Decode the result
        const decodedResult = MulticallContract.interface.decodeFunctionResult('tryAggregate', result);
        console.log(decodedResult)

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
                transferable: poolData.transferable,
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