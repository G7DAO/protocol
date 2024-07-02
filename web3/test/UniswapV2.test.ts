import { expect } from "chai";
import { ethers } from "hardhat";

import { HardhatEthersSigner } from "../helpers/type";
import { ERC20 } from "../typechain-types";
import { UniswapV2Factory } from "../typechain-types";
import { UniswapV2Pair } from "../typechain-types";


const name = 'Game7 Token';
const symbol = 'G7T';
const decimals = 18;
const initialSupply = BigInt(10000);
const name1 = 'TestToken'
const symbol1 = 'TT'

describe("UniswapV2", function () {

  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  
  let token0: ERC20;
  let token0Address: string;
  let token1: ERC20;
  let token1Address: string;

  let factory: UniswapV2Factory;
  let factoryAddress: string;

  let v2Pair: UniswapV2Pair;
  let pairAddress: string;


  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    token0 = await ethers.deployContract("ERC20", [name, symbol, decimals, initialSupply]);
    token0Address = await token0.getAddress();
    await token0.waitForDeployment();

    token1 = await ethers.deployContract("ERC20", [name1, symbol1, decimals, initialSupply]);
    token1Address = await token1.getAddress();
    await token1.waitForDeployment();

    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await UniswapV2Factory.deploy(
        owner.address
    );
    factoryAddress = await factory.getAddress();
    await factory.waitForDeployment();
    //create V2 LP
    await factory.createPair(token0Address, token1Address);
  });

  it("Should return null pairing", async function(){
    expect(await factory.getPair("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")).to.equal("0x0000000000000000000000000000000000000000");
  });
  it("Should creat new ERC20 LP contract", async function(){
    expect((await factory.getPair(token0Address, token1Address))).to.not.equal("0x0000000000000000000000000000000000000000")
  });

});