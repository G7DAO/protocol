const result = require('dotenv').config();
const { ethers } = require('ethers');

// Load environment variables
const INFURA_API_URL = process.env.INFURA_API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const FOR_ADDRESS = process.env.FOR_ADDRESS;
const AMOUNT_TO_SEND = process.env.AMOUNT_TO_SEND || '0.000000001';



// Initialize provider
const provider = new ethers.JsonRpcProvider(INFURA_API_URL);

// Create a wallet instance using the private key
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function sendEth() {

    try {
        // Transaction details
        const tx = {
            to: FOR_ADDRESS,
            value: ethers.parseEther(AMOUNT_TO_SEND), // Convert amount to wei
        };

        // Send the transaction
        const transaction = await wallet.sendTransaction(tx);

        console.log(`Transaction sent: ${transaction.hash}`);

        // Wait for the transaction to be confirmed
        const receipt = await transaction.wait();
        console.log('Transaction confirmed:', receipt);
    } catch (error) {
        console.error('Error sending ETH:', error);
    }
}

// Function to start the bot
async function startBot() {
    console.log('Bot is starting...');
    setInterval(async () => {
        await sendEth();
    }, 5000)
}

// Run the bot
startBot();
