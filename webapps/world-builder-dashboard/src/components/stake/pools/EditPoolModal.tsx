import React, { useEffect, useState } from 'react';
import { Modal, ModalProps } from 'summon-ui/mantine'; // assuming the path to your modal component
import styles from './EditPoolModal.module.css'
import ActionButton from '@/components/bridge/bridge/ActionButton';

interface EditPoolModalProps extends ModalProps {
    opened: boolean;
    onClose: () => void;
    poolData: {
        poolId: string;
        transferable: boolean;
        cooldownSeconds: string;
        lockupSeconds: string;
    };
}

const EditPoolModal: React.FC<EditPoolModalProps> = ({ opened, onClose, poolData }) => {
    const poolId = poolData.poolId;
    const [transferable, setTransferable] = useState(poolData.transferable);
    const [cooldownSeconds, setCooldownSeconds] = useState(poolData.cooldownSeconds);
    const [lockupSeconds, setLockupSeconds] = useState(poolData.lockupSeconds);
    const [changeTransferability, setChangeTransferability] = useState(false);
    const [changeLockup, setChangeLockup] = useState(false);
    const [changeCooldown, setChangeCooldown] = useState(false);
    const [inputErrorMessage, setInputErrorMessage] = useState('')
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    // to save on gas in the function, only update the values in smart contract if the values from frontend change
    useEffect(() => {
        if (lockupSeconds !== poolData.lockupSeconds) {
            setChangeLockup(true);
        }
        console.log("change lockup:", true);
    }, [lockupSeconds])

    useEffect(() => {
        if (cooldownSeconds !== poolData.cooldownSeconds) {
            setChangeCooldown(true);
            console.log("change cooldown:", true);
        }
    }, [cooldownSeconds])

    useEffect(() => {
        if (transferable !== poolData.transferable) {
            setChangeTransferability(true);
            console.log("change transferability:", true);
        }
    }, [transferable])

    return (
        <Modal opened={opened} onClose={onClose} onClick={(e) => { e.stopPropagation() }}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Edit Pool</div>
                    <div className={styles.modalSubtitle}>Modify pool settings</div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Is Transferable</label>
                    <select
                        className={styles.input}
                        value={String(transferable)}
                        onChange={(e) => setTransferable(e.target.value === 'true')}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Cooldown Seconds</label>
                    <input
                        type="string"
                        className={styles.input}
                        value={cooldownSeconds}
                        onChange={(e) => setCooldownSeconds(e.target.value)}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Lockup Seconds</label>
                    <input
                        type="string"
                        className={styles.input}
                        value={lockupSeconds}
                        onChange={(e) => setLockupSeconds(e.target.value)}
                    />
                </div>
                <ActionButton
                    direction={"EDITPOOL"}
                    params={{ poolId, changeTransferability, transferable, changeLockup, lockupSeconds, changeCooldown, cooldownSeconds }}
                    isDisabled={!!inputErrorMessage}
                    setErrorMessage={setNetworkErrorMessage}
                />
            </div>
        </Modal>
    );
};

export default EditPoolModal;
