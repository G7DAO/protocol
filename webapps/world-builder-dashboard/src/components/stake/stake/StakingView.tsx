// Libraries
import { useState } from 'react'
// Styles and Icons
import styles from './StakingView.module.css'
import ActionButton from '@/components/bridge/bridge/ActionButton'
import { tokenTypes, ZERO_ADDRESS } from '@/utils/web3utils';

const StakingView = () => {
    const [tokenAddress, setTokenAddress] = useState(ZERO_ADDRESS)
    const [tokenId, setTokenId] = useState('0');
    const [tokenType, setTokenType] = useState(tokenTypes[0].value)
    const [lockupSeconds, setLockupSeconds] = useState("0")
    const [cooldownSeconds, setCooldownSeconds] = useState("0")
    const [transferable, setTransferable] = useState(false)
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    const handleTokenSelect = (tokenValue: string) => {
        setTokenType(tokenValue);
        if (tokenValue === "1") {
            setTokenAddress(ZERO_ADDRESS);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <div className={styles.title}>Create a Pool</div>
                <div className={styles.subtitle}>Set your pool parameters</div>
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Token Type</div>
                <select onChange={(e) => handleTokenSelect(e.target.value)}>
                    <option disabled>Please choose one option</option>
                    {tokenTypes.map((tokenType) => {
                        return (
                            <option key={tokenType.value} value={tokenType.value}>
                                {tokenType.label}
                            </option>
                        );
                    })}
                </select>
            </div>
            {tokenType !== "1" && (
                <div className={styles.addressContainer}>
                    <div className={styles.label}>Token Address</div>
                    <input className={styles.input} value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                </div>
            )}
            {tokenType === "1155" && (
                <div className={styles.addressContainer}>
                    <div className={styles.label}>Token ID</div>
                    <input type="number" className={styles.input} value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
                </div>)}
            <div className={styles.addressContainer}>
                <div className={styles.label}>Lockdown period (in seconds)</div>
                <input type="number" className={styles.input} value={lockupSeconds} onChange={(e) => setLockupSeconds(e.target.value)} />
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Cooldown period (in seconds)</div>
                <input type="number" className={styles.input} value={cooldownSeconds} onChange={(e) => setCooldownSeconds(e.target.value)} />
            </div>
            <div>
                <input type="checkbox" id="horns" name="horns" checked={transferable} onChange={(e) => setTransferable(e.target.checked)} />
                <label>Can transfer NFT?</label>
            </div>
            <div>
                <input type="checkbox" id="horns" name="horns" />
                <label>Is Immutable?</label>
            </div>
            {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
            <ActionButton
                direction={"CREATEPOOL"}
                params={{ tokenType, tokenAddress, tokenID: tokenId, lockupSeconds, cooldownSeconds, transferable }}
                isDisabled={!!inputErrorMessage}
                setErrorMessage={setNetworkErrorMessage}
            />
        </div>
    )
}

export default StakingView
