import React from 'react';
import { Modal, ModalProps } from 'summon-ui/mantine'; // assuming the path to your modal component

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
      <div className="modal-content">
        <h2>Edit Pool</h2>
        <div>
          <label>
            Is Transferable:
            <input
              type="checkbox"
              checked={isTransferable}
              onChange={(e) => setIsTransferable(e.target.checked)}
            />
          </label>
        </div>
        <div>
          <label>
            Cooldown Seconds:
            <input
              type="number"
              value={cooldownSeconds}
              onChange={(e) => setCooldownSeconds(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>
            Lockdown Seconds:
            <input
              type="number"
              value={lockdownSeconds}
              onChange={(e) => setLockdownSeconds(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

export default EditPoolModal;
