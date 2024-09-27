import React, { ReactNode, useEffect, useState } from 'react'
import styles from './Documentation.module.css'

interface ContentProps {
  setHoveredItem: (arg0: string) => void
}

const Network: React.FC<ContentProps> = ({ setHoveredItem }) => {
  return (
    <>
      <div className={styles.contentLine}>
        <span className={styles.reservedWord}>constructor</span>(<span className={styles.parameter}>chainId</span>:
        <span className={styles.reservedWord}>&nbsp;number</span>,
        <span className={styles.parameter}>&nbsp;TokenAddressMappings</span>:
        <span className={styles.interface}>&nbsp;TokenAddressMap</span>[])
        <br />
      </div>
      <div className={styles.contentLine}>
        <span className={styles.reservedWord}>public</span>
        <span className={styles.reservedWord}>&nbsp;readonly</span>
        <span className={styles.parameter}>&nbsp;tokens</span>:
        <span className={styles.interface}>&nbsp;BridgeToken[]</span>
      </div>
    </>
  )
}

const Token: React.FC<ContentProps> = ({ setHoveredItem }) => {
  return (
    <>
      <br /> constructor(token: TokenAddressMap, network: BridgeNetwork)
    </>
  )
}

const Bridger: React.FC<ContentProps> = ({ setHoveredItem }) => {
  return (
    <>
      <div className={styles.contentLine}>
        <span
          className={styles.reservedWord}
          onMouseEnter={() => setHoveredItem('networkConstructor')}
          onMouseLeave={() => setHoveredItem('')}
        >
          constructor
        </span>
        (<span className={styles.parameter}>originNetworkChainId</span>:
        <span className={styles.reservedWord}>&nbsp;number</span>,
        <span className={styles.parameter}>&nbsp;destinationNetworkChainId</span>:
        <span className={styles.reservedWord}>&nbsp;number</span>,<span className={styles.parameter}>&nbsp;token</span>:
        <span className={styles.interface}>&nbsp;TokenAddressMap</span>)
      </div>
      <div className={styles.contentLine}>
        <span className={styles.methodName}>getAllowance</span>(<span className={styles.parameter}>provider</span>:
        <span className={styles.interface}>&nbsp;SignerOrProviderOrRpc</span>,
        <span className={styles.parameter}>&nbsp;account</span>:
        <span className={styles.reservedWord}>&nbsp;string</span>):
        <span className={styles.interface}>&nbsp;Promise</span>&lt;BigNumber |
        <span className={styles.reservedWord}>&nbsp;null</span>&gt;
      </div>
      <div className={styles.contentLine}>
        <span className={styles.methodName}>getGasAndFeeEstimation</span>(
        <span className={styles.parameter}>amount</span>:&nbsp;BigNumber,
        <span className={styles.parameter}>&nbsp;provider</span>:
        <span className={styles.interface}>&nbsp;SignerOrProviderOrRpc</span>,
        <span className={styles.parameter}>&nbsp;from</span>:<span className={styles.reservedWord}>&nbsp;string</span>
        ):&nbsp;
        <span className={styles.interface}>Promise</span>&lt;
        <span className={styles.interface}>GasAndFeeEstimation</span>&gt;
      </div>
      <div className={styles.contentLine}>
        <span
          className={styles.methodName}
          onMouseEnter={() => setHoveredItem('editAllowance')}
          onMouseLeave={() => setHoveredItem('')}
        >
          approve
        </span>
        (<span className={styles.parameter}>amount</span>
        :&nbsp;BigNumber,
        <span className={styles.parameter}>&nbsp;signer</span>:
        <span className={styles.interface}>&nbsp;ethers.Signer</span>
        ):&nbsp;
        <span className={styles.interface}>Promise</span>&lt;
        <span className={styles.interface}>ethers.ContractTransaction</span>&gt;
      </div>
      <div className={styles.contentLine}>
        <span className={styles.methodName}>transfer</span>(<span className={styles.parameter}>params</span>:
        <span className={styles.interface}>&nbsp;TransferParams</span>
        ):&nbsp;
        <span className={styles.interface}>Promise</span>&lt;
        <span className={styles.interface}>ethers.ContractTransaction</span>&gt;
      </div>
    </>
  )
}

interface DocumentationProps {
  setHoveredItem: (arg0: string) => void
}

const Documentation: React.FC<DocumentationProps> = ({ setHoveredItem }) => {
  const [content, setContent] = useState<ReactNode | undefined>()

  const topics: { name: string; content: ReactNode }[] = [
    { name: 'Game7BridgeNetwork', content: <Network setHoveredItem={setHoveredItem} /> },
    { name: 'BridgeToken', content: <Token setHoveredItem={setHoveredItem} /> },
    { name: 'Bridger', content: <Bridger setHoveredItem={setHoveredItem} /> }
  ]
  const [topic, setTopic] = useState(topics[2])

  useEffect(() => {
    setTopic(topics[2])
    setContent(topics[2].content)
  }, [])
  return (
    <div className={styles.container}>
      <div className={styles.topics}>
        {topics.map((t, idx) => (
          <div
            className={t.name === topic.name ? styles.topicSelected : styles.topic}
            key={idx}
            onClick={() => {
              setTopic(t)
              setContent(t.content)
            }}
          >
            {t.name}
          </div>
        ))}
      </div>
      {content && <div className={styles.content}>{content}</div>}
    </div>
  )
}

export default Documentation
