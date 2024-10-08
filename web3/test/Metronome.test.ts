import { ethers } from 'hardhat';
import { expect } from 'chai';

export async function setupFixture() {
    const [deployer, user0, user1] = await ethers.getSigners();

    const Metronome = await ethers.getContractFactory('Metronome');
    const metronome = await Metronome.deploy();

    return { deployer, user0, user1, metronome };
}

describe('Metronome', function () {
    it('Anyone should be able to deploy a Metronome contract', async function () {
        const { metronome } = await setupFixture();
        expect(await metronome.getAddress()).to.be.properAddress;
    });

    it('A fresh metronome contract should not have any schedules registered on it', async function () {
        const { metronome } = await setupFixture();
        expect(await metronome.NumSchedules()).to.equal(0n);
    });

    it('Anyone should be able to create a schedule on a Metronome contract', async function() {
        const { metronome, user0 } = await setupFixture();

        const expectedScheduleID = await metronome.NumSchedules();

        const metronomeWithUser0 = metronome.connect(user0);
        const remainder = 7;
        const divisor = 13049;
        const bounty = 293;
        const createScheduleTx = await metronomeWithUser0.createSchedule(remainder, divisor, bounty, {value: 0});
        await expect(createScheduleTx).to.emit(metronome, 'ScheduleCreated').withArgs(expectedScheduleID, remainder, divisor, bounty);
        expect(await metronome.ScheduleBalances(expectedScheduleID)).to.equal(0n);
        const actualSchedule = await metronome.Schedules(expectedScheduleID);
        expect(actualSchedule.remainder).to.equal(remainder);
        expect(actualSchedule.divisor).to.equal(divisor);
        expect(actualSchedule.bounty).to.equal(bounty);
        expect(await metronome.LastTick(expectedScheduleID)).to.equal(0n);
    });

    it('Anyone should be able to create a schedule with a positive balance on a Metronome contract', async function() {
        const { metronome, user0 } = await setupFixture();

        const expectedScheduleID = await metronome.NumSchedules();

        const initialScheduleBalance = 1000000000000000000n;

        const metronomeWithUser0 = metronome.connect(user0);
        const remainder = 13;
        const divisor = 209344;
        const bounty = 92485;
        const createScheduleTx = await metronomeWithUser0.createSchedule(remainder, divisor, bounty, {value: initialScheduleBalance});
        await expect(createScheduleTx).to.emit(metronome, 'ScheduleCreated').withArgs(expectedScheduleID, remainder, divisor, bounty);
        await expect(createScheduleTx).to.emit(metronome, 'BalanceIncreased').withArgs(expectedScheduleID, initialScheduleBalance);
        expect(await metronome.ScheduleBalances(expectedScheduleID)).to.equal(initialScheduleBalance);
        const actualSchedule = await metronome.Schedules(expectedScheduleID);
        expect(actualSchedule.remainder).to.equal(remainder);
        expect(actualSchedule.divisor).to.equal(divisor);
        expect(actualSchedule.bounty).to.equal(bounty);
        expect(await metronome.LastTick(expectedScheduleID)).to.equal(0n);
    });

    it('Anyone should be able to increase the balance on any schedule, even one they did not create', async function() {
        const { metronome, user0, user1 } = await setupFixture();

        const scheduleID = await metronome.NumSchedules();

        const initialScheduleBalance = 10n;

        const metronomeWithUser0 = metronome.connect(user0);
        const remainder = 239;
        const divisor = 23948;
        const bounty = 845845;
        await metronomeWithUser0.createSchedule(remainder, divisor, bounty, {value: initialScheduleBalance});
        expect(await metronomeWithUser0.ScheduleBalances(scheduleID)).to.equal(initialScheduleBalance);

        const additionalScheduleBalance = 2984590485n;
        const metronomeWithUser1 = metronome.connect(user1);
        const increaseBalanceTx = await metronomeWithUser1.increaseBalance(scheduleID, {value: additionalScheduleBalance});
        await expect(increaseBalanceTx).to.emit(metronome, 'BalanceIncreased').withArgs(scheduleID, additionalScheduleBalance);
        expect(await metronome.ScheduleBalances(scheduleID)).to.equal(initialScheduleBalance + additionalScheduleBalance);
    });

    it('Anyone should be able to claim a bounty against a schedule', async function() {
        const { metronome, user0, user1 } = await setupFixture();

        const scheduleID = await metronome.NumSchedules();

        const metronomeWithUser0 = metronome.connect(user0);
        const remainder = 0;
        const divisor = 1;
        const bounty = 845845n;
        const initialScheduleBalance = bounty*1000n;
        await metronomeWithUser0.createSchedule(remainder, divisor, bounty, {value: initialScheduleBalance});

        const claimantBalance0 = await ethers.provider.getBalance(user1.address);

        const metronomeWithUser1 = metronome.connect(user1);
        const claimBountyTx = await metronomeWithUser1.claim(scheduleID, user1.address);
        const claimBountyTxReceipt = await claimBountyTx.wait();
        expect(claimBountyTxReceipt).to.not.be.null;
        await expect(claimBountyTx).to.emit(metronome, 'BountyClaimed').withArgs(scheduleID, user1.address, bounty);

        const claimantBalance1 = await ethers.provider.getBalance(user1.address);

        expect(claimantBalance1).to.equal(claimantBalance0 + bounty - claimBountyTxReceipt!.fee);
    });

    it('Anyone should be able to submit an off-schedule claim against a given schedule, resulting in a noop on the Metronome', async function() {
        const { metronome, user0, user1 } = await setupFixture();

        const scheduleID = await metronome.NumSchedules();

        const metronomeWithUser0 = metronome.connect(user0);
        const remainder = 0;
        const divisor = 2;
        const bounty = 845845n;
        const initialScheduleBalance = bounty*1000n;
        await metronomeWithUser0.createSchedule(remainder, divisor, bounty, {value: initialScheduleBalance});

        let currentBlock = await ethers.provider.getBlock('latest');
        expect(currentBlock).to.not.be.null;
        if ((currentBlock!.number - 1) % divisor === remainder) {
            // Move to a block such that the next mined block will be off-schedule.
            ethers.provider.send('evm_mine');
        }

        const claimantBalance0 = await ethers.provider.getBalance(user1.address);

        const metronomeWithUser1 = metronome.connect(user1);
        const claimBountyTx = await metronomeWithUser1.claim(scheduleID, user1.address);
        const claimBountyTxReceipt = await claimBountyTx.wait();
        expect(claimBountyTxReceipt).to.not.be.null;
        await expect(claimBountyTx).to.not.emit(metronome, 'BountyClaimed');

        const claimantBalance1 = await ethers.provider.getBalance(user1.address);

        expect(claimantBalance1).to.equal(claimantBalance0 - claimBountyTxReceipt!.fee);

    });
});
