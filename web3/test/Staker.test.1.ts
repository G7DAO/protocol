import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';

export async function setupFixture() {
    const [anyone, admin0, admin1, user0, user1, user2] = await ethers.getSigners();

    const PositionMetadata = await ethers.getContractFactory('PositionMetadata');
    const positionMetadata = await PositionMetadata.deploy();

    const Staker = await ethers.getContractFactory('Staker');
    const staker = await Staker.deploy(await positionMetadata.getAddress());

    const ERC20 = await ethers.getContractFactory('MockERC20');
    const erc20 = await ERC20.deploy();

    const ERC721 = await ethers.getContractFactory('MockERC721');
    const erc721 = await ERC721.deploy();

    const ERC1155 = await ethers.getContractFactory('MockERC1155');
    const erc1155 = await ERC1155.deploy();

    return { staker, erc20, erc721, erc1155, anyone, admin0, admin1, user0, user1, user2 };
}

export function setupStakingPoolsFixture(transferable: boolean, lockupSeconds: number, cooldownSeconds: number) {
    async function fixture() {
        const { staker, erc20, erc721, erc1155, anyone, admin0, admin1, user0, user1, user2 } =
            await loadFixture(setupFixture);

        const stakerWithAdmin0 = staker.connect(admin0);

        await stakerWithAdmin0.createPool(
            await stakerWithAdmin0.NATIVE_TOKEN_TYPE(),
            ethers.ZeroAddress,
            0,
            transferable,
            lockupSeconds,
            cooldownSeconds,
            admin0
        );
        const nativePoolID = (await staker.TotalPools()) - BigInt(1);

        await stakerWithAdmin0.createPool(
            await stakerWithAdmin0.ERC20_TOKEN_TYPE(),
            await erc20.getAddress(),
            0,
            transferable,
            lockupSeconds,
            cooldownSeconds,
            admin0
        );
        const erc20PoolID = (await staker.TotalPools()) - BigInt(1);

        await stakerWithAdmin0.createPool(
            await stakerWithAdmin0.ERC721_TOKEN_TYPE(),
            await erc721.getAddress(),
            0,
            transferable,
            lockupSeconds,
            cooldownSeconds,
            admin0
        );
        const erc721PoolID = (await staker.TotalPools()) - BigInt(1);

        const erc1155TokenID = 1;
        await stakerWithAdmin0.createPool(
            await stakerWithAdmin0.ERC1155_TOKEN_TYPE(),
            await erc1155.getAddress(),
            erc1155TokenID,
            transferable,
            lockupSeconds,
            cooldownSeconds,
            admin0
        );
        const erc1155PoolID = (await staker.TotalPools()) - BigInt(1);

        return {
            staker,
            erc20,
            erc721,
            erc1155,
            anyone,
            admin0,
            admin1,
            user0,
            user1,
            user2,
            stakerWithAdmin0,
            nativePoolID,
            erc20PoolID,
            erc721PoolID,
            erc1155TokenID,
            erc1155PoolID,
        };
    }

    return fixture;
}

