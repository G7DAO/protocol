import {TokenAddressMap} from '../types';
import {BigNumber, ethers} from 'ethers';
import {networks} from '../networks';
import {BridgeToken} from '../bridgeToken';
import {BridgeTransferStatus} from "../bridgeTransfer";
import {getBridger} from "../bridgerFactory";
import {getBridgeTransfer} from "../bridgeTransferFactory";
import {BridgeTransferStatusToString, ETH, getTypeMessage, logBalance, rpcs, TG7T, USDC} from "./constants";



async function transfer(_amount: string, _transfers: Array<{destinationNetworkChainId: number; originNetworkChainId: number; token: TokenAddressMap; txHash?: string, isCCTP?: boolean, decimals?: number }>, params: {send: boolean} = {send: true }) {
    const from = '0x4eD919172bD08D74831f2914aAAe8edA690d08Ab'
    const key = process.env.KEY
    const failedTransactions = []
    const uniqueTokens = Array.from(new Set(_transfers.map(d => d.token)))


    console.log('=== Initial Balances ===')
    for (const token of uniqueTokens) {
        for(const _chainId of Object.keys(token)) {
            const chainId = parseInt(_chainId)
            const provider = new ethers.providers.JsonRpcProvider(rpcs[chainId])
            const bridgeToken = new BridgeToken(token, chainId);
            const decimals = await bridgeToken.getDecimals(provider)
            const tokenSymbol = await bridgeToken.getSymbol(provider)
            await logBalance(token, chainId, provider, from, decimals, `${tokenSymbol} (${networks[chainId].name}) balance: `)
        }
    }
    console.log('=====================')

    const transactions = _transfers.filter((t) => t.txHash).map((t) => (
        {
            originNetworkChainId: t.originNetworkChainId,
            destinationNetworkChainId: t.destinationNetworkChainId,
            txHash: t.txHash,
            isCCTP: t.isCCTP,
            decimals: t.decimals ?? (t.token[1] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || t.token[11155111] === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238') ? 6 : 18,
            token: t.token,
            destinationSignerOrProviderOrRpc: rpcs[t.destinationNetworkChainId],
            originSignerOrProviderOrRpc: rpcs[t.originNetworkChainId],
            pendingTime: undefined as Date | undefined,
            completedTime: undefined as Date | undefined,
            executableTime: undefined as Date | undefined,
        }
    ))

    const transfers = _transfers.filter((t) => !t.txHash)
    for (const transfer  of transfers) {
        console.log('.........!!!!!.............')
        const {token, originNetworkChainId,destinationNetworkChainId} = transfer

        const originNetwork = networks[originNetworkChainId];
        const originProvider = new ethers.providers.JsonRpcProvider(rpcs[originNetworkChainId]);
        const destinationNetwork = networks[destinationNetworkChainId]
        const destinationProvider = new ethers.providers.JsonRpcProvider(destinationNetwork.rpcs[0]);
        const signer = new ethers.Wallet(key ?? '', originProvider);


        const bridgeToken = new BridgeToken(token, originNetworkChainId)
        const tokenSymbol = await bridgeToken.getSymbol(originProvider)
        const decimals = await bridgeToken.getDecimals(originProvider)
        const amount = ethers.utils.parseUnits(_amount, decimals)

        console.log(`${originNetwork.name} -> ${destinationNetwork.name} ${ethers.utils.formatUnits(amount, decimals)} ${tokenSymbol}`)

        await logBalance(token, destinationNetworkChainId, destinationProvider, from, decimals, `${tokenSymbol} ${destinationNetwork.name} balance: `)
        await logBalance(token, originNetworkChainId, originProvider, from, decimals, `${tokenSymbol} ${originNetwork.name} balance: `)

        const g7Bridger = getBridger(originNetworkChainId, destinationNetworkChainId, token) //bridgerFactory(originNetworkChainId, destinationNetworkChainId, token)
        console.log(g7Bridger.isDeposit ? 'DEPOSIT' : 'WITHDRAWAL')
        console.log(g7Bridger.isCctp() ? 'CCTP' : 'not CCTP')


        console.log('------------------')

        console.log('fetching allowance...')
        const allowanceFromBridger = await g7Bridger.getAllowance(originProvider, from)
        console.log("Allowance: ", allowanceFromBridger ? ethers.utils.formatUnits(allowanceFromBridger, decimals) : 'not needed')
        if (allowanceFromBridger && allowanceFromBridger.lt(amount)) {
            console.log({approved: ethers.utils.formatUnits(allowanceFromBridger, decimals), needed: ethers.utils.formatUnits(amount, decimals)})
            console.log('setting allowance...')
            try {
                const approvalFromBridger = await g7Bridger.approve(amount, signer)
                console.log('waiting...')
                const mined = await approvalFromBridger.wait()
                console.log("Mined")
                console.log('fetching allowance...')
                const newAllowance = await g7Bridger.getAllowance(originProvider, from)
                console.log("New allowance: ", newAllowance ? ethers.utils.formatUnits(newAllowance, decimals) : newAllowance)
            } catch (e) {
                console.log(e)
            }
        }
        console.log('------------------')

        const nativeApproval = ethers.utils.parseEther('1')
        console.log('fetching native allowance...')
        const nativeAllowanceFromBridger = await g7Bridger.getNativeAllowance(originProvider, from)
        console.log("Allowance: ", nativeAllowanceFromBridger ? ethers.utils.formatUnits(nativeAllowanceFromBridger, 18) : 'not needed')
        if (nativeAllowanceFromBridger && nativeAllowanceFromBridger.lt(nativeApproval)) {
            console.log({approved: ethers.utils.formatUnits(nativeAllowanceFromBridger, 18), needed: ethers.utils.formatUnits(nativeApproval, 18)})
            console.log('setting nativeAllowance...')
            const nativeApprovalFromBridger = await g7Bridger.approveNative(nativeApproval, signer)
            console.log('waiting...')
            const nativeMined = await nativeApprovalFromBridger.wait()
            console.log("Mined")
            console.log('fetching allowance...')
            const newAllowance = await g7Bridger.getNativeAllowance(originProvider, from)
            console.log("New allowance: ", newAllowance ? ethers.utils.formatUnits(newAllowance, 18) : newAllowance) //yes, it's always 18 for now, but TODO
        }
        console.log('------------------')

        console.log('fetching gas fee...')
        try {
            const gasAndFee = await g7Bridger.getGasAndFeeEstimation(amount, originProvider, from, destinationProvider)
            console.log({parentFee: ethers.utils.formatEther(gasAndFee.estimatedFee), childFee: gasAndFee.childNetworkEstimation ? ethers.utils.formatEther(gasAndFee.childNetworkEstimation.estimatedFee) : 0})
        } catch (e) {
            console.error('gas estimation error', e)
        }

        console.log('------------------')

        if (params.send) {
            try {

                console.log("Sending...")
                const res = await g7Bridger.transfer({amount, signer, destinationProvider})
                console.log('waiting...')
                const mined = await res.wait()
                // const fee = await getTransactionFee(mined.transactionHash, originProvider)
                console.log('Sent: ', mined.transactionHash)
                transactions.push({
                    originNetworkChainId,
                    destinationNetworkChainId,
                    txHash: mined.transactionHash,
                    isCCTP: g7Bridger.isCctp(),
                    decimals,
                    token: transfer.token,
                    destinationSignerOrProviderOrRpc: rpcs[destinationNetworkChainId],
                    originSignerOrProviderOrRpc: rpcs[originNetworkChainId],
                    pendingTime: undefined,
                    completedTime: undefined,
                    executableTime: undefined,
                })
                await logBalance(token, originNetworkChainId, originProvider, from, decimals, `${tokenSymbol} ${originNetwork.name} balance: `)
                await logBalance(token, destinationNetworkChainId, destinationProvider, from, decimals, `${tokenSymbol} ${destinationNetwork.name} balance: `)
            } catch (e) {
                failedTransactions.push({
                    originNetworkChainId,
                    destinationNetworkChainId,
                    token: transfer.token,
                })
                console.error("Sending error: ", e)
            }
        }


        const  percentIncrease = (
            num: BigNumber,
            increase: BigNumber
        ): BigNumber => {
            return num.add(num.mul(increase).div(100))
        }

    }
    do {
        console.log('!!!!------------------!!!!!')
        console.log('!!!!------------------!!!!!')

        for (const tx of transactions) {
            if (tx.completedTime) {
                continue;
            }
            try {
                console.log('------------------')
                console.log(tx.txHash)
                const params = {...tx}
                if (!params.txHash) {
                    throw new Error('no txHash in transaction to check')
                }

                const bridgeTransferParams = {
                    txHash: params.txHash,
                    destinationNetworkChainId: params.destinationNetworkChainId,
                    originNetworkChainId: params.originNetworkChainId,
                    originSignerOrProviderOrRpc: params.originSignerOrProviderOrRpc,
                    destinationSignerOrProviderOrRpc: params.destinationSignerOrProviderOrRpc,
                }
                const bridgeTransfer = await getBridgeTransfer(bridgeTransferParams, undefined)
                const info = await bridgeTransfer.getInfo();
                console.log(`${getTypeMessage(info.transferType)} ${info.originName} -> ${info.destinationName} ${info.tokenSymbol} ${info.amount ? ethers.utils.formatUnits(info.amount, tx.decimals) : info.amount}`)

                const destinationProvider = new ethers.providers.JsonRpcProvider(rpcs[tx.destinationNetworkChainId])
                const tokenAddress = tx.token[tx.destinationNetworkChainId]

                await logBalance(tx.token, tx.destinationNetworkChainId, destinationProvider, info.to, tx.decimals, 'Balance: ')

                const fullStatus = await bridgeTransfer.getStatus();
                if (!fullStatus) {
                    throw new Error('cant fetch status')
                }
                const status = fullStatus?.status
                console.log(`${new Date().toLocaleTimeString()} - Status: ${BridgeTransferStatusToString[status]}`);

                fullStatus.ETA && console.log(`ETA: ${new Date(fullStatus.ETA).toLocaleString()}`)

                const pendingStatuses: BridgeTransferStatus[] = [
                    BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED,
                    BridgeTransferStatus.DEPOSIT_GAS_PENDING,
                    BridgeTransferStatus.WITHDRAW_UNCONFIRMED,
                    BridgeTransferStatus.WITHDRAW_CONFIRMED,
                    BridgeTransferStatus.CCTP_COMPLETE,
                    BridgeTransferStatus.CCTP_PENDING,
                ];

                const executableStatuses: BridgeTransferStatus[] = [
                    BridgeTransferStatus.WITHDRAW_CONFIRMED,
                    BridgeTransferStatus.CCTP_COMPLETE,
                ];

                if (!status && status !== 0) {
                    throw new Error('status is undefined')
                }

                const isPending = pendingStatuses.includes(status);
                if (isPending && !tx.pendingTime) {
                    tx.pendingTime = new Date();
                }

                if (!isPending && !tx.completedTime) {
                    tx.completedTime = new Date();
                }

                if (executableStatuses.includes(status) && !tx.executableTime) {
                    tx.executableTime = new Date();
                }

                if (status  === BridgeTransferStatus.WITHDRAW_CONFIRMED || status === BridgeTransferStatus.CCTP_COMPLETE) {
                    const signer = new ethers.Wallet(key ?? '', destinationProvider);
                    console.log('Executing...')
                    const res = await bridgeTransfer.execute(signer)
                    console.log('Mined: ', res.transactionHash)

                    await logBalance(tx.token, tx.destinationNetworkChainId, destinationProvider, info.to, tx.decimals, 'New balance: ')
                }

            } catch (error) {
                console.error(`Failed to process transaction ${tx.txHash}:`, error);
            }
        }
        const delay = (ms: number): Promise<void> => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        await delay(15 * 1000)
    } while (transactions.some((t) => !t.completedTime))

    console.log('=== Final Balances ===')

    for (const token of uniqueTokens) {
        for(const _chainId of Object.keys(token)) {
            const chainId = parseInt(_chainId)
            const provider = new ethers.providers.JsonRpcProvider(rpcs[chainId])
            const bridgeToken = new BridgeToken(token, chainId);
            const decimals = await bridgeToken.getDecimals(provider)
            const tokenSymbol = await bridgeToken.getSymbol(provider)
            await logBalance(token, chainId, provider, from, decimals, `${tokenSymbol} (${networks[chainId].name}) balance: `)
        }
    }
    console.log('=====================')

    console.log('Failed transactions: ', failedTransactions);
    console.log('Transactions: ', transactions);
}





const testnetDeposits = [
    { originNetworkChainId: 421614, destinationNetworkChainId: 13746, token: TG7T },
    { originNetworkChainId: 421614, destinationNetworkChainId: 13746, token: USDC },
    { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: TG7T },
    { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: USDC },
    { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: ETH },
]

const erc20Deposits = [
    { originNetworkChainId: 421614, destinationNetworkChainId: 13746, token: TG7T },
    { originNetworkChainId: 421614, destinationNetworkChainId: 13746, token: USDC },
    { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: TG7T },
    { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: USDC },
]

const failedTransactions = [
    { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: TG7T, txHash: '0x48c5c8b4fa8b8e80a914542ee45babcea75c7c2d615bceb815397a3147064e06' },
]

const testnetWithdrawals = testnetDeposits.map((t) => ({...t, originNetworkChainId: t.destinationNetworkChainId, destinationNetworkChainId: t.originNetworkChainId}))


const hundredWithdrawals = testnetWithdrawals.flatMap(transfer => Array(5).fill(transfer));

const batch = erc20Deposits.flatMap(transfer => Array(1).fill(transfer));

// const transfers = [
//     { originNetworkChainId: 11155111, destinationNetworkChainId: 421614, token: TG7T, txHash: '0x4e4ea691c7367546dd47bcb389c2f178f59b6b35dbf0c9f9c7b91bd0eb48556a' },
// ]


// Run the script
// transfer('0.004444', testnetDeposits, {send: true});

transfer('0.000012', failedTransactions, {send: true});


