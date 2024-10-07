require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

// Load environment variables
const INFURA_API_URL = process.env.INFURA_API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
//const SCHEDULE_ID = process.env.SCHEDULE_ID;
const FOR_ADDRESS = process.env.FOR_ADDRESS;

// Read the contract's ABI (assuming it's in the file 'MetronomeABI.json')
const CONTRACT_ABI = JSON.parse(fs.readFileSync('abis/Metronome.abi.json', 'utf8'));

// Initialize provider
const provider = new ethers.JsonRpcProvider(INFURA_API_URL);

// Create a wallet instance using the private key
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Create a contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

//initialize claimCount
let claimCount = 0;

// Function to call the 'claim' function on the contract
async function claimTokens() {
    const SCHEDULE_ID = claimCount % 5;
    try {
        // Call the claim function on the contract
        const tx = await contract.claim(SCHEDULE_ID, FOR_ADDRESS);
        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for the transaction to be confirmed
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
    } catch (error) {
        console.error('Error calling claim:', error);
    }
    claimCount++;
}

// Start the bot
async function startBot() {
    console.log('Bot is starting...');
    setInterval(async () => {
        await claimTokens();
    }, 10000)

}

startBot();