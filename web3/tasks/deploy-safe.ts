import * as fs from 'fs';
import { createSafeProposal } from '../helpers/safe';
import { task } from 'hardhat/config';
import { IMMUTABLE_CREATE2_FACTORY_ADDRESS } from '../helpers/addresses';

/**
 * @dev deploy a contract through a Gnosis Safe
 * @param rpc RPC URL
 * @param keyfile Path to the keyfile
 * @param password Password for the keyfile
 * @param safe Safe address
 * @param contract Contract name to deploy
 * @param salt (Optional) Salt for deterministic deployment
 */
task('deploy-safe', 'Deploy a contract through a Gnosis Safe')
    .addParam('rpc', 'RPC URL')
    .addParam('keyfile', 'Path to the keyfile')
    .addParam('password', 'Password for the keyfile')
    .addParam('safe', 'Safe address')
    .addParam('contract', 'Contract name to deploy')
    .addOptionalParam('salt', 'Salt for deterministic deployment')
    .addOptionalParam('constructorArgs', 'Constructor arguments')
    .addOptionalParam('value', 'Value to send with the transaction')
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const rpcUrl = taskArgs.rpc;
        const keyfileLocation = taskArgs.keyfile;
        const password = taskArgs.password;
        const safeAddress = taskArgs.safe;
        const contractName = taskArgs.contract;
        const constructorArgsParam = taskArgs.constructorArgs;
        const value = taskArgs.value;
        let salt = taskArgs.salt;

        if (!rpcUrl || !keyfileLocation || !password || !safeAddress || !contractName) {
            console.error('Missing required arguments. Use "npx hardhat deploy-safe-help" for usage information.');
            return process.exit(1);
        }

        const constructorArgs = constructorArgsParam ? constructorArgsParam.split(',') : [];

        if (!salt) {
            // Generate a salt where the first 20 bytes are the Safe address
            const randomPart = ethers.hexlify(ethers.randomBytes(12)); // 12 bytes = 32 - 20
            salt = ethers.concat([ethers.zeroPadValue(safeAddress, 20), randomPart]);
            console.log('No salt provided, using generated salt: ', salt);
        }

        if (!ethers.isAddress(safeAddress)) {
            console.error('Safe address is invalid');
            return process.exit(1);
        }

        const keyfileJson = fs.readFileSync(keyfileLocation, 'utf8');
        const wallet = await ethers.Wallet.fromEncryptedJson(keyfileJson, password);

        const immutableCreate2Factory = await ethers.getContractAt(
            'ImmutableCreate2Factory',
            IMMUTABLE_CREATE2_FACTORY_ADDRESS
        );
        const contract = await ethers.getContractFactory(contractName);
        const contractDeployTx = await contract.getDeployTransaction(...constructorArgs);
        const deploymentTx = await immutableCreate2Factory.safeCreate2.populateTransaction(salt, contractDeployTx.data);

        return createSafeProposal(
            rpcUrl,
            wallet,
            safeAddress,
            IMMUTABLE_CREATE2_FACTORY_ADDRESS,
            deploymentTx.data,
            value || '0'
        );
    });

task('deploy-safe-help', 'Display help for the deploy-safe command').setAction(async (taskArgs, hre) => {
    console.log('Usage: npx hardhat deploy-safe [options]');
    console.log('\nOptions:');
    console.log('  --rpc <url>             RPC URL for the target network');
    console.log('  --keyfile <path>        Path to the keyfile for transaction signing');
    console.log('  --password <password>   Password for the keyfile');
    console.log('  --safe <address>        Gnosis Safe address');
    console.log('  --contract <name>       Contract name to deploy');
    console.log('  --salt <value>          (Optional) Salt for deterministic deployment');
    console.log(
        '  --constructor-args <args> (Optional) Constructor arguments for the contract (comma separated, example: --constructor-args 1,2,3)'
    );
    console.log('\nExample:');
    console.log(
        '  npx hardhat deploy-safe --rpc https://example.rpc.com --keyfile ./keyfile.json --password mypassword --safe 0x1234... --contract MyContract'
    );
});
