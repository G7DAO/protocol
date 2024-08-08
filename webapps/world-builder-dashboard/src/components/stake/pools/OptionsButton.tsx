import React, { useState } from 'react';
import styles from './OptionsButton.module.css';

interface OptionsButtonProps {
  onViewPositions: () => void;
}

const OptionsButton: React.FC<OptionsButtonProps> = ({ onViewPositions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    console.log(`${option} clicked`);
    if (option === 'View Positions') {
      onViewPositions();
    }
    setIsOpen(false); // Close dropdown after selection
  };

  return (
    <div className={styles.container} onClick={toggleDropdown}>
      <span className={styles.label}>Options</span>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownItem} onClick={() => handleOptionClick('View Positions')}>View Positions</div>
          <div className={styles.dropdownItem} onClick={() => handleOptionClick('Edit Pool')}>Edit Pool</div>
        </div>
      )}
    </div>
  );
};

export default OptionsButton;
