import { ethers } from "ethers";

// Define the structure of the claim message
interface DropperClaimMessage {
  dropId: string;
  requestID: string;
  claimant: string;
  blockDeadline: string;
  amount: string;
  signature?: string;
  signer?: string;
}

// Function to create a hash of the claim message using EIP-712
export async function dropperClaimMessageHash(
    chainId: number,
    dropperAddress: string,
    dropId: string,
    requestId: string,
    claimant: string,
    blockDeadline: string,
    amount: string
  ): Promise<{ domain: any; types: any; message: any }> {
    const domain = {
      name: "Game7 Dropper",
      version: "3.0",
      chainId: chainId,
      verifyingContract: dropperAddress,
    };
  
    const types = {
      ClaimPayload: [
        { name: "dropId", type: "uint256" },
        { name: "requestID", type: "uint256" },
        { name: "claimant", type: "address" },
        { name: "blockDeadline", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
    };
  
    const message = {
      dropId: dropId,
      requestID: requestId,
      claimant: claimant,
      blockDeadline: blockDeadline,
      amount: amount,
    };
  
    return { domain, types, message };
  }

// Function to sign a message using a private key
export async function signMessage(privateKey: string, hash: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(hash));
  return signature;
}