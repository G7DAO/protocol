import React, { useState } from 'react';
import { Modal, ModalProps } from 'summon-ui/mantine'; // assuming the path to your modal component
import styles from './EditPoolModal.module.css'
import ActionButtonStake from '../ActionButtonStake';

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
    const [transferable, setTransferable] = useState(poolData.transferable)
    const [cooldownSeconds, setCooldownSeconds] = useState(Number(poolData.cooldownSeconds))
    const [lockupSeconds, setLockupSeconds] = useState(Number(poolData.lockupSeconds))
    const [networkErrorMessage, setNetworkErrorMessage] = useState('')

    return (
        <Modal opened={opened} onClose={onClose} onClick={(e) => { e.stopPropagation() }}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Edit Pool {poolId}</div>
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
                        type="number"
                        className={styles.input}
                        value={cooldownSeconds}
                        onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Lockup Seconds</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={lockupSeconds}
                        onChange={(e) => setLockupSeconds(Number(e.target.value))}
                    />
                </div>
                {networkErrorMessage && <div className={styles.networkErrorMessage}>{networkErrorMessage}</div>}
                <ActionButtonStake
                    actionType={"EDITPOOL"}
                    params={{ 
                        poolId, 
                        changeTransferability: transferable !== poolData.transferable, 
                        transferable, 
                        changeLockup: lockupSeconds !== Number(poolData.lockupSeconds), 
                        lockupSeconds: lockupSeconds.toString(), 
                        changeCooldown: cooldownSeconds !== Number(poolData.cooldownSeconds), 
                        cooldownSeconds: cooldownSeconds.toString(),
                    }}
                    isDisabled={transferable === poolData.transferable && lockupSeconds === Number(poolData.lockupSeconds) && cooldownSeconds === Number(poolData.cooldownSeconds)}
                    setErrorMessage={setNetworkErrorMessage}
                />
            </div>
        </Modal>
    );
};

export default EditPoolModal;
