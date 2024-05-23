import { Game7Token } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { toWei } from "../helpers/bignumber";

describe("Token contract", function () {
  let token: Game7Token;
  let deployer: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let user: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const totalSupply = toWei(1000);

  beforeEach(async function () {
    const TokenFactory = await ethers.getContractFactory("Game7Token");
    token = await TokenFactory.deploy(totalSupply);
    [deployer, user] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });

    it("Should set the total supply", async function () {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });
  });

  describe("Transfers", function () {
    const amount = toWei(100);

    it("Should transfer tokens between accounts", async function () {
      await token.transfer(user.address, amount);
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply-amount);
      expect(await token.balanceOf(user.address)).to.equal(amount);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(deployer.address);

      await expect(
        token.transfer(user.address, initialOwnerBalance + BigInt(1))
      ).to.be.revertedWithoutReason();

      expect(await token.balanceOf(deployer.address)).to.equal(initialOwnerBalance);
    });

    it("Should update allowance", async function () {
      await token.approve(user.address, amount);
      expect(await token.allowance(deployer.address, user.address)).to.equal(amount);
    });

    it("Should transfer tokens from one account to another with allowance", async function () {
      await token.approve(user.address, amount);
      await token.connect(user).transferFrom(deployer.address, user.address, amount);

      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply-amount);
      expect(await token.balanceOf(user.address)).to.equal(amount);
      expect(await token.allowance(deployer.address, user.address)).to.equal(0);
    });

    it("Should fail if sender doesn’t have enough allowance", async function () {
      await token.approve(user.address, amount);

      await expect(
        token.connect(user).transferFrom(deployer.address, user.address, amount + BigInt(1))
      ).to.be.reverted;
    });
  });
});