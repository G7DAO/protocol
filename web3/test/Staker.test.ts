import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { boolean, json } from 'hardhat/internal/core/params/argumentTypes';

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
        expect(nativeTokenType).to.equal(0);

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

    describe("should allow a pool's administrator to modify any subset of its configurable parameters in a single transaction", async function () {
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
});
