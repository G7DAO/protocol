/**
 * Custom error class for errors related to the bridging functionality.
 */
export class BridgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BridgerError';
  }
}

/**
 * Custom error class for errors related to unsupported networks.
 */
export class UnsupportedNetworkError extends BridgerError {
  constructor(chainId: number) {
    super(`Unsupported network with chain ID: ${chainId}`);
    this.name = 'UnsupportedNetworkError';
  }
}

/**
 * Custom error class for errors related to missing provider information.
 */
export class MissingProviderError extends BridgerError {
  constructor() {
    super('Signer does not have an associated provider.');
    this.name = 'MissingProviderError';
  }
}

/**
 * Custom error class for errors related to failed transactions.
 */
export class TransactionError extends BridgerError {
  constructor(message: string, transactionHash?: string) {
    super(message);
    this.name = 'TransactionError';
    if (transactionHash) {
      this.message += ` Transaction Hash: ${transactionHash}`;
    }
  }
}
