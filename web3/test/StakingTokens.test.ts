import { Game7Token, StakingTokens } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { toWei } from "../helpers/bignumber";

describe("StakingTokens contract", function () {
  let token: Game7Token;
  let tokenAddress: string; 
  let staking: StakingTokens;
  let stakingAddress: string;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const totalSupply = toWei(1000);

  beforeEach(async function () {
    const TokenFactory = await ethers.getContractFactory("Game7Token");
    token = await TokenFactory.deploy(totalSupply);
    tokenAddress = await token.getAddress();
    const StakingFactory = await ethers.getContractFactory("StakingTokens");
    staking = await StakingFactory.deploy();
    stakingAddress = await staking.getAddress();
    [deployer, user1, user2] = await ethers.getSigners();

    await token.transfer(user1.address, toWei(100));
  });

  describe("Staking tokens", function () {
    const depositAmount = toWei(2);
    const lockingPeriod = 3600; // 1 hour

    it("should allow deposit/withdraw with no locking period", async function () {
      await token.connect(user1).approve(stakingAddress, toWei(100));

      const initialERC20Balance = await token.balanceOf(user1.address);
      const depositTokenCount = await staking.balanceOf(user1.address);

      await expect(
        staking.connect(user1)["deposit(address,uint256,uint256)"](tokenAddress, depositAmount, 0)
      ).to.emit(staking, "Deposited").withArgs(tokenAddress, user1.address, user1.address, 0, depositAmount);

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

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(tokenAddress.toString().toLowerCase());
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp);

      await expect(
        staking.connect(user1)["withdraw(uint256)"](depositTokenID)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user1.address, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance);
    });

    it("should allow deposit/withdraw with locking period", async function () {
      await token.connect(user1).approve(stakingAddress, toWei(100));

      const initialERC20Balance = await token.balanceOf(user1.address);
      const depositTokenCount = await staking.balanceOf(user1.address);

      await expect(
        staking.connect(user1)["deposit(address,uint256,uint256)"](tokenAddress, depositAmount, lockingPeriod)
      ).to.emit(staking, "Deposited").withArgs(tokenAddress, user1.address, user1.address, lockingPeriod, depositAmount);

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

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(tokenAddress.toString().toLowerCase());
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp + lockingPeriod);

      await expect(
        staking.connect(user1)["withdraw(uint256)"](depositTokenID)
      ).to.be.reverted;

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance - depositAmount);

      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);

      await expect(
        staking.connect(user1)["withdraw(uint256)"](depositTokenID)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user1.address, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance);
    });

    it("should allow deposit/withdraw on behalf of another account", async function () {
      await token.connect(user1).approve(stakingAddress, toWei(100));
      const initialERC20Balance = await token.balanceOf(user1.address);
      const depositTokenCount = await staking.balanceOf(user2.address);

      await expect(
        staking.connect(user1)["deposit(address,uint256,uint256,address)"](tokenAddress, depositAmount, 0, user2.address)
      ).to.emit(staking, "Deposited").withArgs(tokenAddress, user2.address, user1.address, 0, depositAmount);

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

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(tokenAddress.toString().toLowerCase());
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp);

      await expect(
        staking.connect(user2)["withdraw(uint256,address)"](depositTokenID, user1.address)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user2.address, user1.address);

      expect(await staking.balanceOf(user2.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance);
    });
  });

});