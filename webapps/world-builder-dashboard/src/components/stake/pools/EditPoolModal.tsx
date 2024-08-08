import React from 'react';
import { Modal, ModalProps } from 'summon-ui/mantine'; // assuming the path to your modal component
import styles from './EditPoolModal.module.css'

interface EditPoolModalProps extends ModalProps {
    isOpen: boolean;
    onClose: () => void;
    poolData: {
        isTransferable: boolean;
        cooldownSeconds: number;
        lockdownSeconds: number;
    };
    onSave: (updatedData: {
        isTransferable: boolean;
        cooldownSeconds: number;
        lockdownSeconds: number;
    }) => void;
}

const EditPoolModal: React.FC<EditPoolModalProps> = ({ isOpen, onClose, poolData, onSave }) => {
    const [isTransferable, setIsTransferable] = React.useState(poolData.isTransferable);
    const [cooldownSeconds, setCooldownSeconds] = React.useState(poolData.cooldownSeconds);
    const [lockdownSeconds, setLockdownSeconds] = React.useState(poolData.lockdownSeconds);

    const handleSave = () => {
        onSave({
            isTransferable,
            cooldownSeconds,
            lockdownSeconds
        });
        onClose(); // Close modal after saving
    };

    return (
        <Modal opened={isOpen} onClose={onClose}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Edit Pool</div>
                    <div className={styles.modalSubtitle}>Modify pool settings</div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Is Transferable</label>
                    <select
                        className={styles.input}
                        value={String(isTransferable)}
                        onChange={(e) => setIsTransferable(e.target.value === 'true')}
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
                    <label className={styles.label}>Lockdown Seconds</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={lockdownSeconds}
                        onChange={(e) => setLockdownSeconds(Number(e.target.value))}
                    />
                </div>
                <div className={styles.buttons}>
                    <button className={`${styles.button} ${styles.cancelButton}`} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={styles.button} onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditPoolModal;
