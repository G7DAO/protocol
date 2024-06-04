import { Game7Token, Staking2 } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { toWei } from "../helpers/bignumber";

describe("Staking2 contract", function () {
  let token: Game7Token;
  let staking: Staking2;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const totalSupply = toWei(1000);

  beforeEach(async function () {
    const TokenFactory = await ethers.getContractFactory("Game7Token");
    token = await TokenFactory.deploy(totalSupply);
    const StakingFactory = await ethers.getContractFactory("Staking2");
    staking = await StakingFactory.deploy();
    [deployer, user1, user2] = await ethers.getSigners();

    await token.transfer(user1.address, toWei(100));
  });

  describe("Deposit with no time lock", function () {
    const depositAmount = toWei(2);

    it("should allow deposit/withdraw", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const depositCount = await staking.getDepositCount(user1.address);
      await staking.connect(user1).deposit(token.getAddress(), depositAmount, 0, user1.address);

      const lastDeposit = await staking.depositsOf(user1.address, depositCount);
      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - depositAmount);


      await staking.connect(user1).withdraw(depositCount, user1.address);

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance);
    });

  });

  describe("Deposit with time lock", function () {
    const depositAmount = toWei(2);
    const lockingPeriod = 3600; // 1 hour

    it("should allow deposit/withdraw", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const depositCount = await staking.getDepositCount(user1.address);
      await staking.connect(user1).deposit(token.getAddress(), depositAmount, lockingPeriod, user1.address);

      const lastDeposit = await staking.depositsOf(user1.address, depositCount);
      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - depositAmount);

      await expect(
        staking.connect(user1).withdraw(depositCount, user1.address)
      ).to.be.reverted;

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - depositAmount);

      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);
      await staking.connect(user1).withdraw(depositCount, user1.address);

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance);
    });

  });

  describe("Deposit on behalf of another", function () {
    const depositAmount = toWei(2);

    it("should allow deposit/withdraw", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const depositCount = await staking.getDepositCount(user2.address);
      await staking.connect(user1).deposit(token.getAddress(), depositAmount, 0, user2.address);

      const lastDeposit = await staking.depositsOf(user2.address, depositCount);
      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.getDepositCount(user2.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - depositAmount);


      await staking.connect(user2).withdraw(depositCount, user1.address);

      expect(await staking.getDepositCount(user2.address)).to.equal(depositCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance);
    });

  });

});