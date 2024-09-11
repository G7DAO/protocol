import React, { useEffect, useState } from 'react'
import { L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../../../constants'
import styles from './CreatePoolModal.module.css'
import EditPoolModal from './EditPoolModal'
import ValueSelector from './ValueSelector'
import { Modal } from 'summon-ui/mantine'
import NetworkSelector from '@/components/bridge/bridge/NetworkSelector'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { formatAddress } from '@/utils/addressFormat'

interface CreatePoolModalProps {}

const CreatePoolModal: React.FC<CreatePoolModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { connectedAccount } = useBlockchainContext()

  // States the stepper
  const steps = ['Details', 'Tokens', 'Settings', 'Admin']
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(steps.length).fill(false))
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInterface>(L1_NETWORK)

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = (stepIndex: number) => {
    if (completedSteps[stepIndex]) {
      setCurrentStep(stepIndex)
    }
  }

  const completeCurrentStep = () => {
    completedSteps[currentStep] = true
  }

  const getStepStyle = (stepIndex: number) => {
    if (stepIndex === currentStep || completedSteps[currentStep] === true) {
      return styles.step // Active stepelse {
    } else {
      return styles.stepLocked // Locked step
    }
  }

  useEffect(() => {
    console.log(isOpen)
  }, [isOpen])

  return (
    <>
      <div
        className={styles.createPoolButton}
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Create Pool
      </div>
      {isOpen && (
        <Modal
          title='Create Pool'
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          onClick={(e) => {
            e.stopPropagation()
          }}
          radius={'12px'}
          padding={'24px'}
          size={'678px'}
          classNames={{ header: styles.header, body: styles.modal }}
          shadow='0px 20px 24px -4px rgba(16, 24, 40, 0.08) 0px 8px 8px -4px rgba(16, 24, 40, 0.03)'
        >
          <div className={styles.stepperContainer}>
            <div className={styles.stepper}>
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={getStepStyle(index)}
                  onClick={() => {
                    // if (completedSteps[index] || index === currentStep) {
                    setCurrentStep(index)
                    // }
                  }}
                >
                  <div className={index === currentStep ? styles.stepText : styles.stepTextLocked}>{step}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.border} />
          <div style={{ paddingTop: '16px' }} />
          {/* Details step */}
          {currentStep === 0 && (
            <>
              {/* <div className={styles.inputRow}> */}
              <div className={styles.inputContainer}>
                <div className={styles.label}>Project (optional)</div>
                <ValueSelector
                  values={[
                    { valueId: 0, displayName: 'Sample project 1' },
                    { valueId: 1, displayName: 'Sample project 2' }
                  ]}
                  selectedValue={{ valueId: 0, displayName: 'Sample project 1' }}
                  onChange={(e: any) => {
                    console.log(e)
                  }}
                />
              </div>
              {/* May remove due to the pool creator needing to be added at the end */}
              {/* <div className={styles.inputContainer}>
                  <div className={styles.label}>Pool Creator</div>
                  <div className={styles.addressText}>
                    {connectedAccount ? formatAddress(connectedAccount, false) : 'Wallet not connected'}
                  </div>
                </div> */}
              {/* </div> */}
              {/* Make component out of input container in the future */}
              <div className={styles.inputContainer}>
                <div className={styles.label}>Pool Name (optional)</div>
                <input className={styles.addressText} placeholder={'Pool 0'} />
              </div>
              <div className={styles.inputFieldContainer}>
                <div className={styles.label}>Description (optional)</div>
                <textarea className={styles.inputField} placeholder={'Beep bop!'} />
              </div>
            </>
          )}
          {currentStep === 1 && (
            <>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Chain</div>
                  <NetworkSelector
                    networks={[L1_NETWORK, L2_NETWORK, L3_NETWORK]}
                    selectedNetwork={selectedNetwork}
                    onChange={setSelectedNetwork}
                  />
                </div>
                {/* May remove due to the pool creator needing to be added at the end */}
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Token Type</div>
                  <ValueSelector
                    values={[
                      { valueId: 1, displayName: 'Native' },
                      { valueId: 20, displayName: 'ERC20' },
                      { valueId: 721, displayName: 'ERC721' },
                      { valueId: 1155, displayName: 'ERC1155' }
                    ]}
                    selectedValue={{ valueId: 1155, displayName: 'ERC1155' }}
                    onChange={(e: any) => {
                      console.log(e)
                    }}
                  />
                </div>
              </div>
              {/* Make component out of input container in the future */}
              <div className={styles.inputContainer}>
                <div className={styles.label}>Token Address</div>
                <input className={styles.addressText} placeholder={'Pool 0'} />
              </div>
              <div className={styles.inputContainer}>
                <div className={styles.label}>Token ID</div>
                <input className={styles.addressText} placeholder={'0'} />
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Lockup period</div>
                  <input className={styles.addressText} placeholder={'0'} type='number' />
                </div>
                {/* May remove due to the pool creator needing to be added at the end */}
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Duration unit</div>
                  <ValueSelector
                    values={[
                      { valueId: 0, displayName: 'Seconds' },
                      { valueId: 1, displayName: 'Minutes' },
                      { valueId: 2, displayName: 'Hours' },
                      { valueId: 3, displayName: 'Days' },
                      { valueId: 4, displayName: 'Weeks' },
                      { valueId: 5, displayName: 'Months (30 days)' }
                    ]}
                    selectedValue={{ valueId: 0, displayName: 'Seconds' }}
                    onChange={(e: any) => {
                      console.log(e)
                    }}
                  />
                </div>
              </div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Cooldown period</div>
                  <input className={styles.addressText} placeholder={'0'} type='number' />
                </div>
                {/* May remove due to the pool creator needing to be added at the end */}
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Duration unit</div>
                  <ValueSelector
                    values={[
                      { valueId: 0, displayName: 'Seconds' },
                      { valueId: 1, displayName: 'Minutes' },
                      { valueId: 2, displayName: 'Hours' },
                      { valueId: 3, displayName: 'Days' },
                      { valueId: 4, displayName: 'Weeks' },
                      { valueId: 5, displayName: 'Months (30 days)' }
                    ]}
                    selectedValue={{ valueId: 0, displayName: 'Seconds' }}
                    onChange={(e: any) => {
                      console.log(e)
                    }}
                  />
                </div>
              </div>
              <div className={styles.inputContainer}>
                <div className={styles.label}>Transferability</div>
                <input className={styles.addressText} placeholder={'Pool 0'} />
              </div>
            </>
          )}
          {currentStep === 3 && (
            <>
              <div className={styles.inputContainer}>
                <div className={styles.label}>Administrator</div>
                <ValueSelector
                  values={[
                    { valueId: 0, displayName: 'Connected Wallet' },
                    { valueId: 1, displayName: 'Zero address' },
                    { valueId: 1, displayName: 'Another wallet' }
                  ]}
                  selectedValue={{ valueId: 0, displayName: 'Hours' }}
                  onChange={(e: any) => {
                    console.log(e)
                  }}
                />
              </div>
              <div className={styles.inputContainer}>
                <div className={styles.label}>Administrator Address</div>
                <div className={styles.addressText}>{connectedAccount ? connectedAccount : 'Wallet not connected'}</div>
              </div>
            </>
          )}
          <div className={styles.border} />
          <div className={styles.footerContainer}>
            <div
              onClick={() => {
                setIsOpen(false)
              }}
              className={styles.closeButton}
            >
              <div className={styles.closeText}>Close</div>
            </div>
            <div
              onClick={() => {
                currentStep != 3 ? goToNextStep() : console.log('Create')
              }}
              className={styles.nextButton}
            >
              <div className={styles.nextText}>{currentStep != 3 ? 'Next' : 'Create'} </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CreatePoolModal
