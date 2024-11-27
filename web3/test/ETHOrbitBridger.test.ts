import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ETHOrbitBridger, MockRouter, MockStandardGateway, WrappedNativeToken } from '../typechain-types';
import { HardhatEthersSigner } from '../helpers/type';
import { ERC20 } from '../typechain-types/contracts/token/ERC20';

describe('ETHOrbitBridger', function () {
    let ethOrbitBridger: ETHOrbitBridger;
    let weth: WrappedNativeToken;
    let customNativeToken: ERC20;
    let standardGateway: MockStandardGateway;
    let router: MockRouter;

    let deployer: HardhatEthersSigner;

    const amountToBridge = ethers.parseEther('1');
    const customNativeTokenSupply = ethers.parseEther('1000000');

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        const WETH = await ethers.getContractFactory('WrappedNativeToken');
        weth = await WETH.deploy('Wrapped Native Token', 'WETH');
        await weth.waitForDeployment();

        const CustomNativeToken = await ethers.getContractFactory('contracts/token/ERC20.sol:ERC20');
        customNativeToken = (await CustomNativeToken.deploy(
            'Custom Native Token',
            'CNT',
            18,
            customNativeTokenSupply
        )) as ERC20;
        await customNativeToken.waitForDeployment();

        const StandardGateway = await ethers.getContractFactory('MockStandardGateway');
        standardGateway = await StandardGateway.deploy();
        await standardGateway.waitForDeployment();

        const Router = await ethers.getContractFactory('MockRouter');
        router = await Router.deploy();
        await router.waitForDeployment();

        const ETHOrbitBridger = await ethers.getContractFactory('ETHOrbitBridger');
        ethOrbitBridger = await ETHOrbitBridger.deploy(
            standardGateway.target,
            router.target,
            weth.target,
            customNativeToken.target
        );
        await ethOrbitBridger.waitForDeployment();
    });

    it('should bridge ETH to Orbit', async function () {
        await customNativeToken.approve(ethOrbitBridger.target, ethers.parseEther('1'));
        expect(await router.getCalls()).to.have.lengthOf(0);
        expect(await standardGateway.getCalls()).to.have.lengthOf(0);
        await ethOrbitBridger.bridge(deployer.address, { value: amountToBridge });
        expect(await router.getCalls()).to.have.lengthOf(1);
        expect(await standardGateway.getCalls()).to.have.lengthOf(0);
    });
});
