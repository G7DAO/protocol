// Libraries
import { useState } from 'react'
// Styles and Icons
import styles from './StakingView.module.css'
import ActionButton, { CreatePoolParams } from '@/components/bridge/bridge/ActionButton'

const StakingView = () => {
    const [name, setName] = useState('');
    const [tokenAddress, setTokenAddress] = useState('0x0')
    const [tokenId, setTokenId] = useState('0');
    const [tokenType, setTokenType] = useState("0");
    const [lockupSeconds, setLockupSeconds] = useState("0")
    const [cooldownSeconds, setCooldownSeconds] = useState("0")
    const [transferable, setTransferable] = useState(false)
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    const options = [
        "1",
        "20",
        "721",
        "1155",
    ];

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
                <select onChange={(e) => setTokenType(e.target.value)}>
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
                <input type="number" className={styles.input} value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
            </div>
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
