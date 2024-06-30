import { Game7Token, StakingTokens } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { latest } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time";
import { HardhatEthersSigner } from "../helpers/type";

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("StakingTokens contract", function () {
  let token: Game7Token;
  let tokenAddress: string; 
  let staking: StakingTokens;
  let stakingAddress: string;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const totalSupply = ethers.parseEther("100000");

  beforeEach(async function () {
    const TokenFactory = await ethers.getContractFactory("Game7Token");
    token = await TokenFactory.deploy(totalSupply);
    tokenAddress = await token.getAddress();
    const StakingFactory = await ethers.getContractFactory("StakingTokens");
    staking = await StakingFactory.deploy();
    stakingAddress = await staking.getAddress();
    [deployer] = await ethers.getSigners();
  });

  describe("Staking native token", function () {
    const initialERC20Balance = ethers.parseEther("1.2");
    const depositAmount = ethers.parseEther("1.0");
    const lockingPeriod = 3600; // 1 hour

    const stakeTokens = async function(signer: HardhatEthersSigner):Promise<bigint> {
      await token.connect(signer).approve(stakingAddress, depositAmount);

      const depositTokenCount = await staking.balanceOf(signer.address);
      await expect(
        staking.connect(signer)["deposit(address,uint256,uint256)"](tokenAddress, depositAmount, lockingPeriod)
      ).to.emit(staking, "Deposited").withArgs(tokenAddress, signer.address, signer.address, lockingPeriod, depositAmount);

      const depositTokenID = await staking.tokenOfOwnerByIndex(signer.address, depositTokenCount)
      const lastDeposit = await staking.getDeposit(depositTokenID);

      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp || 0;

      expect(await staking.balanceOf(signer.address)).to.equal(depositTokenCount + BigInt(1));
      expect(lastDeposit.tokenAddress).to.equal(tokenAddress);
      expect(lastDeposit.amount).to.equal(depositAmount);
      expect(lastDeposit.start).to.equal(timestamp);
      expect(lastDeposit.end).to.equal(timestamp + lockingPeriod);
      expect(await token.balanceOf(signer.address)).to.equal(initialERC20Balance - depositAmount);

      const metadata = JSON.parse(await staking.metadataJSON(depositTokenID));

      expect(metadata.attributes[0].value).to.equal(tokenAddress.toLowerCase());
      expect(metadata.attributes[1].value).to.equal(depositAmount);
      expect(metadata.attributes[2].value).to.equal(timestamp);
      expect(metadata.attributes[3].value).to.equal(timestamp + lockingPeriod);

      return depositTokenID;
    };

    const unstakeTokens = async function(signer: HardhatEthersSigner, depositTokenID: bigint) {
      const depositTokenCount = await staking.balanceOf(signer.address);
      const deposit = await staking.getDeposit(depositTokenID);
      const depositAmount = deposit.amount;

      await expect(
        staking.connect(signer)["withdraw(uint256)"](depositTokenID)
      ).to.emit(staking, "Withdrawn").withArgs(depositTokenID, signer.address, signer.address);

      expect(await staking.balanceOf(signer.address)).to.equal(depositTokenCount - BigInt(1));
      expect(await token.balanceOf(signer.address)).to.equal(initialERC20Balance);
    }

    it("should allow deposit/withdraw with locking period", async function () {
      const depositTokenIDs: { user: string, tokenID: bigint }[] = []; // Array to store depositTokenIDs and corresponding users

      // Loop to stake tokens for random users
      for (let i = 0; i < 1000; i++) {
        // Create a random user
        const wallet = ethers.Wallet.createRandom();
        const user = wallet.address;

        await deployer.sendTransaction({to: user, value: ethers.parseEther("0.25")});
        await token.connect(deployer).transfer(user, initialERC20Balance);

        // Impersonate user
        await ethers.provider.send("hardhat_impersonateAccount", [user]);
        const signer = await ethers.getSigner(user);

        // Stake tokens as the impersonated user
        const depositTokenID = await stakeTokens(signer);
        depositTokenIDs.push({ user, tokenID: depositTokenID });

        // Stop impersonating the account
        await ethers.provider.send("hardhat_stopImpersonatingAccount", [user]);
      }

      // for (const { user, tokenID } of depositTokenIDs) {
      //   const deposit = await staking.getDeposit(tokenID);
      //   console.log(user);
      //   console.log(deposit);
      //   console.log(await staking.ownerOf(tokenID));
      // }

      // Increase EVM time to simulate locking period
      await ethers.provider.send("evm_increaseTime", [lockingPeriod + 1]);

      // Loop through the stored depositTokenIDs to unstake tokens
      for (const { user, tokenID } of depositTokenIDs) {
        // Impersonate user
        await ethers.provider.send("hardhat_impersonateAccount", [user]);
        const signer = await ethers.getSigner(user);

        // Unstake tokens as the impersonated user
        await unstakeTokens(signer, tokenID);

        // Stop impersonating the account
        await ethers.provider.send("hardhat_stopImpersonatingAccount", [user]);
      }

    });

  });

});