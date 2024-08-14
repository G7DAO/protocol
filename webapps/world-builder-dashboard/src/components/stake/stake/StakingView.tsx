// Libraries
import { useState } from 'react'
// Styles and Icons
import styles from './StakingView.module.css'
import { doesContractExist, tokenTypes, ZERO_ADDRESS } from '@/utils/web3utils';
import { ethers } from 'ethers';
import ActionButtonStake from '../ActionButtonStake';

const StakingView = () => {
    const [tokenAddress, setTokenAddress] = useState(ZERO_ADDRESS)
    const [tokenId, setTokenId] = useState('0');
    const [tokenType, setTokenType] = useState(tokenTypes[0].value)
    const [lockupSeconds, setLockupSeconds] = useState("0")
    const [cooldownSeconds, setCooldownSeconds] = useState("0")
    const [transferable, setTransferable] = useState(false)
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    // assign provider
    let provider: ethers.providers.Provider
    if (window.ethereum)
        provider = new ethers.providers.Web3Provider(window.ethereum)

    const handleTokenSelect = (tokenValue: string) => {
        setTokenType(tokenValue)
        if (tokenValue === "1") {
            setTokenAddress(ZERO_ADDRESS)
            setInputErrorMessage("")
            return
        }
        if (tokenValue !== "1155")
            setTokenId('0');
    }

    const handleAddressChange = async (address: string) => {
        const contractExists = await doesContractExist(address, provider)
        if (!ethers.utils.isAddress(address))
            setInputErrorMessage("Token address is not an address!")
        else if (address === ZERO_ADDRESS && tokenType !== "1")
            setInputErrorMessage("Token address cannot be a zero address")
        else if (!contractExists) {
            setInputErrorMessage("Token contract does not exist")
        } else
            setInputErrorMessage("")

        setTokenAddress(address);
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <div className={styles.title}>Create a Pool</div>
                <div className={styles.subtitle}>Set your pool parameters</div>
            </div>
            <div className={styles.addressContainer}>
                <div className={styles.label}>Token Type</div>
                <select className={styles.input} onChange={(e) => handleTokenSelect(e.target.value)}>
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
                    <input className={styles.input} value={tokenAddress} onChange={(e) => handleAddressChange(e.target.value)} />
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
            {inputErrorMessage && <div className={styles.networkErrorMessage}>{inputErrorMessage}</div>}
            <ActionButtonStake
                direction={"CREATEPOOL"}
                params={{ tokenType, tokenAddress, tokenID: tokenId, lockupSeconds, cooldownSeconds, transferable }}
                isDisabled={inputErrorMessage != ""}
                setErrorMessage={setNetworkErrorMessage}
            />
        </div>
    )
}

export default StakingView
