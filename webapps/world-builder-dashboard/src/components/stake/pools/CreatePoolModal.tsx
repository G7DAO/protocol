import React, { useEffect, useState } from 'react'
import { L3_NETWORK } from '../../../../constants'
import ActionButtonStake from '../ActionButtonStake'
import styles from './CreatePoolModal.module.css'
import ValueSelector from './ValueSelector'
import { ethers } from 'ethers'
import { Flex, Modal, Tooltip } from 'summon-ui/mantine'
import IconInfoCircle from '@/assets/IconInfoCircle'
import NetworkSelector from '@/components/bridge/bridge/NetworkSelector'
import Switch from '@/components/commonComponents/switch/Switch'
import { NetworkInterface, useBlockchainContext } from '@/contexts/BlockchainContext'
import { formatAddress } from '@/utils/addressFormat'
import { doesContractExist, epochTimes, tokenTypes, ZERO_ADDRESS } from '@/utils/web3utils'

interface CreatePoolModalProps {}

const CreatePoolModal: React.FC<CreatePoolModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { connectedAccount } = useBlockchainContext()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)

  // Stepper states
  const steps = ['Details', 'Tokens', 'Settings', 'Admin']
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(steps.length).fill(false))

  // Metadata states. Note, we need access to the db to make this work
  const [project, setProject] = useState<{}>()
  const [poolName, setPoolName] = useState<string>('')
  const [poolDescription, setPoolDescription] = useState<string>('')

  // Tokens states
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInterface>(L3_NETWORK)
  const [tokenType, setTokenType] = useState(tokenTypes[0])
  const [tokenAddress, setTokenAddress] = useState<string>(ZERO_ADDRESS)
  const [tokenId, setTokenId] = useState<string>('0')

  // Settings states
  const [lockupPeriod, setLockupPeriod] = useState<string>('0')
  const [lockupDuration, setLockupDuration] = useState<number>(0)
  const [lockupDurationUnit, setLockupDurationUnit] = useState(epochTimes[0])
  const [cooldownPeriod, setCooldownPeriod] = useState<string>('0')
  const [cooldownDuration, setCooldownDuration] = useState<number>(0)
  const [cooldownDurationUnit, setCooldownDurationUnit] = useState(epochTimes[0])
  const [transferrability, setTransferrability] = useState<boolean>(false)

  // Admin states (to be added later when Staker is updated to V2)

  // Error states
  const [errors, setErrors] = useState<any>({
    tokenAddress: []
  })
  const arrayOfErrors: any[] = []

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(web3Provider)
    } else {
      addErrorMessage('Ethereum provider not found. Please install a wallet.', 'tokenAddress')
    }
  }, [completedSteps, window.ethereum]) // Will run every time `completedSteps` changes

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      completeCurrentStep()
    }
  }

  const completeCurrentStep = () => {
    const updatedSteps = [...completedSteps]
    updatedSteps[currentStep] = true
    setCompletedSteps(updatedSteps)
  }

  const addErrorMessage = (message: string, fieldName: string) => {
    const fieldErrors = errors[fieldName] || [];
  
    if (fieldErrors.includes(message)) return; 
    setErrors((prevErrors: any) => {
      let updatedFieldErrors = prevErrors[fieldName] || [];
      updatedFieldErrors = updatedFieldErrors.filter((err) => err.trim() !== '');
  
      return {
        ...prevErrors,
        [fieldName]: [...updatedFieldErrors, message]
      };
    });
  
    arrayOfErrors.push(message);
  };
  

  const removeErrorMessage = (message: string, fieldName: string) => {
    setErrors((prevErrors: any) => {
      let fieldErrors = prevErrors[fieldName]

      if (!Array.isArray(fieldErrors) || !fieldErrors.includes(message)) {
        return prevErrors
      }

      fieldErrors = fieldErrors.filter((err) => err.trim() !== '')

      const updatedFieldErrors = fieldErrors.filter((err) => err !== message)
      return updatedFieldErrors.length > 0
        ? { ...prevErrors, [fieldName]: updatedFieldErrors }
        : Object.keys(prevErrors).reduce((acc: any, key: any) => {
            if (key !== fieldName) acc[key] = prevErrors[key]
            return acc
          }, {})
    })
  }

  const handleLockupDurationChange = (e: any) => {
    setLockupDuration(e.target.value)
    const period = (e.target.value * lockupDurationUnit.value).toString()
    console.log('Lockup duration: ', period)
    setLockupPeriod(period)
  }

  const handleLockupDurationUnitChange = (e: any) => {
    setLockupDurationUnit(e)
    const period = (e.value * lockupDuration).toString()
    console.log('Lockup duration: ', period)
    setLockupPeriod(period)
  }

  const handleCooldownDurationChange = (e: any) => {
    setCooldownDuration(e.target.value)
    const period = (e.target.value * cooldownDurationUnit.value).toString()
    console.log('Cooldown period: ', period)
    setCooldownPeriod(period)
  }

  const handleCooldownDurationUnitChange = (e: any) => {
    setCooldownDurationUnit(e)
    const period = (e.value * cooldownDuration).toString()
    console.log('Cooldown period: ', period)
    setCooldownPeriod(period)
  }

  const handleTokenSelect = (tokenValue: any) => {
    setTokenType(tokenValue)
    handleAddressChange(tokenAddress, tokenValue)
    if (tokenValue === '1') {
      setTokenAddress(ZERO_ADDRESS)
      removeErrorMessage('Token address is not an address!', 'tokenAddress')
      removeErrorMessage('Token address cannot be a zero address', 'tokenAddress')
      removeErrorMessage('Token contract does not exist!', 'tokenAddress')
      return
    }
    if (tokenValue !== '1155') {
      setTokenId('0')
      return
    }
  }

  const handleAddressChange = async (address: string, tokenType?: string) => {
    console.log(address)
    if (tokenType === '1') {
      setTokenAddress(ZERO_ADDRESS)
      removeErrorMessage('Token address is not an address!', 'tokenAddress')
      removeErrorMessage('Token address cannot be a zero address', 'tokenAddress')
      removeErrorMessage('Token contract does not exist!', 'tokenAddress')
      return
    }

    setTokenAddress(address)
    if (!ethers.utils.isAddress(address)) addErrorMessage('Token address is not an address!', 'tokenAddress')
    else removeErrorMessage('Token address is not an address!', 'tokenAddress')

    if (address === ZERO_ADDRESS && tokenType !== '1') {
      addErrorMessage('Token address cannot be a zero address', 'tokenAddress')
    } else removeErrorMessage('Token address cannot be a zero address', 'tokenAddress')

    const contractExists = await doesContractExist(address, provider)
    if (ethers.utils.isAddress(address)) {
      if (!contractExists) addErrorMessage('Token contract does not exist!', 'tokenAddress')
      else removeErrorMessage('Token contract does not exist!', 'tokenAddress')
    }
  }

  const getStepStyle = (stepIndex: number) => {
    if (stepIndex === currentStep || completedSteps[stepIndex] === true) {
      return styles.step
    } else {
      return styles.stepLocked // Locked step
    }
  }

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
                    if (completedSteps[index] || index === currentStep) {
                      setCurrentStep(index)
                    }
                  }}
                >
                  <div
                    className={
                      index === currentStep
                        ? styles.stepText
                        : completedSteps[index]
                          ? styles.stepTextCompleted
                          : styles.stepTextLocked
                    }
                  >
                    {step}
                  </div>
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
                  values={[{ valueId: 0, displayName: 'Sample project 1' }]}
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
                <input className={styles.textInput} placeholder={'Pool 0'} />
              </div>
              <div className={styles.inputFieldContainer}>
                <div className={styles.label}>Description (optional)</div>
                <textarea className={styles.inputField} placeholder={'Beep bop!'} />
              </div>
            </>
          )}

          {/* Tokens step */}
          {currentStep === 1 && (
            <>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Chain</div>
                  <NetworkSelector
                    networks={[L3_NETWORK]}
                    selectedNetwork={selectedNetwork}
                    onChange={setSelectedNetwork}
                  />
                </div>
                {/* May remove due to the pool creator needing to be added at the end */}
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Token Type</div>
                  <ValueSelector values={tokenTypes} selectedValue={tokenType} onChange={(e) => handleTokenSelect(e)} />
                </div>
              </div>
              {/* Make component out of input container in the future */}
              {tokenType.valueId !== '1' && (
                <>
                  <div className={styles.inputContainer}>
                    <div className={styles.labelErrorWrapper}>
                      <div className={styles.label}>Address</div>
                      <div className={styles.errorInput}>
                        {errors.tokenAddress && errors.tokenAddress.length > 0 ? errors.tokenAddress.join(' & ') : ''}
                      </div>
                    </div>
                    <input
                      className={`${styles.textInput} ${errors.tokenAddress?.length > 0 ? styles.error : ''}`}
                      placeholder={ZERO_ADDRESS}
                      value={tokenAddress}
                      onChange={(e) => {
                        handleAddressChange(e.target.value, '')
                      }}
                    />
                  </div>
                  {tokenType.valueId === '1155' && (
                    <div className={styles.inputContainer}>
                      <div className={styles.label}>Token ID</div>
                      <input
                        type='number'
                        className={styles.textInput}
                        placeholder={'0'}
                        value={tokenId}
                        onChange={(e) => {
                          setTokenId(e.target.value)
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Settings step */}
          {currentStep === 2 && (
            <>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Lockup period</div>
                  <input
                    className={styles.textInput}
                    placeholder={'0'}
                    type='number'
                    value={lockupDuration}
                    onChange={handleLockupDurationChange}
                  />
                </div>
                {/* May remove due to the pool creator needing to be added at the end */}
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Duration unit</div>
                  <ValueSelector
                    values={epochTimes}
                    selectedValue={lockupDurationUnit}
                    onChange={handleLockupDurationUnitChange}
                  />
                </div>
              </div>
              <div className={styles.inputRow}>
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Cooldown period</div>
                  <input
                    className={styles.textInput}
                    placeholder={'0'}
                    type='number'
                    value={cooldownDuration}
                    onChange={handleCooldownDurationChange}
                  />
                </div>
                {/* May remove due to the pool creator needing to be added at the end */}
                <div className={styles.inputContainer}>
                  <div className={styles.label}>Duration unit</div>
                  <ValueSelector
                    values={epochTimes}
                    selectedValue={cooldownDurationUnit}
                    onChange={handleCooldownDurationUnitChange}
                  />
                </div>
              </div>
              <div className={styles.inputContainer}>
                <div className={styles.label}>
                  Transferability
                  <Tooltip
                    arrowSize={8}
                    radius={'8px'}
                    label={
                      'Enable to allow staked position NFTs to be transferred between usersSend a data message to a contract or address on a destination chain'
                    }
                    withArrow
                  >
                    <IconInfoCircle style={{ marginLeft: '6px' }} />
                  </Tooltip>
                </div>
                <div className={styles.addressText}>
                  Transferrable
                  <Switch checked={transferrability} onToggle={() => setTransferrability(!transferrability)} />
                </div>
              </div>
            </>
          )}

          {/* Administrator step */}
          {currentStep === 3 && (
            <>
              <div className={styles.inputContainer}>
                <div className={styles.label}>Administrator</div>
                <ValueSelector
                  values={[{ valueId: 0, displayName: 'Connected Wallet' }]}
                  selectedValue={{ valueId: 0, displayName: 'Connected Wallet' }}
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
            {currentStep !== 3 ? (
              <div
                onClick={() => {
                  console.log(errors.tokenAddress?.length)
                  errors.tokenAddress?.length === 0 || errors.tokenAddress === undefined  || currentStep != 1 ? goToNextStep() : () => {}
                }}
                className={
                  errors.tokenAddress?.length > 0 && currentStep === 1 ? styles.nextButtonDisabled : styles.nextButton
                }
              >
                <div className={styles.nextText}> Next </div>
              </div>
            ) : (
              <ActionButtonStake
                params={{
                  tokenType: tokenType.valueId,
                  tokenAddress,
                  tokenID: tokenId,
                  lockupSeconds: lockupPeriod,
                  cooldownSeconds: cooldownPeriod,
                  transferable: transferrability
                }}
                actionType='CREATEPOOL'
                isDisabled={false}
                setErrorMessage={() => {}}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

export default CreatePoolModal
