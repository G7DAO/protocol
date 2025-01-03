import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TokenSender } from '../typechain-types';
import { HardhatEthersSigner } from '../helpers/type';
import { ONE_DAY } from '../constants/time';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('TokenSender', function () {
    let tokenSenderContract: TokenSender;
    let deployer: HardhatEthersSigner;
    let executor: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    let timeInterval: number;

    beforeEach(async function () {
        [deployer, executor, addr1, addr2] = await ethers.getSigners();

        timeInterval = ONE_DAY;

        const TokenSender = await ethers.getContractFactory('TokenSender');
        tokenSenderContract = await TokenSender.deploy(timeInterval);
        await tokenSenderContract.waitForDeployment();
    });

    it('Should deploy the TokenSender', async function () {
        expect(await tokenSenderContract.faucetTimeInterval()).to.equal(timeInterval);
        expect(await tokenSenderContract.lastSentTimestamp(addr1.address)).to.equal(0);
    });

    it('Should allow any account to send tokens to a recipient', async function () {
        const tokenSenderContractWithExecutor = tokenSenderContract.connect(executor);
        const value = 7n;

        const executorBalanceInitial = await ethers.provider.getBalance(executor.address);
        const addr1BalanceInitial = await ethers.provider.getBalance(addr1.address);

        const sendTx = await tokenSenderContractWithExecutor.send(addr1.address, { value });
        const sendTxReceipt = await sendTx.wait();
        expect(sendTxReceipt).to.not.be.null;
        const sendBlock = await ethers.provider.getBlock(sendTxReceipt!.blockNumber);
        expect(sendBlock).to.not.be.null;

        const gasCost = sendTxReceipt!.fee;
        const sendBlockTimestamp = sendBlock!.timestamp;
        const executorBalanceFinal = await ethers.provider.getBalance(executor.address);
        const addr1BalanceFinal = await ethers.provider.getBalance(addr1.address);

        expect(await tokenSenderContract.lastSentTimestamp(addr1.address)).to.equal(sendBlockTimestamp);
        expect(executorBalanceFinal).to.equal(executorBalanceInitial - value - gasCost);
        expect(addr1BalanceFinal).to.equal(addr1BalanceInitial + value);
        expect(sendTx).to.emit(tokenSenderContract, 'TokensSent').withArgs(executor.address, addr1.address, value);
    });

    it('Should not allow tokens to be sent to the same recipient multiple times within the faucetTimeInterval', async function () {
        const tokenSenderContractWithExecutor = tokenSenderContract.connect(executor);
        const value = 7n;

        const executorBalanceInitial = await ethers.provider.getBalance(executor.address);
        const addr1BalanceInitial = await ethers.provider.getBalance(addr1.address);

        const sendTx = await tokenSenderContractWithExecutor.send(addr1.address, { value });
        const sendTxReceipt = await sendTx.wait();
        expect(sendTxReceipt).to.not.be.null;
        const sendBlock = await ethers.provider.getBlock(sendTxReceipt!.blockNumber);
        expect(sendBlock).to.not.be.null;

        const gasCost = sendTxReceipt!.fee;
        const sendBlockTimestamp = sendBlock!.timestamp;
        const executorBalanceIntermediate = await ethers.provider.getBalance(executor.address);
        const addr1BalanceIntermediate = await ethers.provider.getBalance(addr1.address);

        expect(await tokenSenderContract.lastSentTimestamp(addr1.address)).to.equal(sendBlockTimestamp);
        expect(executorBalanceIntermediate).to.equal(executorBalanceInitial - value - gasCost);
        expect(addr1BalanceIntermediate).to.equal(addr1BalanceInitial + value);
        expect(sendTx).to.emit(tokenSenderContract, 'TokensSent').withArgs(executor.address, addr1.address, value);

        await time.setNextBlockTimestamp(sendBlock!.timestamp + ONE_DAY);
        await expect(tokenSenderContractWithExecutor.send(addr1.address, { value }))
            .to.be.revertedWithCustomError(tokenSenderContractWithExecutor, 'TokenSenderClaimIntervalNotPassed')
            .withArgs(addr1.address);

        const addr1BalanceFinal = await ethers.provider.getBalance(addr1.address);

        expect(addr1BalanceFinal).to.equal(addr1BalanceIntermediate);
    });

    it('Should allow tokens to be sent to the same recipient after the faucetTimeInterval has expired', async function () {
        const tokenSenderContractWithExecutor = tokenSenderContract.connect(executor);
        const value = 7n;

        const executorBalanceInitial = await ethers.provider.getBalance(executor.address);
        const addr1BalanceInitial = await ethers.provider.getBalance(addr1.address);

        const sendTx = await tokenSenderContractWithExecutor.send(addr1.address, { value });
        const sendTxReceipt = await sendTx.wait();
        expect(sendTxReceipt).to.not.be.null;
        const sendBlock = await ethers.provider.getBlock(sendTxReceipt!.blockNumber);
        expect(sendBlock).to.not.be.null;

        const gasCost = sendTxReceipt!.fee;
        const sendBlockTimestamp = sendBlock!.timestamp;
        const executorBalanceIntermediate = await ethers.provider.getBalance(executor.address);
        const addr1BalanceIntermediate = await ethers.provider.getBalance(addr1.address);

        expect(await tokenSenderContract.lastSentTimestamp(addr1.address)).to.equal(sendBlockTimestamp);
        expect(executorBalanceIntermediate).to.equal(executorBalanceInitial - value - gasCost);
        expect(addr1BalanceIntermediate).to.equal(addr1BalanceInitial + value);
        expect(sendTx).to.emit(tokenSenderContract, 'TokensSent').withArgs(executor.address, addr1.address, value);

        await time.setNextBlockTimestamp(sendBlock!.timestamp + ONE_DAY + 1);
        const secondSendTx = await tokenSenderContractWithExecutor.send(addr1.address, { value });
        const secondSendTxReceipt = await secondSendTx.wait();
        expect(secondSendTxReceipt).to.not.be.null;
        const secondSendBlock = await ethers.provider.getBlock(secondSendTxReceipt!.blockNumber);
        expect(secondSendBlock).to.not.be.null;

        const secondGasCost = secondSendTxReceipt!.fee;
        const secondSendBlockTimestamp = secondSendBlock!.timestamp;
        const executorBalanceFinal = await ethers.provider.getBalance(executor.address);
        const addr1BalanceFinal = await ethers.provider.getBalance(addr1.address);

        expect(await tokenSenderContract.lastSentTimestamp(addr1.address)).to.equal(secondSendBlockTimestamp);
        expect(executorBalanceFinal).to.equal(executorBalanceIntermediate - value - secondGasCost);
        expect(addr1BalanceFinal).to.equal(addr1BalanceIntermediate + value);
        expect(secondSendTx)
            .to.emit(tokenSenderContract, 'TokensSent')
            .withArgs(executor.address, addr1.address, value);
    });

    it('Should return the correct lastSentTimestamp for a given address', async function () {
        const tokenSenderContractWithExecutor = tokenSenderContract.connect(executor);
        const value = 7n;

        const sendTx = await tokenSenderContractWithExecutor.send(addr1.address, { value });
        const sendTxReceipt = await sendTx.wait();
        expect(sendTxReceipt).to.not.be.null;
        const sendBlock = await ethers.provider.getBlock(sendTxReceipt!.blockNumber);
        expect(sendBlock).to.not.be.null;

        const sendBlockTimestamp = sendBlock!.timestamp;

        expect(await tokenSenderContract.lastSentTimestamp(addr1.address)).to.equal(sendBlockTimestamp);
    });
});
