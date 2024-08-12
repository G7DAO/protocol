// Libraries
import { useState } from 'react'
// Styles and Icons
import styles from './StakingView.module.css'
import ActionButton from '@/components/bridge/bridge/ActionButton'

const StakingView = () => {
    const [value, setValue] = useState('0')
    const [name, setName] = useState('');
    const [tokenAddress, setTokenAddress] = useState('0x0');
    const [tokenId, setTokenId] = useState(0);
    const [amount, setTokenAmount] = useState(0);
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    const options = [
        "Native Token",
        "ERC20",
        "ERC721",
        "ERC1155",
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
        </div>
    )
}

export default StakingView
