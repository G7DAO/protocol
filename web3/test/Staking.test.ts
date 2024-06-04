import { Game7Token, Staking } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { toWei } from "../helpers/bignumber";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("Staking contract", function () {
  let token: Game7Token;
  let staking: Staking;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const totalSupply = toWei(1000);

  beforeEach(async function () {
    const TokenFactory = await ethers.getContractFactory("Game7Token");
    token = await TokenFactory.deploy(totalSupply);
    const StakingFactory = await ethers.getContractFactory("Staking");
    staking = await StakingFactory.deploy(token.getAddress());
    [deployer, user1, user2] = await ethers.getSigners();

    await token.transfer(user1.address, toWei(100));
  });

  describe("Deployment", function () {
    it("Should set the deposit token", async function () {
      expect(await staking.depositToken()).to.equal(await token.getAddress());
    });
  });

  describe("Staking", function () {
    const stakeAmount = toWei(2);
    const unstakeAmount = toWei(1);

    it("Should stake/unstake tokens for self", async function () {
      const initialBalance = await token.balanceOf(user1.address);

      await staking.connect(user1).stake(stakeAmount, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(stakeAmount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - stakeAmount);
    
      await staking.connect(user1).unstake(unstakeAmount, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(stakeAmount - unstakeAmount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - stakeAmount + unstakeAmount);
    });

    it("Should stake/unstake tokens on behalf of another", async function () {
      const initialBalance = await token.balanceOf(user1.address);

      await staking.connect(user1).stake(stakeAmount, user2.address);

      expect(await staking.balanceOf(user2.address)).to.equal(stakeAmount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - stakeAmount);
    
      await staking.connect(user2).unstake(unstakeAmount, user1.address);

      expect(await staking.balanceOf(user2.address)).to.equal(stakeAmount - unstakeAmount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - stakeAmount + unstakeAmount);
    });
  });

  describe("Locking", function () {
    const lockAmount = toWei(3);
    const lockingPeriod = 3600; // 1 hour

    it("Should lock/unlock tokens for self", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const depositCount = await staking.getDepositCount(user1.address);

      await staking.connect(user1).lock(lockAmount, lockingPeriod, user1.address);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;
      const lastDeposit = await staking.depositsOf(user1.address, depositCount);

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(lockAmount);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - lockAmount);
    
      await expect(
        staking.connect(user1).unlock(depositCount, user1.address)
      ).to.be.reverted;

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(lockAmount);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - lockAmount);

      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);
      await staking.connect(user1).unlock(depositCount, user1.address);

      expect(await staking.getDepositCount(user1.address)).to.equal(depositCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance);
    });

    it("Should lock/unlock tokens on behalf of another", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const depositCount = await staking.getDepositCount(user1.address);

      await staking.connect(user1).lock(lockAmount, lockingPeriod, user2.address);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;
      const lastDeposit = await staking.depositsOf(user2.address, depositCount);

      expect(await staking.getDepositCount(user2.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(lockAmount);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - lockAmount);
    
      await expect(
        staking.connect(user2).unlock(depositCount, user1.address)
      ).to.be.reverted;

      expect(await staking.getDepositCount(user2.address)).to.equal(depositCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(lockAmount);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - lockAmount);

      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);
      await staking.connect(user2).unlock(depositCount, user1.address);

      expect(await staking.getDepositCount(user2.address)).to.equal(depositCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance);
    });

  });
});