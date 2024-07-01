import { ERC20, StakingTokens } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const name = 'Game7 Token';
const symbol = 'G7T';
const decimals = 18;
const initialSupply = ethers.parseEther("100.0");

describe("NontransferableStakingTokens contract", function () {
  let token: ERC20;
  let tokenAddress: string; 
  let staking: StakingTokens;
  let stakingAddress: string;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user1: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    token = await ethers.deployContract("ERC20", [name, symbol, decimals, initialSupply]);
    tokenAddress = await token.getAddress();
    const NTStakingFactory = await ethers.getContractFactory("NontransferableStakingTokens");
    staking = await NTStakingFactory.deploy();
    stakingAddress = await staking.getAddress();
    [deployer, user1, user2] = await ethers.getSigners();

    await token.connect(deployer).transfer(user1.address, ethers.parseEther("10.0"));
    await deployer.sendTransaction({to: user1.address, value: ethers.parseEther("10.0")});
  });

  describe("Staking ERC20", function () {
    const depositAmount = ethers.parseEther("1.0");
    const lockingPeriod = 3600; // 1 hour

    it("should allow deposit/withdraw with no locking period", async function () {
      await token.connect(user1).approve(stakingAddress, ethers.parseEther("10.0"));

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
      expect(lastDeposit.tokenAddress).to.equal(tokenAddress.toString());
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
      await token.connect(user1).approve(stakingAddress, ethers.parseEther("10.0"));

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
      expect(lastDeposit.tokenAddress).to.equal(tokenAddress.toString());
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
      await token.connect(user1).approve(stakingAddress, ethers.parseEther("10.0"));
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
      expect(lastDeposit.tokenAddress).to.equal(tokenAddress.toString());
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


  describe("Staking native token", function () {
    const depositAmount = ethers.parseEther("1.0");
    const lockingPeriod = 3600; // 1 hour

    it("should allow deposit/withdraw with no locking period", async function () {
      const initialNativeBalance = await ethers.provider.getBalance(user1.address);
      const depositTokenCount = await staking.balanceOf(user1.address);

      await expect(
        staking.connect(user1)["deposit(uint256)"](0, {value: depositAmount})
      ).to.emit(staking, "Deposited").withArgs(zeroAddress, user1.address, user1.address, 0, depositAmount);

      const depositTokenID = await staking.tokenOfOwnerByIndex(user1.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.tokenAddress).to.equal(zeroAddress);
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance - depositAmount, ethers.parseEther("0.1"));


      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(zeroAddress);
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp);

      await expect(
        staking.connect(user1)["withdraw(uint256)"](depositTokenID)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user1.address, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance, ethers.parseEther("0.1"));
    });

    it("should allow deposit/withdraw with locking period", async function () {
      const initialNativeBalance = await ethers.provider.getBalance(user1.address);
      const depositTokenCount = await staking.balanceOf(user1.address);

      await expect(
        staking.connect(user1)["deposit(uint256)"](lockingPeriod, {value: depositAmount})
      ).to.emit(staking, "Deposited").withArgs(zeroAddress, user1.address, user1.address, lockingPeriod, depositAmount);

      const depositTokenID = await staking.tokenOfOwnerByIndex(user1.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.tokenAddress).to.equal(zeroAddress);
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance - depositAmount, ethers.parseEther("0.1"));

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(zeroAddress);
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
      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance - depositAmount, ethers.parseEther("0.1"));

      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);

      await expect(
        staking.connect(user1)["withdraw(uint256)"](depositTokenID)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user1.address, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance, ethers.parseEther("0.1"));
    });

    it("should allow deposit/withdraw on behalf of another account", async function () {
      const initialNativeBalance = await ethers.provider.getBalance(user1.address);
      const depositTokenCount = await staking.balanceOf(user2.address);

      await expect(
        staking.connect(user1)["deposit(uint256,address)"](0, user2.address, {value: depositAmount})
      ).to.emit(staking, "Deposited").withArgs(zeroAddress, user2.address, user1.address, 0, depositAmount);

      const depositTokenID = await staking.tokenOfOwnerByIndex(user2.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(user2.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.tokenAddress).to.equal(zeroAddress);
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance - depositAmount, ethers.parseEther("0.1"));

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(zeroAddress);
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp);

      await expect(
        staking.connect(user2)["withdraw(uint256,address)"](depositTokenID, user1.address)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user2.address, user1.address);

      expect(await staking.balanceOf(user2.address)).to.equal(depositTokenCount);

      // Account for gas fees
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(initialNativeBalance, ethers.parseEther("0.1"));
    });
  });

  describe("Token nontransferability", function () {
    const depositAmount = ethers.parseEther("1.0");
    const lockingPeriod = 3600; // 1 hour

    it("should not allow transer of staking positions", async function () {
      await token.connect(user1).approve(stakingAddress, ethers.parseEther("10.0"));

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
      expect(lastDeposit.tokenAddress).to.equal(tokenAddress.toString());
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance - depositAmount);

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(tokenAddress.toString().toLowerCase());
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp);

      // Attempt to transfer
      await expect(
        staking.connect(user1).transferFrom(user1.address, user2.address, depositTokenID)
      ).to.be.reverted;
      await expect(
        staking.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, depositTokenID)
      ).to.be.reverted;
      await expect(
        staking.connect(user1)["safeTransferFrom(address,address,uint256,bytes)"](user1.address, user2.address, depositTokenID, "0x")
      ).to.be.reverted;
      await expect(
        staking.connect(user1).approve(user2.address, depositTokenID)
      ).to.be.reverted;
      await expect(
        staking.connect(user1).setApprovalForAll(user2.address, true)
      ).to.be.reverted;

      await expect(
        staking.connect(user1)["withdraw(uint256)"](depositTokenID)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, user1.address, user1.address);

      expect(await staking.balanceOf(user1.address)).to.equal(depositTokenCount);
      expect(await token.balanceOf(user1.address)).to.equal(initialERC20Balance); 
    });

  });

});