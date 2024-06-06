import { Game7Token, StakingTokens } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { toWei } from "../helpers/bignumber";

describe("StakingTokens contract", function () {
  let token: Game7Token;
  let staking: StakingTokens;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const totalSupply = toWei(1000);

  beforeEach(async function () {
    const TokenFactory = await ethers.getContractFactory("Game7Token");
    token = await TokenFactory.deploy(totalSupply);
    const StakingFactory = await ethers.getContractFactory("StakingTokens");
    staking = await StakingFactory.deploy();
    [deployer, user1, user2] = await ethers.getSigners();

    await token.transfer(user1.address, toWei(100));
  });

  describe("Deposit with no time lock", function () {
    const depositAmount = toWei(2);

    it("should allow deposit/withdraw", async function () {
      const initialERC20Balance = await token.balanceOf(user1.address);
      const depositTokenCount = await staking.balanceOf(user1.address);

      await staking.connect(user1).deposit(token.getAddress(), depositAmount, 0, user1.address);
      const depositTokenID = await staking.tokenOfOwnerByIndex(user1.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance - depositAmount);


      await staking.connect(user1).withdraw(depositTokenID, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance);
    });

  });

  describe("Deposit with time lock", function () {
    const depositAmount = toWei(2);
    const lockingPeriod = 3600; // 1 hour

    it("should allow deposit/withdraw", async function () {
      const initialERC20Balance = await token.balanceOf(user1.address);
      const depositTokenCount = await staking.balanceOf(user1.address);

      await staking.connect(user1).deposit(token.getAddress(), depositAmount, lockingPeriod, user1.address);
      const depositTokenID = await staking.tokenOfOwnerByIndex(user1.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance - depositAmount);

      await expect(
        staking.connect(user1).withdraw(depositTokenID, user1.address)
      ).to.be.reverted;

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance - depositAmount);

      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);
      await staking.connect(user1).withdraw(depositTokenID, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance);
    });

  });

  describe("Deposit on behalf of another", function () {
    const depositAmount = toWei(2);

    it("should allow deposit/withdraw", async function () {
      const initialERC20Balance = await token.balanceOf(user1.address);
      const depositTokenCount = await staking.balanceOf(user2.address);

      await staking.connect(user1).deposit(token.getAddress(), depositAmount, 0, user2.address);
      const depositTokenID = await staking.tokenOfOwnerByIndex(user2.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(user2.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance - depositAmount);

      await staking.connect(user2).withdraw(depositTokenID, user1.address);

      expect(await staking.balanceOf(user2.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance);
    });

  });

});