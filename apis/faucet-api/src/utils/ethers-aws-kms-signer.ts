// Source: https://github.com/0xcuonghx/ethers-kms-signer/blob/main/packages/ethers-aws-kms-signer/src/aws-kms-signer.ts
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms'
import { ECDSASigValue } from '@peculiar/asn1-ecc'
import { AsnConvert } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import {
  AbstractSigner,
  assert,
  assertArgument,
  BytesLike,
  dataLength,
  getAddress,
  getBytes,
  hashMessage,
  keccak256,
  N as secp256k1N,
  Provider,
  recoverAddress as recoverAddressFn,
  resolveAddress,
  resolveProperties,
  Signature,
  toBeHex,
  toBigInt,
  Transaction,
  TransactionLike,
  TransactionRequest,
  TypedDataDomain,
  TypedDataEncoder,
  TypedDataField,
} from 'ethers'

export type EthersAwsKmsSignerConfig = {
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
  }
  region: string
  keyId: string
}

export class AwsKmsSigner<P extends null | Provider = null | Provider> extends AbstractSigner {
  private config: EthersAwsKmsSignerConfig
  private client: KMSClient

  address!: string

  constructor(config: EthersAwsKmsSignerConfig, provider?: P) {
    super(provider)
    this.config = config
    this.client = this._createKMSClient(config.region, config.credentials)
  }

  connect(provider: Provider | null): AwsKmsSigner {
    return new AwsKmsSigner(this.config, provider)
  }

  async getAddress(): Promise<string> {
    if (!this.address) {
      const command = new GetPublicKeyCommand({ KeyId: this.config.keyId })
      const response = await this.client.send(command)

      const publicKeyHex = response.PublicKey
      if (!publicKeyHex) {
        throw new Error(`Could not get Public Key from KMS.`)
      }

      const ecPublicKey = AsnConvert.parse(Buffer.from(publicKeyHex), SubjectPublicKeyInfo).subjectPublicKey

      // The public key starts with a 0x04 prefix that needs to be removed
      // more info: https://www.oreilly.com/library/view/mastering-ethereum/9781491971932/ch04.html
      this.address = `0x${keccak256(new Uint8Array(ecPublicKey.slice(1, ecPublicKey.byteLength))).slice(-40)}`
    }

    return this.address
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    // Replace any Addressable or ENS name with an address
    const { to } = await resolveProperties({
      to: tx.to ? resolveAddress(tx.to, this.provider) : undefined,
      from: tx.from ? resolveAddress(tx.from, this.provider) : undefined,
    })

    if (to !== null) {
      tx.to = to
    }
    // TypeError: Cannot set property from of #<Transaction> which has only a getter
    // if (from !== null) {
    //   tx.from = from;
    // }

    const address = await this.getAddress()

    if (tx.from !== null) {
      assertArgument(getAddress(tx.from as string) === address, 'transaction from address mismatch', 'tx.from', tx.from)
      delete tx.from
    }

    // Build the transaction
    const btx = Transaction.from(tx as TransactionLike<string>)
    btx.signature = await this._sign(btx.unsignedHash)

    return btx.serialized
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const signature = await this._sign(hashMessage(message))
    return signature.serialized
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, any>,
  ): Promise<string> {
    // Populate any ENS names
    const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (name: string) => {
      // @TODO: this should use resolveName; addresses don't
      //        need a provider

      assert(this.provider !== null, 'cannot resolve ENS names without a provider', 'UNSUPPORTED_OPERATION', {
        operation: 'resolveName',
        info: { name },
      })

      const address = await this.provider.resolveName(name)
      assert(address !== null, 'unconfigured ENS name', 'UNCONFIGURED_NAME', {
        value: name,
      })

      return address
    })

    const signature = await this._sign(TypedDataEncoder.hash(populated.domain, types, populated.value))

    return signature.serialized
  }

  private _createKMSClient(
    region: string,
    credentials?: {
      accessKeyId: string
      secretAccessKey: string
    },
  ) {
    return new KMSClient({
      credentials,
      region,
    })
  }

  private async _sign(digest: BytesLike): Promise<Signature> {
    assertArgument(dataLength(digest) === 32, 'invalid digest length', 'digest', digest)

    const command = new SignCommand({
      KeyId: this.config.keyId,
      Message: getBytes(digest),
      MessageType: 'DIGEST',
      SigningAlgorithm: 'ECDSA_SHA_256',
    })

    const response = await this.client.send(command)
    const signatureHex = response.Signature

    if (!signatureHex) {
      throw new Error('Could not fetch Signature from KMS.')
    }

    const signature = AsnConvert.parse(Buffer.from(signatureHex), ECDSASigValue)

    let s = toBigInt(new Uint8Array(signature.s))
    s = s > secp256k1N / BigInt(2) ? secp256k1N - s : s

    const recoverAddress = recoverAddressFn(digest, {
      r: toBeHex(toBigInt(new Uint8Array(signature.r)), 32),
      s: toBeHex(s, 32),
      v: 0x1b,
    })

    const address = await this.getAddress()

    return Signature.from({
      r: toBeHex(toBigInt(new Uint8Array(signature.r)), 32),
      s: toBeHex(s, 32),
      v: recoverAddress.toLowerCase() !== address.toLowerCase() ? 0x1c : 0x1b,
    })
  }
}