describe('Staker', function () {
    it('STAKER-1: Anybody should be able to deploy a Staker contract.', async function () {
        const { staker } = await setupFixture();
        expect(await staker.getAddress()).to.be.properAddress;
    });

    it('STAKER-2: The Staker implements ERC721', async function () {
        const { staker } = await setupFixture();
        // 1. `0x80ac58cd` (interface ID for `ERC721`)
        expect(await staker.supportsInterface('0x80ac58cd')).to.be.true;
        // 2. `0x5b5e139f` (interface ID for `ERC721Metadata`)
        expect(await staker.supportsInterface('0x5b5e139f')).to.be.true;
        // 3. `0x780e9d63` (interface ID for `ERC721Enumerable`)
        expect(await staker.supportsInterface('0x780e9d63')).to.be.true;
    });

    it('STAKER-3: Token types', async function () {
        const { staker } = await setupFixture();
        expect(await staker.NATIVE_TOKEN_TYPE()).to.equal(1);
        expect(await staker.ERC20_TOKEN_TYPE()).to.equal(20);
        expect(await staker.ERC721_TOKEN_TYPE()).to.equal(721);
        expect(await staker.ERC1155_TOKEN_TYPE()).to.equal(1155);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-4: Any account should be able to create a staking pool for native tokens.', async function () {
        const { staker, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        const tx = await stakerWithAnyone.createPool(
            await stakerWithAnyone.NATIVE_TOKEN_TYPE(),
            ethers.ZeroAddress,
            0,
            true,
            0,
            0,
            stakerWithAnyone
        );

        await expect(tx)
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(
                0, // poolID should be 0 for the first pool
                await stakerWithAnyone.NATIVE_TOKEN_TYPE(),
                ethers.ZeroAddress,
                0
            );

        const pool = await staker.Pools(0);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.NATIVE_TOKEN_TYPE());
        expect(pool.tokenAddress).to.equal(ethers.ZeroAddress);
        expect(pool.tokenID).to.equal(0);
        expect(pool.transferable).to.equal(true);
        expect(pool.lockupSeconds).to.equal(0);
        expect(pool.cooldownSeconds).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-5: Any account should be able to create a staking pool for ERC20 tokens.', async function () {
        const { staker, erc20, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        const tx = await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC20_TOKEN_TYPE(),
            await erc20.getAddress(),
            0,
            true,
            0,
            0,
            stakerWithAnyone
        );

        await expect(tx)
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(
                0, // poolID should be 0 as the chain state is reset
                await stakerWithAnyone.ERC20_TOKEN_TYPE(),
                await erc20.getAddress(),
                0
            );

        const pool = await staker.Pools(0);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC20_TOKEN_TYPE());
        expect(pool.tokenAddress).to.equal(await erc20.getAddress());
        expect(pool.tokenID).to.equal(0);
        expect(pool.transferable).to.equal(true);
        expect(pool.lockupSeconds).to.equal(0);
        expect(pool.cooldownSeconds).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-6: Any account should be able to create a staking pool for ERC721 tokens.', async function () {
        const { staker, erc721, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        const tx = await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC721_TOKEN_TYPE(),
            await erc721.getAddress(),
            0,
            true,
            0,
            0,
            stakerWithAnyone
        );

        await expect(tx)
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, await stakerWithAnyone.ERC721_TOKEN_TYPE(), await erc721.getAddress(), 0);

        const pool = await staker.Pools(0);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC721_TOKEN_TYPE());
        expect(pool.tokenAddress).to.equal(await erc721.getAddress());
        expect(pool.tokenID).to.equal(0);
        expect(pool.transferable).to.equal(true);
        expect(pool.lockupSeconds).to.equal(0);
        expect(pool.cooldownSeconds).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-7: Any account should be able to create a staking pool for ERC1155 tokens.', async function () {
        const { staker, erc1155, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        const erc1155TokenID = 1;
        const tx = await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC1155_TOKEN_TYPE(),
            await erc1155.getAddress(),
            erc1155TokenID,
            true,
            0,
            0,
            stakerWithAnyone
        );

        await expect(tx)
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, await stakerWithAnyone.ERC1155_TOKEN_TYPE(), await erc1155.getAddress(), erc1155TokenID);

        const pool = await staker.Pools(0);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC1155_TOKEN_TYPE());
        expect(pool.tokenAddress).to.equal(await erc1155.getAddress());
        expect(pool.tokenID).to.equal(erc1155TokenID);
        expect(pool.transferable).to.equal(true);
        expect(pool.lockupSeconds).to.equal(0);
        expect(pool.cooldownSeconds).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-8: Staking pool IDs should start at 0 and increase sequentially, with correct token types.', async function () {
        const { staker, erc20, erc721, erc1155, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        await stakerWithAnyone.createPool(
            await stakerWithAnyone.NATIVE_TOKEN_TYPE(),
            ethers.ZeroAddress,
            0,
            true,
            0,
            0,
            stakerWithAnyone
        );
        let poolID = (await staker.TotalPools()) - 1n;
        expect(poolID).to.equal(0n);
        let pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.NATIVE_TOKEN_TYPE());

        await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC20_TOKEN_TYPE(),
            await erc20.getAddress(),
            0,
            true,
            0,
            0,
            stakerWithAnyone
        );
        poolID = (await staker.TotalPools()) - 1n;
        expect(poolID).to.equal(1n);
        pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC20_TOKEN_TYPE());

        await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC721_TOKEN_TYPE(),
            await erc721.getAddress(),
            0,
            true,
            0,
            0,
            stakerWithAnyone
        );
        poolID = (await staker.TotalPools()) - 1n;
        expect(poolID).to.equal(2n);
        pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC721_TOKEN_TYPE());

        await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC1155_TOKEN_TYPE(),
            await erc1155.getAddress(),
            1,
            true,
            0,
            0,
            stakerWithAnyone
        );
        poolID = (await staker.TotalPools()) - 1n;
        expect(poolID).to.equal(3n);
        pool = await staker.Pools(poolID);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC1155_TOKEN_TYPE());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-9: It should not be possible to create a staking pool for a token of an unknown type.', async function () {
        const { staker, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        const invalidTokenType =
            (await staker.NATIVE_TOKEN_TYPE()) +
            (await staker.ERC20_TOKEN_TYPE()) +
            (await staker.ERC721_TOKEN_TYPE()) +
            (await staker.ERC1155_TOKEN_TYPE()) +
            1n;

        await expect(
            stakerWithAnyone.createPool(invalidTokenType, ethers.ZeroAddress, 0, true, 0, 0, stakerWithAnyone)
        ).to.be.revertedWithCustomError(staker, 'InvalidTokenType');
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-10: It should not be possible to create native token staking pools with non-zero token address or token ID.', async function () {
        const { staker, anyone, user0 } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        // Non-zero token ID
        await expect(
            stakerWithAnyone.createPool(await stakerWithAnyone.NATIVE_TOKEN_TYPE(), ethers.ZeroAddress, 1, true, 0, 0, stakerWithAnyone)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        // Non-zero token address
        await expect(
            stakerWithAnyone.createPool(
                await stakerWithAnyone.NATIVE_TOKEN_TYPE(),
                await user0.getAddress(), // Non-zero address
                0,
                true,
                0,
                0,
                stakerWithAnyone
            )
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-11: It should not be possible to create ERC20 token staking pools with zero token address or non-zero token ID.', async function () {
        const { staker, erc20, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        // Zero token address
        await expect(
            stakerWithAnyone.createPool(await stakerWithAnyone.ERC20_TOKEN_TYPE(), ethers.ZeroAddress, 0, true, 0, 0, stakerWithAnyone)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        // Non-zero token ID
        await expect(
            stakerWithAnyone.createPool(
                await stakerWithAnyone.ERC20_TOKEN_TYPE(),
                await erc20.getAddress(),
                1,
                true,
                0,
                0,
                stakerWithAnyone
            )
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-12: It should not be possible to create ERC721 token staking pools with zero token address or non-zero token ID.', async function () {
        const { staker, erc721, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        // Zero token address
        await expect(
            stakerWithAnyone.createPool(await stakerWithAnyone.ERC721_TOKEN_TYPE(), ethers.ZeroAddress, 0, true, 0, 0, stakerWithAnyone)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');

        // Non-zero token ID
        await expect(
            stakerWithAnyone.createPool(
                await stakerWithAnyone.ERC721_TOKEN_TYPE(),
                await erc721.getAddress(),
                1,
                true,
                0,
                0,
                stakerWithAnyone
            )
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-13: It should not be possible to create ERC1155 token staking pools with zero token address.', async function () {
        const { staker, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        await expect(
            stakerWithAnyone.createPool(await stakerWithAnyone.ERC1155_TOKEN_TYPE(), ethers.ZeroAddress, 1, true, 0, 0, stakerWithAnyone)
        ).to.be.revertedWithCustomError(staker, 'InvalidConfiguration');
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-14: It should be possible to create ERC1155 token staking pools in which the token ID is zero.', async function () {
        const { staker, erc1155, anyone } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);

        const tx = await stakerWithAnyone.createPool(
            await stakerWithAnyone.ERC1155_TOKEN_TYPE(),
            await erc1155.getAddress(),
            0, // Token ID is zero
            true,
            0,
            0,
            stakerWithAnyone
        );

        await expect(tx)
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(0, await stakerWithAnyone.ERC1155_TOKEN_TYPE(), await erc1155.getAddress(), 0);

        const pool = await staker.Pools(0);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.ERC1155_TOKEN_TYPE());
        expect(pool.tokenAddress).to.equal(await erc1155.getAddress());
        expect(pool.tokenID).to.equal(0);
        expect(pool.transferable).to.equal(true);
        expect(pool.lockupSeconds).to.equal(0);
        expect(pool.cooldownSeconds).to.equal(0);
    });

    it('STAKER-15: An administrator should be able to modify any subset of the configuration parameters on a pool in a single transaction', async function () {
        const initialTransferable = true;
        const initialLockupSeconds = 3600;
        const initialCooldownSeconds = 300;

        const { admin0, stakerWithAdmin0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(initialTransferable, initialLockupSeconds, initialCooldownSeconds)
        );

        let poolInitial = await stakerWithAdmin0.Pools(erc20PoolID);
        expect(poolInitial.administrator).to.equal(await admin0.getAddress());

        const subsets = [
            [false, false, true],
            [false, true, false],
            [false, true, true],
            [true, false, false],
            [true, false, true],
            [true, true, false],
            [true, true, true],
        ];

        for (const [changeTransferable, changeLockupSeconds, changeCooldownSeconds] of subsets) {
            const poolBefore = await stakerWithAdmin0.Pools(erc20PoolID);
            const tx = await stakerWithAdmin0.updatePoolConfiguration(
                erc20PoolID,
                changeTransferable,
                !poolBefore.transferable,
                changeLockupSeconds,
                poolBefore.lockupSeconds + 1n,
                changeCooldownSeconds,
                poolBefore.cooldownSeconds + 1n
            );
            await expect(tx)
                .to.emit(stakerWithAdmin0, 'StakingPoolConfigured')
                .withArgs(
                    erc20PoolID,
                    await admin0.getAddress(),
                    changeTransferable ? !poolBefore.transferable : poolBefore.transferable,
                    changeLockupSeconds ? poolBefore.lockupSeconds + 1n : poolBefore.lockupSeconds,
                    changeCooldownSeconds ? poolBefore.cooldownSeconds + 1n : poolBefore.cooldownSeconds
                );

            const poolAfter = await stakerWithAdmin0.Pools(erc20PoolID);

            if (changeTransferable) {
                expect(poolAfter.transferable).to.equal(!poolBefore.transferable);
            } else {
                expect(poolAfter.transferable).to.equal(poolBefore.transferable);
            }

            if (changeLockupSeconds) {
                expect(poolAfter.lockupSeconds).to.equal(poolBefore.lockupSeconds + 1n);
            } else {
                expect(poolAfter.lockupSeconds).to.equal(poolBefore.lockupSeconds);
            }

            if (changeCooldownSeconds) {
                expect(poolAfter.cooldownSeconds).to.equal(poolBefore.cooldownSeconds + 1n);
            } else {
                expect(poolAfter.cooldownSeconds).to.equal(poolBefore.cooldownSeconds);
            }
        }
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-16: A non-administrator (of any pool) should not be able to change any of the parameters of a staking pool.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, admin0, nativePoolID, erc20PoolID, erc721PoolID, erc1155PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const poolIDs = [nativePoolID, erc20PoolID, erc721PoolID, erc1155PoolID];

        for (const poolID of poolIDs) {
            // Verify that user0 is not the administrator of the pool
            const pool = await staker.Pools(poolID);
            expect(pool.administrator).to.equal(await admin0.getAddress());

            await expect(
                stakerWithUser0.updatePoolConfiguration(
                    poolID,
                    true, // changeTransferability
                    !transferable, // new transferable value
                    true, // changeLockup
                    lockupSeconds + 1, // new lockupSeconds
                    true, // changeCooldown
                    cooldownSeconds + 1 // new cooldownSeconds
                )
            ).to.be.revertedWithCustomError(staker, 'NonAdministrator');

            // Verify that the parameters did not change
            const poolAfter = await staker.Pools(poolID);
            expect(poolAfter.transferable).to.equal(transferable);
            expect(poolAfter.lockupSeconds).to.equal(lockupSeconds);
            expect(poolAfter.cooldownSeconds).to.equal(cooldownSeconds);
        }
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-17: A non-administrator (of any pool) should not be able to change any of the parameters of a staking pool, even if they are administrators of a different pool.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, admin0, stakerWithAdmin0, erc20PoolID, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        // Transfer administration of the ERC721 pool to user0
        await stakerWithAdmin0.transferPoolAdministration(erc721PoolID, await user0.getAddress());

        // Verify user0 is now the administrator of the ERC721 pool
        const poolERC721 = await staker.Pools(erc721PoolID);
        expect(poolERC721.administrator).to.equal(await user0.getAddress());

        // Verify admin0 is still the administrator of the ERC20 pool
        const poolERC20 = await staker.Pools(erc20PoolID);
        expect(poolERC20.administrator).to.equal(await admin0.getAddress());

        // Attempt to change the configuration of the ERC20 pool with user0
        await expect(
            stakerWithUser0.updatePoolConfiguration(
                erc20PoolID,
                true, // changeTransferability
                !transferable, // new transferable value
                true, // changeLockup
                lockupSeconds + 1, // new lockupSeconds
                true, // changeCooldown
                cooldownSeconds + 1 // new cooldownSeconds
            )
        ).to.be.revertedWithCustomError(staker, 'NonAdministrator');

        // Verify that the parameters of the ERC20 pool did not change
        const poolERC20After = await staker.Pools(erc20PoolID);
        expect(poolERC20After.transferable).to.equal(transferable);
        expect(poolERC20After.lockupSeconds).to.equal(lockupSeconds);
        expect(poolERC20After.cooldownSeconds).to.equal(cooldownSeconds);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-18: An administrator of a staking pool should be able to transfer administration of that pool to another account.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, admin0, stakerWithAdmin0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        // Verify admin0 is the initial administrator of the ERC20 pool
        let pool = await staker.Pools(erc20PoolID);
        expect(pool.administrator).to.equal(await admin0.getAddress());

        // Transfer administration of the ERC20 pool to user0
        const tx = await stakerWithAdmin0.transferPoolAdministration(erc20PoolID, await user0.getAddress());

        // Check for the emitted event with expected arguments
        await expect(tx)
            .to.emit(staker, 'StakingPoolConfigured')
            .withArgs(
                erc20PoolID,
                await user0.getAddress(),
                pool.transferable,
                pool.lockupSeconds,
                pool.cooldownSeconds
            );

        // Verify user0 is now the administrator of the ERC20 pool
        pool = await staker.Pools(erc20PoolID);
        expect(pool.administrator).to.equal(await user0.getAddress());

        // Verify admin0 can no longer configure the ERC20 pool
        await expect(
            stakerWithAdmin0.updatePoolConfiguration(
                erc20PoolID,
                true, // changeTransferability
                !transferable, // new transferable value
                true, // changeLockup
                lockupSeconds + 1, // new lockupSeconds
                true, // changeCooldown
                cooldownSeconds + 1 // new cooldownSeconds
            )
        ).to.be.revertedWithCustomError(staker, 'NonAdministrator');

        // Verify that the parameters of the ERC20 pool did not change
        pool = await staker.Pools(erc20PoolID);
        expect(pool.transferable).to.equal(transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds);

        // Verify user0 can configure the ERC20 pool
        const stakerWithUser0 = staker.connect(user0);
        await expect(
            stakerWithUser0.updatePoolConfiguration(
                erc20PoolID,
                true, // changeTransferability
                !transferable, // new transferable value
                true, // changeLockup
                lockupSeconds + 1, // new lockupSeconds
                true, // changeCooldown
                cooldownSeconds + 1 // new cooldownSeconds
            )
        ).to.emit(staker, 'StakingPoolConfigured');

        // Verify that the parameters of the ERC20 pool have changed
        pool = await staker.Pools(erc20PoolID);
        expect(pool.transferable).to.equal(!transferable);
        expect(pool.lockupSeconds).to.equal(lockupSeconds + 1);
        expect(pool.cooldownSeconds).to.equal(cooldownSeconds + 1);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-138: A non-administrator should not be able to transfer administration of a pool to another account.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, admin0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        // Verify admin0 is the initial administrator of the ERC20 pool
        const pool = await staker.Pools(erc20PoolID);
        expect(pool.administrator).to.equal(await admin0.getAddress());

        // Attempt to transfer administration of the ERC20 pool with user0
        await expect(
            stakerWithUser0.transferPoolAdministration(erc20PoolID, await user0.getAddress())
        ).to.be.revertedWithCustomError(staker, 'NonAdministrator');

        // Verify that the administrator of the ERC20 pool did not change
        const poolAfter = await staker.Pools(erc20PoolID);
        expect(poolAfter.administrator).to.equal(await admin0.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-139: A non-administrator of a staking pool should not be able to transfer administration of that pool to another account, even if they are an administrator of another pool.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, admin0, stakerWithAdmin0, erc20PoolID, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        // Transfer administration of the ERC721 pool to user0
        await stakerWithAdmin0.transferPoolAdministration(erc721PoolID, await user0.getAddress());

        // Verify user0 is now the administrator of the ERC721 pool
        const poolERC721 = await staker.Pools(erc721PoolID);
        expect(poolERC721.administrator).to.equal(await user0.getAddress());

        // Verify admin0 is still the administrator of the ERC20 pool
        const poolERC20 = await staker.Pools(erc20PoolID);
        expect(poolERC20.administrator).to.equal(await admin0.getAddress());

        // Attempt to transfer administration of the ERC20 pool with user0
        await expect(
            stakerWithUser0.transferPoolAdministration(erc20PoolID, await user0.getAddress())
        ).to.be.revertedWithCustomError(staker, 'NonAdministrator');

        // Verify that the administrator of the ERC20 pool did not change
        const poolERC20After = await staker.Pools(erc20PoolID);
        expect(poolERC20After.administrator).to.equal(await admin0.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-19: A holder should be able to stake any number of native tokens into a native token staking position.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Check balances before staking
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Stake native tokens
        const tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Check balances after staking
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfter = await ethers.provider.getBalance(await user0.getAddress());

        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceBefore).to.equal(user0BalanceAfter + stakeAmount + txReceipt!.fee);

        // Verify the Staked event
        await expect(tx)
            .to.emit(staker, 'Staked')
            .withArgs(
                0, // positionTokenID
                await user0.getAddress(),
                nativePoolID,
                stakeAmount
            );

        // Verify the ERC721 Transfer event
        await expect(tx)
            .to.emit(staker, 'Transfer')
            .withArgs(ethers.ZeroAddress, await user0.getAddress(), 0);

        // Get block timestamp
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;
        const blockTimestamp = block!.timestamp;

        // Verify the position
        const position = await staker.Positions(0);
        expect(position.poolID).to.equal(nativePoolID);
        expect(position.amountOrTokenID).to.equal(stakeAmount);
        expect(position.stakeTimestamp).to.equal(blockTimestamp);
        expect(position.unstakeInitiatedAt).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-20: A holder should be able to stake any number of ERC20 tokens into an ERC20 staking position.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, erc20, user0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseUnits('100', 18);

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to spend ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Check balances before staking
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Stake ERC20 tokens
        const tx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);

        // Check balances after staking
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfter = await erc20.balanceOf(await user0.getAddress());

        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore - stakeAmount);

        // Verify the Staked event
        await expect(tx)
            .to.emit(staker, 'Staked')
            .withArgs(
                0, // positionTokenID
                await user0.getAddress(),
                erc20PoolID,
                stakeAmount
            );

        // Verify the ERC721 Transfer event
        await expect(tx)
            .to.emit(staker, 'Transfer')
            .withArgs(ethers.ZeroAddress, await user0.getAddress(), 0);

        // Get block timestamp
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;
        const blockTimestamp = block!.timestamp;

        // Verify the position
        const position = await staker.Positions(0);
        expect(position.poolID).to.equal(erc20PoolID);
        expect(position.amountOrTokenID).to.equal(stakeAmount);
        expect(position.stakeTimestamp).to.equal(blockTimestamp);
        expect(position.unstakeInitiatedAt).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-21: A holder should be able to stake an ERC721 token into an ERC721 staking position.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, erc721, user0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Check ownership before staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user0.getAddress());

        // Stake ERC721 token
        const tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);

        // Check ownership after staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Verify the Staked event
        await expect(tx)
            .to.emit(staker, 'Staked')
            .withArgs(
                0, // positionTokenID
                await user0.getAddress(),
                erc721PoolID,
                tokenId
            );

        // Verify the ERC721 Transfer event
        await expect(tx)
            .to.emit(staker, 'Transfer')
            .withArgs(ethers.ZeroAddress, await user0.getAddress(), 0);

        // Get block timestamp
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;
        const blockTimestamp = block!.timestamp;

        // Verify the position
        const position = await staker.Positions(0);
        expect(position.poolID).to.equal(erc721PoolID);
        expect(position.amountOrTokenID).to.equal(tokenId);
        expect(position.stakeTimestamp).to.equal(blockTimestamp);
        expect(position.unstakeInitiatedAt).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-22: A holder should be able to stake any number of ERC1155 tokens into an ERC1155 staking position.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, erc1155, user0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Check balances before staking
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Stake ERC1155 tokens
        const tx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);

        // Check balances after staking
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfter = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore - stakeAmount);

        // Verify the Staked event
        await expect(tx)
            .to.emit(staker, 'Staked')
            .withArgs(
                0, // positionTokenID
                await user0.getAddress(),
                erc1155PoolID,
                stakeAmount
            );

        // Verify the ERC721 Transfer event
        await expect(tx)
            .to.emit(staker, 'Transfer')
            .withArgs(ethers.ZeroAddress, await user0.getAddress(), 0);

        // Get block timestamp
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;
        const blockTimestamp = block!.timestamp;

        // Verify the position
        const position = await staker.Positions(0);
        expect(position.poolID).to.equal(erc1155PoolID);
        expect(position.amountOrTokenID).to.equal(stakeAmount);
        expect(position.stakeTimestamp).to.equal(blockTimestamp);
        expect(position.unstakeInitiatedAt).to.equal(0);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-23: Staking position tokens for transferable staking pools should be transferable.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1.2345'); // Using a unique stake amount

        // Get total positions before staking
        const totalPositionsBefore = await staker.TotalPositions();

        // Stake native tokens
        const tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get total positions after staking
        const totalPositionsAfter = await staker.TotalPositions();

        // Verify that total positions have increased by 1
        expect(totalPositionsAfter).to.equal(totalPositionsBefore + 1n);

        // Get the position token ID of the newly minted token
        const positionTokenID = totalPositionsBefore;

        // Verify the position
        const position = await staker.Positions(positionTokenID);
        expect(position.poolID).to.equal(nativePoolID);
        expect(position.amountOrTokenID).to.equal(stakeAmount);
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;
        const blockTimestamp = block!.timestamp;
        expect(position.stakeTimestamp).to.equal(blockTimestamp);
        expect(position.unstakeInitiatedAt).to.equal(0);

        // Verify initial owner of the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Transfer the position token from user0 to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Verify the new owner of the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-24: Staking position tokens for non-transferable staking pools should not be transferable.', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('5.6789'); // Using a unique and distinctive stake amount

        // Get total positions before staking
        const totalPositionsBefore = await staker.TotalPositions();

        // Stake native tokens
        const tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get total positions after staking
        const totalPositionsAfter = await staker.TotalPositions();

        // Verify that total positions have increased by 1
        expect(totalPositionsAfter).to.equal(totalPositionsBefore + 1n);

        // Get the position token ID of the newly minted token
        const positionTokenID = totalPositionsBefore;

        // Verify the position
        const position = await staker.Positions(positionTokenID);
        expect(position.poolID).to.equal(nativePoolID);
        expect(position.amountOrTokenID).to.equal(stakeAmount);
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;
        const blockTimestamp = block!.timestamp;
        expect(position.stakeTimestamp).to.equal(blockTimestamp);
        expect(position.unstakeInitiatedAt).to.equal(0);

        // Verify initial owner of the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to transfer the position token using transferFrom
        await expect(stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID))
            .to.be.revertedWithCustomError(staker, 'PositionNotTransferable')
            .withArgs(positionTokenID);

        // Attempt to transfer the position token using safeTransferFrom
        await expect(
            stakerWithUser0['safeTransferFrom(address,address,uint256)'](
                await user0.getAddress(),
                await user1.getAddress(),
                positionTokenID
            )
        )
            .to.be.revertedWithCustomError(staker, 'PositionNotTransferable')
            .withArgs(positionTokenID);

        // Attempt to transfer the position token using safeTransferFrom with data
        await expect(
            stakerWithUser0['safeTransferFrom(address,address,uint256,bytes)'](
                await user0.getAddress(),
                await user1.getAddress(),
                positionTokenID,
                '0x'
            )
        )
            .to.be.revertedWithCustomError(staker, 'PositionNotTransferable')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-25: If a native token staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('2.3456'); // Using a unique and distinctive stake amount

        // Stake native tokens
        const tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Check balances after staking
        const stakerBalanceAfterStaking = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterStaking = await ethers.provider.getBalance(await user0.getAddress());

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Unstake the position
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check balances after unstaking
        const stakerBalanceAfterUnstaking = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstaking = await ethers.provider.getBalance(await user0.getAddress());

        const gasCost = unstakeTxReceipt!.fee;

        expect(stakerBalanceAfterUnstaking).to.equal(stakerBalanceAfterStaking - stakeAmount);
        expect(user0BalanceAfterUnstaking + gasCost).to.equal(user0BalanceAfterStaking + stakeAmount);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), nativePoolID, stakeAmount);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // TODO(zomglings): This should probably be its own flow.
        // Attempt to unstake the same position again and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-26: If an ERC20 staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Check balances before staking
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Stake ERC20 tokens
        const tx = await stakerWithUser0.stakeERC20(await user0.getAddress(), erc20PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Check balances after staking
        const stakerBalanceAfterStaking = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterStaking = await erc20.balanceOf(await user0.getAddress());

        expect(stakerBalanceAfterStaking).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterStaking).to.equal(user0BalanceBefore - stakeAmount);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Unstake the position
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check balances after unstaking
        const stakerBalanceAfterUnstaking = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstaking = await erc20.balanceOf(await user0.getAddress());

        expect(stakerBalanceAfterUnstaking).to.equal(stakerBalanceAfterStaking - stakeAmount);
        expect(user0BalanceAfterUnstaking).to.equal(user0BalanceAfterStaking + stakeAmount);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc20PoolID, stakeAmount);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // TODO(zomglings): This should probably be its own flow.
        // Attempt to unstake the same position again and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-27: If an ERC721 staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1n;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Check ownership before staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user0.getAddress());

        // Stake ERC721 token
        const tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Check ownership after staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Unstake the position
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check ownership after unstaking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user0.getAddress());

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc721PoolID, tokenId);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Attempt to unstake the same position again and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-28: If an ERC1155 staking pool does not have a cooldown, the user who staked into that position should be able to unstake after the lockup period assuming they still hold the position token.', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 50n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Check balances before staking
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Stake ERC1155 tokens
        const tx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Check balances after staking
        const stakerBalanceAfterStaking = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterStaking = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterStaking).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterStaking).to.equal(user0BalanceBefore - stakeAmount);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Unstake the position
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check balances after unstaking
        const stakerBalanceAfterUnstaking = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstaking = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstaking).to.equal(stakerBalanceAfterStaking - stakeAmount);
        expect(user0BalanceAfterUnstaking).to.equal(user0BalanceAfterStaking + stakeAmount);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc1155PoolID, stakeAmount);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Attempt to unstake the same position again and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-29: If a native token staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('2.3456'); // Unique and distinctive stake amount

        // Stake native tokens
        const tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before unstaking
        const stakerBalanceBeforeUnstaking = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceBeforeUnstaking = await ethers.provider.getBalance(await user1.getAddress());

        // Unstake the position
        const unstakeTx = await staker.connect(user1).unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check balances after unstaking
        const stakerBalanceAfterUnstaking = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceAfterUnstaking = await ethers.provider.getBalance(await user1.getAddress());

        const gasCost = unstakeTxReceipt!.fee;

        expect(stakerBalanceAfterUnstaking).to.equal(stakerBalanceBeforeUnstaking - stakeAmount); // Staker contract balance should return to initial
        expect(user1BalanceBeforeUnstaking + stakeAmount).to.equal(user1BalanceAfterUnstaking + gasCost);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user1.getAddress(), nativePoolID, stakeAmount);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user1.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Attempt to unstake the same position again and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-30: If an ERC20 staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await staker.connect(user0).stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await staker.connect(user0).transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before unstaking
        const stakerBalanceBeforeUnstaking = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceBeforeUnstaking = await erc20.balanceOf(await user1.getAddress());

        // Unstake the position
        const unstakeTx = await staker.connect(user1).unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check balances after unstaking
        const stakerBalanceAfterUnstaking = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceAfterUnstaking = await erc20.balanceOf(await user1.getAddress());

        expect(stakerBalanceAfterUnstaking).to.equal(stakerBalanceBeforeUnstaking - stakeAmount);
        expect(user1BalanceAfterUnstaking).to.equal(user1BalanceBeforeUnstaking + stakeAmount);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user1.getAddress(), erc20PoolID, stakeAmount);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user1.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Attempt to unstake the same position again and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-31: If an ERC721 staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const tokenId = 1n;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const stakeTx = await staker.connect(user0).stakeERC721(user0, erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await staker.connect(user0).transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Unstake the position
        const unstakeTx = await staker.connect(user1).unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check ownership after unstaking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user1.getAddress());

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user1.getAddress(), erc721PoolID, tokenId);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user1.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Attempt to unstake the same position again and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-32: If an ERC1155 staking pool does not have a cooldown, a user who holds the position token but who isn't the original holder should be able to unstake after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = 50n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await staker.connect(user0).stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await staker.connect(user0).transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before unstaking
        const stakerBalanceBeforeUnstaking = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceBeforeUnstaking = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Unstake the position
        const unstakeTx = await staker.connect(user1).unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Check balances after unstaking
        const stakerBalanceAfterUnstaking = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceAfterUnstaking = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstaking).to.equal(stakerBalanceBeforeUnstaking - stakeAmount);
        expect(user1BalanceAfterUnstaking).to.equal(user1BalanceBeforeUnstaking + stakeAmount);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user1.getAddress(), erc1155PoolID, stakeAmount);

        // Verify the ERC721 Transfer event (burn)
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user1.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Verify the position token has been burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Attempt to unstake the same position again and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-33: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('2.3456'); // Unique and distinctive stake amount

        // Stake native tokens
        await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });

        // Get the position token ID of the newly minted token
        const positionTokenID = (await stakerWithUser0.TotalPositions()) - 1n;

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user1.getAddress());

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user1.getAddress());

        // Balance expectations
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        // TODO(zomglings): Doing this because it's hard to calculate gas fees for reverted transaction.
        // This properly tests the flow, but it would be good to come back to this and make the expecation
        // for an exact amount.
        expect(user1BalanceAfterUnstakeAttempt).to.be.lessThanOrEqual(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-34: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await staker.connect(user0).stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-35: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Verify ownership of the staked ERC721 token
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-36: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const tx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    it("STAKER-37: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('2.3456'); // Unique and distinctive stake amount

        // Stake native tokens
        await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });

        // Get the position token ID of the newly minted token
        const positionTokenID = (await stakerWithUser0.TotalPositions()) - 1n;

        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        // TODO(zomglings): Replace all instances of time.increase and time.increaseTo with time.setNextBlockTimestamp, which is more precise.
        // This will require some more complicated refactoring to get the block number out of the staking transaction - see STAKER-57 implementation
        // for an example of this.
        await time.increase(lockupSeconds);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());

        // Verify user0 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());

        // Balance expectations
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        // TODO(zomglings): Doing this because it's hard to calculate gas fees for reverted transaction.
        // This properly tests the flow, but it would be good to come back to this and make the expecation
        // for an exact amount.
        expect(user0BalanceAfterUnstakeAttempt).to.be.lessThanOrEqual(user0BalanceBeforeUnstakeAttempt);
    });

    it("STAKER-38: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakerWithUser0 = staker.connect(user0);
        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    it("STAKER-39: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Verify ownership of the staked ERC721 token
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-40: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool even after the lockup period, even if they were the original holder.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const tx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward time by lockup period
        await time.increase(lockupSeconds);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Attempt to unstake the position as user1 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-49: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user1.getAddress());

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 before lockup period expires and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());
        const user1BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user1.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        // TODO(zomglings): Doing this because it's hard to calculate gas fees for reverted transaction.
        // This properly tests the flow, but it would be good to come back to this and make the expecation
        // for an exact amount.
        expect(user1BalanceAfterUnstakeAttempt).to.lessThanOrEqual(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-50: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 before lockup period expires and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-51: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 tokens
        const stakeTx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 before lockup period expires and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure ERC721 token ownership remains with the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-52: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Verify user1 does not own the position token
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to unstake the position as user1 before lockup period expires and expect it to fail
        await expect(staker.connect(user1).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-53: If a native token staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires, even if they were the original holder", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('2.3456'); // Unique and distinctive stake amount

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is no longer user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user1.getAddress());

        // Attempt to unstake the position before lockup period expires and expect it to fail
        await expect(staker.connect(user0).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());
        const user1BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user1.getAddress());

        // Balance expectations
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
        // TODO(zomglings): Doing this because it's hard to calculate gas fees for reverted transaction.
        // This properly tests the flow, but it would be good to come back to this and make the expectation
        // for an exact amount.
        expect(user0BalanceAfterUnstakeAttempt).to.be.lessThanOrEqual(user0BalanceBeforeUnstakeAttempt); // Less due to gas fees
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-54: If an ERC20 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires, even if they were the original holder", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Ensure the position holder is no longer user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Attempt to unstake the position before lockup period expires and expect it to fail
        await expect(staker.connect(user0).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());
        const user1BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user1.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4.0
    it("STAKER-55: If an ERC721 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires, even if they were the original holder", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1n;

        await erc721.mint(await user0.getAddress(), tokenId);
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 tokens
        const stakeTx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        await expect(staker.connect(user0).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4.0
    it("STAKER-56: If an ERC1155 staking pool does not have a cooldown, a user who doesn't hold the position token should not be able to unstake a position in that staking pool before the lockup period expires, even if they were the original holder.", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        const stakerBalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        await expect(staker.connect(user0).unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        const stakerBalanceAfterUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        const user1BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
        expect(user1BalanceAfterUnstakeAttempt).to.equal(user1BalanceBeforeUnstakeAttempt);
    });

    // Test written with the aid of ChatGPT 4.0
    it('STAKER-57: If a native token staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period expires', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is no longer user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await ethers.provider.getBalance(await user0.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.be.lessThanOrEqual(user0BalanceBeforeUnstakeAttempt);
    });

    it('STAKER-58: If an ERC20 staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period expires', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBeforeUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstakeAttempt = await erc20.balanceOf(await user0.getAddress());

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
    });

    it('STAKER-59: If an ERC721 staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period expires', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1n;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 tokens
        const stakeTx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Ensure ERC721 token ownership remains with the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    it('STAKER-60: If an ERC1155 staking pool does not have a cooldown, a user who holds the position token should not be able to unstake a position in that staking pool before the lockup period expires', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check balances before attempting to unstake
        const stakerBalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBeforeUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Check balances after attempting to unstake
        const stakerBalanceAfterUnstakeAttempt = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstakeAttempt = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Ensure balances are unchanged
        expect(stakerBalanceAfterUnstakeAttempt).to.equal(stakerBalanceBeforeUnstakeAttempt);
        expect(user0BalanceAfterUnstakeAttempt).to.equal(user0BalanceBeforeUnstakeAttempt);
    });

    it('STAKER-41: If a native token staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const nativePool = await staker.Pools(nativePoolID);
        expect(nativePool.cooldownSeconds).to.be.greaterThan(0);

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfter = await ethers.provider.getBalance(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.be.lessThanOrEqual(user0BalanceBefore);
    });

    it('STAKER-42: If an ERC20 staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc20, user0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfter = await erc20.balanceOf(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-43: If an ERC721 staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc721, user0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Verify ownership before attempting to unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Verify ownership after attempting to unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-44: If an ERC1155 staking pool has a cooldown, a position holder who did create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc1155, user0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfter = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-45: If a native token staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const nativePool = await staker.Pools(nativePoolID);
        expect(nativePool.cooldownSeconds).to.be.greaterThan(0);

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceBefore = await ethers.provider.getBalance(await user1.getAddress());

        const stakerWithUser1 = staker.connect(user1);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceAfter = await ethers.provider.getBalance(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.be.lessThanOrEqual(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-46: If an ERC20 staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceBefore = await erc20.balanceOf(await user1.getAddress());

        const stakerWithUser1 = staker.connect(user1);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceAfter = await erc20.balanceOf(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-47: If an ERC721 staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record ownership before attempting to unstake
        const ownerBefore = await erc721.ownerOf(tokenId);
        expect(ownerBefore).to.equal(await staker.getAddress());

        const stakerWithUser1 = staker.connect(user1);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record ownership after attempting to unstake
        const ownerAfter = await erc721.ownerOf(tokenId);
        expect(ownerAfter).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-48: If an ERC1155 staking pool has a cooldown, a position holder who didn't create the position and who has not initiated an unstake should not be able to unstake their position even after the lockup period", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to the lockup period expiration
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceBefore = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        const stakerWithUser1 = staker.connect(user1);

        // Attempt to unstake the position and expect it to fail
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceAfter = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });
});
