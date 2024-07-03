import { expect } from "chai";
import { ethers } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "../helpers/type";
import { ERC20 } from "../typechain-types";
import { UniswapV2Factory } from "../typechain-types";
import { UniswapV2Pair } from "../typechain-types";
import { UniswapV2Router02 } from "../typechain-types";


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
  let factoryAddress: string
  let v2Pair: any;

  let router02: any;
  let router02Address: string;
  let IWETHAddress: string;

  before(async function () {
    await mine(1000);

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
    factoryAddress = await factory.getAddress();
    IWETHAddress = await factory.getAddress(); //filler for now
    await factory.waitForDeployment();

    //create V2 LP
    await factory.createPair(token0Address, token1Address);
    const pairAddress = await factory.getPair(token0Address, token1Address);
    v2Pair = await ethers.getContractAt('UniswapV2Pair',pairAddress) as UniswapV2Pair;

    
    router02 = await ethers.deployContract("UniswapV2Router02", [factoryAddress, IWETHAddress]);
    router02Address = await router02.getAddress();
    await router02.waitForDeployment();


  });
  it("Should have same Facotry in router as deployed", async function(){

    expect(await router02.factory()).to.equal(factoryAddress);

  })

  it("Should return null pairing", async function(){
    expect(await factory.getPair("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")).to.equal("0x0000000000000000000000000000000000000000");
  });
  it("Should return non-null address", async function(){
    expect((await factory.getPair(token0Address, token1Address))).to.not.equal("0x0000000000000000000000000000000000000000")
  });
  it("Should transfer tokens to v2Pair", async function(){
    const pairAddress = await factory.getPair(token0Address, token1Address);
    await token0.transfer(pairAddress, BigInt(100000));
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(100000));
    await token1.transfer(pairAddress, BigInt(100000));
    expect(await token1.balanceOf(pairAddress)).to.equal(BigInt(100000));
    
  });
  
  it("Should Mint LP tokens to owner", async function(){
    await expect(v2Pair.mint(owner.address)).to.emit(v2Pair, "Mint").withArgs(owner.address, BigInt(100000),BigInt(100000));
  });

  it("Should transfer and sync tokens", async function () {
    const pairAddress = await factory.getPair(token0Address, token1Address);
    await token0.transfer(pairAddress, BigInt(100000));
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(200000));
    //Removes, skims any token0 and token1 not in reserves.
    await v2Pair.skim(token0Address);
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(100000));
    await token0.transfer(pairAddress, BigInt(100000));
    //sync takes any token0 and token1 not in reserves and puts them in reserves
    await v2Pair.sync();
    await v2Pair.skim(token0Address);
    expect(await token0.balanceOf(pairAddress)).to.equal(BigInt(200000));
  });


  it("Should mint LP", async function(){
    await token0.approve(router02Address,BigInt(100000));
    await token1.approve(router02Address,BigInt(100000));

    
    const blocktime = await time.latest();

    /*
    * Issue 
    * (uint reserve0, uint reserve1,) = IUniswapV2Pair(pairFor(factory, tokenA, tokenB)).getReserves();
    * error is assumed to have do calling a contract for a contract within the test parameters. 
    */
    expect(await router02.addLiquidity(
      token0Address, token1Address,
      BigInt(100000), BigInt(100000),
      0, 0,
      owner.address, 
      blocktime+10
    )).to.emit(v2Pair, "Mint").withArgs(owner.address, BigInt(100000),BigInt(51000));

  });


});