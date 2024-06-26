import { expect } from "chai";
import { ethers } from "hardhat";
import { Ownable__factory, TokenFaucet } from "../typechain-types";
import { HardhatEthersSigner } from "../helpers/type";
import { ERC20 } from "../typechain-types/token";

const name = 'Game7 Token';
const symbol = 'G7T';
const decimals = 18;
const initialSupply = BigInt(10000);
const faucetAmount = 1000;
const blockInterval = 10;

describe("TokenFaucet", function () {
  let tokenFaucet: TokenFaucet;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let token: ERC20;
  let tokenAddress: string;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    token = await ethers.deployContract("ERC20", [name, symbol, decimals, initialSupply]);
    tokenAddress = await token.getAddress();
    await token.waitForDeployment();

    const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
    tokenFaucet = await TokenFaucet.deploy(
      tokenAddress,
      owner.address,
      faucetAmount,
      blockInterval
    );
    await tokenFaucet.waitForDeployment();
  });

  it("Should deploy the TokenFaucet", async function () {
    expect(await tokenFaucet.tokenAddress()).to.equal(tokenAddress);
  });

  it("Should set and get faucet amount", async function () {
    await tokenFaucet.setFaucetAmount(faucetAmount * 2);
    expect(await tokenFaucet.faucetAmount()).to.equal(faucetAmount * 2);
  });

  it("Should NOT set faucet amount if not owner", async function () {
    await expect(tokenFaucet.connect(addr1).setFaucetAmount(faucetAmount * 2)).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
  });

  it("Should set and get faucet block interval", async function () {
    await tokenFaucet.setFaucetBlockInterval(blockInterval * 2);
    expect(await tokenFaucet.faucetBlockInterval()).to.equal(blockInterval * 2);
  });

  it("Should NOT set faucet block interval if not owner", async function () {
    await expect(tokenFaucet.connect(addr1).setFaucetBlockInterval(blockInterval * 2)).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
  });

  it('Should set and get token address', async function () {
    await tokenFaucet.setTokenAddress(tokenAddress);
    expect(await tokenFaucet.tokenAddress()).to.equal(tokenAddress);
  });

  it("Should NOT set token address if not owner", async function () {
    await expect(tokenFaucet.connect(addr1).setTokenAddress(tokenAddress)).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
  });

  it("Should allow claiming tokens", async function () {
    const tokenFaucetAddress = await tokenFaucet.getAddress();
    await token.transfer(tokenFaucetAddress, initialSupply);
    const claimCallPromise = tokenFaucet.claim();
    await expect(claimCallPromise).to.emit(token, "Transfer").withArgs(tokenFaucetAddress, owner.address, faucetAmount);
    const tx = await claimCallPromise;
    const receipt = await tx.wait();
    const claimBlockNumber = receipt?.blockNumber;
    expect(await token.balanceOf(owner.address)).to.equal(faucetAmount);
    expect(await tokenFaucet.lastClaimedBlock(owner.address)).to.equal(claimBlockNumber);
  });

  it("Should NOT allow claiming tokens if block interval not passed", async function () {
    const tokenFaucetAddress = await tokenFaucet.getAddress();
    await token.transfer(tokenFaucetAddress, initialSupply);
    await tokenFaucet.claim();
    await expect(tokenFaucet.claim()).to.be.revertedWithCustomError(tokenFaucet, "TokenFaucetClaimIntervalNotPassed");
  });

  it("Should transfer ownership", async function () {
    await expect(tokenFaucet.transferOwnership(addr1.address)).to.emit(tokenFaucet, "OwnershipTransferred").withArgs(owner.address, addr1.address);
    expect(await tokenFaucet.owner()).to.equal(addr1.address);
  });
});
