import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "../helpers/type";
import { ERC20, UniswapV2Pair__factory } from "../typechain-types";
import { UniswapV2Factory } from "../typechain-types";
import { UniswapV2Pair } from "../typechain-types";

const initialSupply = BigInt(100000000000);


describe("UniswapV2", function () {

  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  
  let token0: ERC20;
  let token0Address: string;
  let token1: ERC20;
  let token1Address: string;
  let factory: any;
  let v2Pair: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    token0 = await ethers.deployContract("ERC20", ['Token0', 'TKN0', 18, initialSupply]);
    token0Address = await token0.getAddress();
    token1 = await ethers.deployContract("ERC20", ['Token1', 'TKN1', 18, initialSupply]);
    token1Address = await token1.getAddress();
    await token1.waitForDeployment();

    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await UniswapV2Factory.deploy(
        owner.address
    );

    await factory.waitForDeployment();
    //create V2 LP

    await factory.createPair(token0Address, token1Address);
    const pairAddress = await factory.getPair(token0Address, token1Address);
    v2Pair = await ethers.getContractAt('UniswapV2Pair',pairAddress) as UniswapV2Pair;

  });

  it("Should return null pairing", async function(){
    expect(await factory.getPair("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")).to.equal("0x0000000000000000000000000000000000000000");
  });
  it("Should return non-null address", async function(){
    expect((await factory.getPair(token0.getAddress(), token1.getAddress()))).to.not.equal("0x0000000000000000000000000000000000000000")
  });
  it("Should transfer tokens to v2Pair", async function(){
    const pairAddress = await factory.getPair(token0.getAddress(), token1.getAddress());
    await token0.transfer(pairAddress, BigInt(10));
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(10));
    await token1.transfer(pairAddress, BigInt(10));
    expect(await token1.balanceOf(pairAddress)).to.equal(BigInt(10));
    
  });
  
  it("Should Mint LP tokens to owner", async function(){
    const pairAddress = await factory.getPair(token0Address, token1Address);
    await token0.transfer(pairAddress, BigInt(100000));
    await token1.transfer(pairAddress, BigInt(100000));
    await expect(v2Pair.mint(owner.address)).to.emit(v2Pair, "Mint").withArgs(owner.address, BigInt(100000),BigInt(100000));
  });

  it("Should transfer and sync tokens", async function () {
    const pairAddress = await factory.getPair(token0Address, token1Address);
    await token0.transfer(pairAddress, BigInt(100000));
    await token1.transfer(pairAddress, BigInt(100000));
    await v2Pair.mint(token0Address);
    await token0.transfer(pairAddress, BigInt(100000));
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(200000));
    //Removes unsync tokens from LP pair.
    await v2Pair.skim(token0Address);
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(100000));
    await v2Pair.sync();
  });



});