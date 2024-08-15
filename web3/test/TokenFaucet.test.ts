import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenFaucet } from "../typechain-types";
import { HardhatEthersSigner } from "../helpers/type";
import { ERC20 } from "../typechain-types/token";
import { ONE_DAY } from "../constants/time";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const name = 'Game7 Token';
const symbol = 'G7T';
const decimals = 18;
const initialSupply = BigInt(10000);
const faucetAmount = 1000;
const timeInterval = ONE_DAY;

describe("TokenFaucet", function () {
  let tokenFaucet: TokenFaucet;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let token: ERC20;
  let tokenAddress: string;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    token = await ethers.deployContract("contracts/token/ERC20.sol:ERC20", [name, symbol, decimals, initialSupply]);
    tokenAddress = await token.getAddress();
    await token.waitForDeployment();

    const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
    tokenFaucet = await TokenFaucet.deploy(
      tokenAddress,
      owner.address,
      ethers.ZeroAddress,
      faucetAmount,
      timeInterval
    );
    await tokenFaucet.waitForDeployment();
  });

  it("Should deploy the TokenFaucet", async function () {
    expect(await tokenFaucet.tokenAddress()).to.equal(tokenAddress);
    expect(await tokenFaucet.owner()).to.equal(owner.address);
    expect(await tokenFaucet.faucetAmount()).to.equal(faucetAmount);
    expect(await tokenFaucet.faucetTimeInterval()).to.equal(timeInterval);
  });

  it("Should set and get faucet amount", async function () {
    await tokenFaucet.setFaucetAmount(faucetAmount * 2);
    expect(await tokenFaucet.faucetAmount()).to.equal(faucetAmount * 2);
  });

  it("Should NOT set faucet amount if not owner", async function () {
    await expect(tokenFaucet.connect(addr1).setFaucetAmount(faucetAmount * 2)).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
  });

  it("Should set and get faucet time interval", async function () {
    await tokenFaucet.setFaucetTimeInterval(timeInterval * 2);
    expect(await tokenFaucet.faucetTimeInterval()).to.equal(timeInterval * 2);
  });

  it("Should NOT set faucet time interval if not owner", async function () {
    await expect(tokenFaucet.connect(addr1).setFaucetTimeInterval(timeInterval * 2)).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
  });

  it('Should set and get token address', async function () {
    await tokenFaucet.setTokenAddress(tokenAddress);
    expect(await tokenFaucet.tokenAddress()).to.equal(tokenAddress);
  });

  it("Should NOT set token address if not owner", async function () {
    await expect(tokenFaucet.connect(addr1).setTokenAddress(tokenAddress)).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
  });

  it("Should allow claiming tokens on both chains", async function () {
    const tokenFaucetAddress = await tokenFaucet.getAddress();
    await token.transfer(tokenFaucetAddress, initialSupply);

    // L2
    const claimCallPromise = tokenFaucet.claim();
    await expect(claimCallPromise).to.emit(token, "Transfer").withArgs(tokenFaucetAddress, owner.address, faucetAmount);
    const tx = await claimCallPromise;
    const receipt = await tx.wait();
    const block = await receipt?.getBlock()
    const claimBlockTimestamp = block?.timestamp
    expect(await token.balanceOf(owner.address)).to.equal(faucetAmount);
    expect(await tokenFaucet.lastClaimedL2Timestamp(owner.address)).to.equal(claimBlockTimestamp);
  });

  it("Should NOT allow claiming tokens if time interval not passed", async function () {
    const tokenFaucetAddress = await tokenFaucet.getAddress();
    await token.transfer(tokenFaucetAddress, initialSupply);
    await tokenFaucet.claim();
    await expect(tokenFaucet.claim()).to.be.revertedWithCustomError(tokenFaucet, "TokenFaucetClaimIntervalNotPassed");
  });

  it("Should allow claiming tokens if time interval passed", async function () {
    const tokenFaucetAddress = await tokenFaucet.getAddress();
    await token.transfer(tokenFaucetAddress, initialSupply);
    await expect(tokenFaucet.claim()).to.emit(token, "Transfer").withArgs(tokenFaucetAddress, owner.address, faucetAmount);
    await time.increase(timeInterval);
    await expect(tokenFaucet.claim()).to.emit(token, "Transfer").withArgs(tokenFaucetAddress, owner.address, faucetAmount);
  })

  it("Should transfer ownership", async function () {
    await expect(tokenFaucet.transferOwnership(addr1.address)).to.emit(tokenFaucet, "OwnershipTransferred").withArgs(owner.address, addr1.address);
    expect(await tokenFaucet.owner()).to.equal(addr1.address);
  });
});
