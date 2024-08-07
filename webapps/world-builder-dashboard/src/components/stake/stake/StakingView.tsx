// Libraries
import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { L1_NETWORK, L2_NETWORK, L3_NETWORK, L3_NATIVE_TOKEN_SYMBOL } from '../../../../constants'
// Styles and Icons
import styles from './StakingView.module.css'
import ActionButton from '@/components/bridge/bridge/ActionButton'
// Components
import NetworkSelector from '@/components/bridge/bridge/NetworkSelector'
// Blockchain Context and Utility Functions
import { HighNetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
// Hooks and Constants
import useERC20Balance from '@/hooks/useERC20Balance'
import useEthUsdRate from '@/hooks/useEthUsdRate'
import useNativeBalance from '@/hooks/useNativeBalance'
import { DepositDirection } from '@/pages/BridgePage/BridgePage'
import { estimateDepositERC20ToNativeFee } from '@/utils/bridge/depositERC20ToNative'
import { estimateWithdrawFee } from '@/utils/bridge/withdrawNativeToken'

const StakingView = ({
    direction,
    setDirection
}: {
    direction: DepositDirection
    setDirection: (arg0: DepositDirection) => void
}) => {
    const [value, setValue] = useState('0')
    const [name, setName] = useState('');
    const [tokenAddress, setTokenAddress] = useState('0x0');
    const [tokenId, setTokenId] = useState(0);
    const [amount, setTokenAmount] = useState(0);
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    const g7tUsdRate = useQuery(['rate'], () => 0)
    const { data: ethUsdRate } = useEthUsdRate()
    const { connectedAccount, selectedLowNetwork, setSelectedLowNetwork, selectedHighNetwork, setSelectedHighNetwork } =
        useBlockchainContext()
    const { data: lowNetworkBalance, isFetching: isFetchingLowNetworkBalance } = useERC20Balance({
        tokenAddress: selectedLowNetwork.g7TokenAddress,
        account: connectedAccount,
        rpc: selectedLowNetwork.rpcs[0]
    })
    const { data: highNetworkBalance, isFetching: isFetchingHighNetworkBalance } = useERC20Balance({
        tokenAddress: selectedHighNetwork.g7TokenAddress,
        account: connectedAccount,
        rpc: selectedHighNetwork.rpcs[0]
    })
    const { data: l3NativeBalance, isFetching: isFetchingL3NativeBalance } = useNativeBalance({
        account: connectedAccount,
        rpc: L3_NETWORK.rpcs[0]
    })
    const { data: lowNetworkNativeBalance } = useNativeBalance({
        account: connectedAccount,
        rpc: selectedLowNetwork.rpcs[0]
    })

    const { data: highNetworkNativeBalance } = useNativeBalance({
        account: connectedAccount,
        rpc: selectedHighNetwork.rpcs[0]
    })

    const estimatedFee = useQuery(['estimatedFee', value, direction, selectedHighNetwork], async () => {
        if (!connectedAccount) {
            return
        }
        let est
        if (direction === 'DEPOSIT') {
            est = await estimateDepositERC20ToNativeFee(
                value,
                connectedAccount,
                selectedLowNetwork,
                selectedHighNetwork as HighNetworkInterface
            )
        } else {
            est = await estimateWithdrawFee(value, connectedAccount, selectedLowNetwork)
        }
        return est
    })

    const options = [
        "Native Token",
        "ERC20",
        "ERC721",
        "ERC1155",
    ];

    useEffect(() => {
        setNetworkErrorMessage('')
    }, [selectedHighNetwork, selectedLowNetwork, value])

    const renderNetworkSelect = (isSource: boolean, direction: 'DEPOSIT' | 'WITHDRAW') => {
        if ((isSource && direction === 'DEPOSIT') || (!isSource && direction === 'WITHDRAW')) {
            return (
                <NetworkSelector
                    networks={[L1_NETWORK, L2_NETWORK]}
                    selectedNetwork={selectedLowNetwork}
                    onChange={setSelectedLowNetwork}
                />
            )
        } else {
            return (
                <NetworkSelector
                    networks={[L2_NETWORK, L3_NETWORK]}
                    selectedNetwork={selectedHighNetwork}
                    onChange={setSelectedHighNetwork}
                />
            )
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <div className={styles.title}>Create a Pool</div>
                <div className={styles.subtitle}>Set your pool parameters</div>
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Name</div>
                <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Token Type</div>
                <select>
                    <option>Please choose one option</option>
                    {options.map((option, index) => {
                        return (
                            <option key={index}>
                                {option}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Token Address (if non-native)</div>
                <input className={styles.input} value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Token ID (if NFT)</div>
                <input className={styles.input} value={tokenId} onChange={(e) => setTokenId(Number(e.target.value))} />
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Lockdown period (in seconds)</div>
                <input className={styles.input} />
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Cooldown period (in seconds)</div>
                <input className={styles.input} />
            </div>
            <div>
                <input type="checkbox" id="horns" name="horns" />
                <label>Can transfer NFT?</label>
            </div>
            <div>
                <input type="checkbox" id="horns" name="horns" />
                <label>Is Immutable?</label>
            </div>
            {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
            <ActionButton
                direction={direction}
                amount={value}
                isDisabled={!!inputErrorMessage}
                setErrorMessage={setNetworkErrorMessage}
            />
        </div>
    )
}

export default StakingView
