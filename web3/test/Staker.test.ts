import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('Staker', function () {
    async function setupFixture() {
        const [anyone, admin0, admin1, user0, user1, user2] = await ethers.getSigners();

        const Staker = await ethers.getContractFactory('Staker');
        const staker = await Staker.deploy();

        const ERC20 = await ethers.getContractFactory('MockERC20');
        const erc20 = await ERC20.deploy();

        const ERC721 = await ethers.getContractFactory('MockERC721');
        const erc721 = await ERC721.deploy();

        const ERC1155 = await ethers.getContractFactory('MockERC1155');
        const erc1155 = await ERC1155.deploy();

        return { staker, erc20, erc721, erc1155, anyone, admin0, admin1, user0, user1, user2 };
    }

    it('should deploy', async function () {
        const { staker } = await loadFixture(setupFixture);

        const stakerAddress = await staker.getAddress();
        expect(stakerAddress).to.be.properAddress;
        expect(stakerAddress).to.not.equal(ethers.ZeroAddress);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);

        const nativeTokenType = await staker.NATIVE_TOKEN_TYPE();
        expect(nativeTokenType).to.equal(0);

        const erc20TokenType = await staker.ERC20_TOKEN_TYPE();
        expect(erc20TokenType).to.equal(20);

        const erc721TokenType = await staker.ERC721_TOKEN_TYPE();
        expect(erc721TokenType).to.equal(721);

        const erc1155TokenType = await staker.ERC1155_TOKEN_TYPE();
        expect(erc1155TokenType).to.equal(1155);
    });

    // TODO: Test pool ID gets incremented as pools are created

    it('should support creation and management of native token staking pools', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const nativeTokenType = await staker.NATIVE_TOKEN_TYPE();

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(nativeTokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        )
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, nativeTokenType, tokenAddress, tokenID)
            .and.to.emit(staker, 'StakingPoolConfigured')
            .withArgs(0, anyone.address, transferable, lockupSeconds, cooldownSeconds);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(1);

        const poolID = 0;

        // Structure of pools object:
        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(nativeTokenType);
        expect(pool.tokenAddress).to.equal(tokenAddress);
        expect(pool.tokenID).to.equal(tokenID);
        expect(pool.transferable).to.equal(transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
        expect(pool.administrator).to.equal(anyone.address);

        await expect(
            staker.updatePoolConfiguration(
                poolID,
                true,
                !transferable,
                true,
                lockupSeconds + 1,
                true,
                cooldownSeconds + 1
            )
        )
            .to.emit(staker, 'StakingPoolConfigured')
            .withArgs(poolID, anyone.address, !transferable, lockupSeconds + 1, cooldownSeconds + 1);
        pool = await staker.Pools(poolID);
        expect(pool.transferable).to.equal(!transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds + 1);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds + 1);
    });
});
