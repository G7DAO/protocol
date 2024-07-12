import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { MockERC20 as MockERC20T } from '../typechain-types/contracts/mock/tokens.sol/MockERC20';
import { MockERC721 as MockERC721T } from '../typechain-types/contracts/mock/tokens.sol/MockERC721';
import { MockERC1155 as MockERC1155T } from '../typechain-types/contracts/mock/tokens.sol/MockERC1155';
import { Staker as StakerT } from '../typechain-types/contracts/staking/Staker';
import { HardhatEthersSigner } from '../helpers/type';
import { TransactionResponse } from 'ethers';

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

    async function setupERC1155StakingPoolFixture() {
        const { admin0, anyone, erc1155, staker, user0 } = await loadFixture(setupFixture);

        const stakerWithAdmin0 = staker.connect(admin0);

        const erc1155TokenType = await staker.ERC1155_TOKEN_TYPE();

        const tokenAddress = await erc1155.getAddress();
        const tokenID = 1;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await stakerWithAdmin0.createPool(
            erc1155TokenType,
            tokenAddress,
            tokenID,
            transferable,
            lockupSeconds,
            cooldownSeconds
        );
        const poolID = 0;
        expect(await stakerWithAdmin0.TotalPools()).to.equal(poolID + 1);
        const pool = await stakerWithAdmin0.Pools(poolID);
        expect(pool.administrator).to.equal(admin0.address);

        await erc1155.connect(admin0);

        await erc1155.mint(admin0.address, tokenID, 1000);
        await erc1155.mint(user0.address, tokenID, 10);

        return {
            admin0,
            anyone,
            erc1155,
            staker,
            stakerWithAdmin0,
            user0,
            poolID,
            transferable,
            lockupSeconds,
            cooldownSeconds,
        };
    }

    it('should deploy', async function () {
        const { staker } = await loadFixture(setupFixture);

        const stakerAddress = await staker.getAddress();
        expect(stakerAddress).to.be.properAddress;
        expect(stakerAddress).to.not.equal(ethers.ZeroAddress);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);

        const nativeTokenType = await staker.NATIVE_TOKEN_TYPE();
        expect(nativeTokenType).to.equal(1);

        const erc20TokenType = await staker.ERC20_TOKEN_TYPE();
        expect(erc20TokenType).to.equal(20);

        const erc721TokenType = await staker.ERC721_TOKEN_TYPE();
        expect(erc721TokenType).to.equal(721);

        const erc1155TokenType = await staker.ERC1155_TOKEN_TYPE();
        expect(erc1155TokenType).to.equal(1155);
    });

    it('should incrementally increase the pool ID for every subsequent pool created', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const nativeTokenType = await staker.NATIVE_TOKEN_TYPE();

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 0;
        const transferable = true;
        // We'll use this to test appropriate creation - this will go up by 1 on each pool.
        let lockupSeconds = 0;
        const cooldownSeconds = 0;

        let poolID = lockupSeconds;

        await expect(
            staker.createPool(nativeTokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        )
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(poolID, nativeTokenType, tokenAddress, tokenID)
            .and.to.emit(staker, 'StakingPoolConfigured')
            .withArgs(poolID, anyone.address, transferable, lockupSeconds, cooldownSeconds);

        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(nativeTokenType);
        expect(pool.tokenAddress).to.equal(tokenAddress);
        expect(pool.tokenID).to.equal(tokenID);
        expect(pool.transferable).to.equal(transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
        expect(pool.administrator).to.equal(anyone.address);

        let numPools: bigint;

        while (lockupSeconds < 100) {
            lockupSeconds++;
            poolID = lockupSeconds;

            numPools = await staker.TotalPools();
            expect(numPools).to.equal(poolID);

            await expect(
                staker.createPool(nativeTokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
            )
                .to.emit(staker, 'StakingPoolCreated')
                .withArgs(poolID, nativeTokenType, tokenAddress, tokenID)
                .and.to.emit(staker, 'StakingPoolConfigured')
                .withArgs(poolID, anyone.address, transferable, lockupSeconds, cooldownSeconds);

            pool = await staker.Pools(poolID);
            expect(pool.tokenType).to.equal(nativeTokenType);
            expect(pool.tokenAddress).to.equal(tokenAddress);
            expect(pool.tokenID).to.equal(tokenID);
            expect(pool.transferable).to.equal(transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
            expect(pool.administrator).to.equal(anyone.address);
        }

        numPools = await staker.TotalPools();
        expect(numPools).to.equal(101);
    });

    it('should not support the creation and management of tokens with an unknown type', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const unknownType =
            (await staker.NATIVE_TOKEN_TYPE()) +
            (await staker.ERC20_TOKEN_TYPE()) +
            (await staker.ERC721_TOKEN_TYPE()) +
            (await staker.ERC1155_TOKEN_TYPE());

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(unknownType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.revertedWithCustomError(staker, 'InvalidTokenType');

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);
    });

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

    it('should not allow the creation of native token staking pools with non-zero token address', async function () {
        const { anyone, erc20, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const nativeTokenType = await staker.NATIVE_TOKEN_TYPE();

        const tokenAddress = await erc20.getAddress();
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(nativeTokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);
    });

    it('should not allow the creation of native token staking pools with non-zero token ID', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const nativeTokenType = await staker.NATIVE_TOKEN_TYPE();

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 42;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(nativeTokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);
    });

    it('should support creation and management of ERC20 token staking pools', async function () {
        const { anyone, erc20, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc20TokenType = await staker.ERC20_TOKEN_TYPE();

        const tokenAddress = await erc20.getAddress();
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc20TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        )
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, erc20TokenType, tokenAddress, tokenID)
            .and.to.emit(staker, 'StakingPoolConfigured')
            .withArgs(0, anyone.address, transferable, lockupSeconds, cooldownSeconds);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(1);

        const poolID = 0;

        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(erc20TokenType);
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

    it('should not support creation of ERC20 token staking pools with zero token address', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc20TokenType = await staker.ERC20_TOKEN_TYPE();

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc20TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);
    });

    it('should not support creation of ERC20 token staking pools with non-zero token ID', async function () {
        const { anyone, erc20, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc20TokenType = await staker.ERC20_TOKEN_TYPE();

        const tokenAddress = await erc20.getAddress();
        const tokenID = 42;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc20TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(0);
    });

    it('should support creation and management of ERC721 token staking pools', async function () {
        const { anyone, erc721, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc721TokenType = await staker.ERC721_TOKEN_TYPE();

        const tokenAddress = await erc721.getAddress();
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc721TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        )
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, erc721TokenType, tokenAddress, tokenID)
            .and.to.emit(staker, 'StakingPoolConfigured')
            .withArgs(0, anyone.address, transferable, lockupSeconds, cooldownSeconds);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(1);

        const poolID = 0;

        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(erc721TokenType);
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

    it('should not support creation of ERC721 token staking pools with zero token address', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc721TokenType = await staker.ERC721_TOKEN_TYPE();

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc721TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    it('should not support creation of ERC721 token staking pools with non-zero token ID', async function () {
        const { anyone, erc721, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc721TokenType = await staker.ERC721_TOKEN_TYPE();

        const tokenAddress = await erc721.getAddress();
        const tokenID = 42;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc721TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    it('should support creation and management of ERC1155 token staking pools', async function () {
        const { anyone, erc1155, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc1155TokenType = await staker.ERC1155_TOKEN_TYPE();

        const tokenAddress = await erc1155.getAddress();
        const tokenID = 1;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc1155TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        )
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, erc1155TokenType, tokenAddress, tokenID)
            .and.to.emit(staker, 'StakingPoolConfigured')
            .withArgs(0, anyone.address, transferable, lockupSeconds, cooldownSeconds);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(1);

        const poolID = 0;

        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(erc1155TokenType);
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

    it('should not support creation of ERC1155 token staking pools with zero token address', async function () {
        const { anyone, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc1155TokenType = await staker.ERC1155_TOKEN_TYPE();

        const tokenAddress = ethers.ZeroAddress;
        const tokenID = 1;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc1155TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        ).to.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    it('should support creation and management of ERC1155 token staking pools with zero token ID', async function () {
        const { anyone, erc1155, staker } = await loadFixture(setupFixture);

        await staker.connect(anyone);

        const erc1155TokenType = await staker.ERC1155_TOKEN_TYPE();

        const tokenAddress = await erc1155.getAddress();
        const tokenID = 0;
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        await expect(
            staker.createPool(erc1155TokenType, tokenAddress, tokenID, transferable, lockupSeconds, cooldownSeconds)
        )
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, erc1155TokenType, tokenAddress, tokenID)
            .and.to.emit(staker, 'StakingPoolConfigured')
            .withArgs(0, anyone.address, transferable, lockupSeconds, cooldownSeconds);

        const TotalPools = await staker.TotalPools();
        expect(TotalPools).to.equal(1);

        const poolID = 0;

        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(erc1155TokenType);
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

    describe("should allow a pool's administrator to modify any subset of its configurable parameters in a single transaction", function () {
        it('changeTransferability = true, changeLockup = true, changeCooldown = true', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    true,
                    !transferable,
                    true,
                    lockupSeconds + 1,
                    true,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, !transferable, lockupSeconds + 1, cooldownSeconds + 1);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(!transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds + 1);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds + 1);
        });
        it('changeTransferability = true, changeLockup = true, changeCooldown = false', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    true,
                    !transferable,
                    true,
                    lockupSeconds + 1,
                    false,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, !transferable, lockupSeconds + 1, cooldownSeconds);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(!transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds + 1);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
        });
        it('changeTransferability = true, changeLockup = false, changeCooldown = true', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    true,
                    !transferable,
                    false,
                    lockupSeconds + 1,
                    true,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, !transferable, lockupSeconds, cooldownSeconds + 1);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(!transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds + 1);
        });
        it('changeTransferability = true, changeLockup = false, changeCooldown = false', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    true,
                    !transferable,
                    false,
                    lockupSeconds + 1,
                    false,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, !transferable, lockupSeconds, cooldownSeconds);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(!transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
        });
        it('changeTransferability = false, changeLockup = true, changeCooldown = true', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    false,
                    !transferable,
                    true,
                    lockupSeconds + 1,
                    true,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, transferable, lockupSeconds + 1, cooldownSeconds + 1);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds + 1);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds + 1);
        });
        it('changeTransferability = false, changeLockup = true, changeCooldown = false', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    false,
                    !transferable,
                    true,
                    lockupSeconds + 1,
                    false,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, transferable, lockupSeconds + 1, cooldownSeconds);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds + 1);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
        });
        it('changeTransferability = false, changeLockup = false, changeCooldown = true', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    false,
                    transferable,
                    false,
                    lockupSeconds + 1,
                    true,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, transferable, lockupSeconds, cooldownSeconds + 1);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds + 1);
        });
        it('changeTransferability = false, changeLockup = false, changeCooldown = false', async function () {
            const { admin0, stakerWithAdmin0, poolID, transferable, lockupSeconds, cooldownSeconds } =
                await loadFixture(setupERC1155StakingPoolFixture);

            await expect(
                stakerWithAdmin0.updatePoolConfiguration(
                    poolID,
                    false,
                    transferable,
                    false,
                    lockupSeconds + 1,
                    false,
                    cooldownSeconds + 1
                )
            )
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(poolID, admin0.address, transferable, lockupSeconds, cooldownSeconds);

            const pool = await stakerWithAdmin0.Pools(poolID);
            expect(pool.transferable).to.equal(transferable);
            expect(pool.lockupSeconds).to.equal(lockupSeconds);
            expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
        });
    });

    it("should not allow anyone who is not a pool's administrator make any changes to the its configuration", async function () {
        const { admin0, stakerWithAdmin0, user0, poolID, transferable, lockupSeconds, cooldownSeconds } =
            await loadFixture(setupERC1155StakingPoolFixture);

        let pool = await stakerWithAdmin0.Pools(poolID);
        expect(pool.administrator).to.equal(admin0.address);
        expect(user0.address).to.not.equal(admin0.address);
        expect(pool.transferable).to.equal(transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds);

        const stakerWithUser0 = stakerWithAdmin0.connect(user0);
        await expect(
            stakerWithUser0.updatePoolConfiguration(
                poolID,
                true,
                !transferable,
                true,
                lockupSeconds + 1,
                true,
                cooldownSeconds + 1
            )
        ).to.be.revertedWithCustomError(stakerWithUser0, 'NonAdministrator');

        pool = await stakerWithUser0.Pools(poolID);
        expect(pool.transferable).to.equal(transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds);
    });

    it('should allow the administrator of a staking pool transfer its administration to another address', async function () {
        const { admin0, stakerWithAdmin0, user0, poolID } = await loadFixture(setupERC1155StakingPoolFixture);

        let pool = await stakerWithAdmin0.Pools(poolID);
        expect(pool.administrator).to.equal(admin0.address);
        expect(user0.address).to.not.equal(admin0.address);

        await expect(stakerWithAdmin0.transferPoolAdministration(poolID, user0.address))
            .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
            .withArgs(poolID, user0.address, pool.transferable, pool.lockupSeconds, pool.cooldownSeconds);

        pool = await stakerWithAdmin0.Pools(poolID);
        expect(pool.administrator).to.equal(user0.address);
    });

    it('should not allow a non-administrator for a pool to transfer its administration to another address', async function () {
        const { admin0, stakerWithAdmin0, user0, poolID } = await loadFixture(setupERC1155StakingPoolFixture);

        let pool = await stakerWithAdmin0.Pools(poolID);
        expect(pool.administrator).to.equal(admin0.address);
        expect(user0.address).to.not.equal(admin0.address);

        const stakerWithUser0 = stakerWithAdmin0.connect(user0);
        await expect(stakerWithUser0.transferPoolAdministration(poolID, user0.address)).to.be.revertedWithCustomError(
            stakerWithUser0,
            'NonAdministrator'
        );

        pool = await stakerWithUser0.Pools(poolID);
        expect(pool.administrator).to.equal(admin0.address);
    });

    describe('staking and unstaking', function () {
        describe('Native token', function () {
            async function setup() {
                const { admin0, erc20, erc721, erc1155, staker, user0 } = await loadFixture(setupFixture);
                const stakerWithAdmin0 = staker.connect(admin0);

                const nativeTokenType = await stakerWithAdmin0.NATIVE_TOKEN_TYPE();
                const tokenAddress = ethers.ZeroAddress;
                const tokenID = 0;
                const lockupSeconds = 3600;
                const cooldownSeconds = 300;

                await stakerWithAdmin0.createPool(
                    nativeTokenType,
                    tokenAddress,
                    tokenID,
                    true,
                    lockupSeconds,
                    cooldownSeconds
                );

                const poolID = (await stakerWithAdmin0.TotalPools()) - BigInt(1);
                return { admin0, erc20, erc721, erc1155, staker, user0, lockupSeconds, cooldownSeconds, poolID };
            }

            async function stake(
                user: HardhatEthersSigner,
                stakerContract: StakerT,
                poolID: bigint,
                amountOrTokenID: bigint
            ): Promise<TransactionResponse> {
                const stakerWithUser = stakerContract.connect(user);
                return await stakerWithUser.stakeNative(poolID, { value: amountOrTokenID });
            }

            async function balance(account: string): Promise<bigint> {
                return ethers.provider.getBalance(account);
            }

            const amountOrTokenID = BigInt(1);

            it('can stake non-zero value', async function () {
                const { admin0, erc20, erc721, erc1155, staker, user0, lockupSeconds, cooldownSeconds, poolID } =
                    await loadFixture(setup);

                const expectedPositionTokenID = await staker.TotalPositions();

                const userAddress = await user0.getAddress();
                const stakerAddress = await staker.getAddress();

                const userBalanceInitial = await balance(userAddress);
                const contractBalanceInitial = await balance(stakerAddress);

                const stakeTx: TransactionResponse = await stake(user0, staker, poolID, amountOrTokenID);
                expect(stakeTx)
                    .to.emit(staker, 'Staked')
                    .withArgs(expectedPositionTokenID, userAddress, poolID, amountOrTokenID);

                const stakeTxReceipt = await stakeTx.wait();
                expect(stakeTxReceipt).to.not.be.null;

                const stakeBlock = await stakeTx.getBlock();
                expect(stakeBlock).to.not.be.null;
                const stakeTimestamp = stakeBlock!.timestamp;

                const userBalanceFinal = await balance(userAddress);
                const contractBalanceFinal = await balance(stakerAddress);

                const numPositions = await staker.TotalPositions();
                expect(numPositions).to.equal(expectedPositionTokenID + BigInt(1));

                const positionOwner = await staker.ownerOf(expectedPositionTokenID);
                expect(positionOwner).to.equal(userAddress);

                const position = await staker.Positions(expectedPositionTokenID);
                expect(position.poolID).to.equal(poolID);
                expect(position.amountOrTokenID).to.equal(amountOrTokenID);
                expect(position.stakeTimestamp).to.equal(stakeTimestamp);
                expect(position.unstakeInitiatedAt).to.equal(0);

                // NOTE: The following expectations are custom to this test
                expect(userBalanceFinal + amountOrTokenID + stakeTxReceipt!.gasUsed * stakeTx.gasPrice).to.equal(
                    userBalanceInitial
                );
                expect(contractBalanceInitial + amountOrTokenID).to.equal(contractBalanceFinal);
            });

            it('cannot stake zero value', async function () {
                const { admin0, erc20, erc721, erc1155, staker, user0, lockupSeconds, cooldownSeconds, poolID } =
                    await loadFixture(setup);

                await expect(stake(user0, staker, poolID, BigInt(0))).to.revertedWithCustomError(
                    staker,
                    'NothingToStake'
                );
            });

            it('cannot initiate unstake before lockup has expired', async function () {
                const { admin0, erc20, erc721, erc1155, staker, user0, lockupSeconds, cooldownSeconds, poolID } =
                    await loadFixture(setup);

                const expectedPositionTokenID = await staker.TotalPositions();

                const stakeTx: TransactionResponse = await stake(user0, staker, poolID, amountOrTokenID);
                const stakeBlock = await stakeTx.getBlock();

                const position0 = await staker.Positions(expectedPositionTokenID);
                expect(position0.unstakeInitiatedAt).to.equal(0);

                time.increase(lockupSeconds - 1);

                const stakerWithUser0 = staker.connect(user0);
                await expect(stakerWithUser0.initiateUnstake(expectedPositionTokenID))
                    .to.revertedWithCustomError(stakerWithUser0, 'LockupNotExpired')
                    .withArgs(stakeBlock!.timestamp + lockupSeconds);

                const position1 = await staker.Positions(expectedPositionTokenID);
                expect(position1.unstakeInitiatedAt).to.equal(0);
            });

            it('can initiate unstake as soon as lockup has expired', async function () {
                const { admin0, erc20, erc721, erc1155, staker, user0, lockupSeconds, cooldownSeconds, poolID } =
                    await loadFixture(setup);

                const expectedPositionTokenID = await staker.TotalPositions();

                const stakeTx: TransactionResponse = await stake(user0, staker, poolID, amountOrTokenID);
                const stakeBlock = await stakeTx.getBlock();

                const position0 = await staker.Positions(expectedPositionTokenID);
                expect(position0.unstakeInitiatedAt).to.equal(0);

                time.increase(lockupSeconds);

                const stakerWithUser0 = staker.connect(user0);
                await stakerWithUser0.initiateUnstake(expectedPositionTokenID);

                const position1 = await staker.Positions(expectedPositionTokenID);
                expect(position1.unstakeInitiatedAt).to.equal(stakeBlock!.timestamp + lockupSeconds);
            });

            it('can initiate idempotently after lockup has expired', async function () {
                const { admin0, erc20, erc721, erc1155, staker, user0, lockupSeconds, cooldownSeconds, poolID } =
                    await loadFixture(setup);

                const expectedPositionTokenID = await staker.TotalPositions();

                const stakeTx: TransactionResponse = await stake(user0, staker, poolID, amountOrTokenID);
                const stakeBlock = await stakeTx.getBlock();

                const position0 = await staker.Positions(expectedPositionTokenID);
                expect(position0.unstakeInitiatedAt).to.equal(0);

                time.increase(lockupSeconds);

                const stakerWithUser0 = staker.connect(user0);

                await stakerWithUser0.initiateUnstake(expectedPositionTokenID);

                const position1 = await staker.Positions(expectedPositionTokenID);
                expect(position1.unstakeInitiatedAt).to.equal(stakeBlock!.timestamp + lockupSeconds);

                time.increase(1);
                await stakerWithUser0.initiateUnstake(expectedPositionTokenID);

                const position2 = await staker.Positions(expectedPositionTokenID);
                expect(position2.unstakeInitiatedAt).to.equal(stakeBlock!.timestamp + lockupSeconds);
            });
        });
    });
});
