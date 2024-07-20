import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { setupStakingPoolsFixture } from './Staker.test.1';

describe('Staker', function () {
    // Test written with the aid of ChatGPT 4o
    it("STAKER-61: If a native token staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired", async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
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

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceBefore = await ethers.provider.getBalance(await user1.getAddress());

        // Attempt to initiate an unstake before the lockup period expires
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceAfter = await ethers.provider.getBalance(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.be.lessThanOrEqual(user1BalanceBefore); // Considering gas fees
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-62: If an ERC20 staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired", async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceBefore = await erc20.balanceOf(await user1.getAddress());

        // Attempt to initiate an unstake before the lockup period expires
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceAfter = await erc20.balanceOf(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-63: If an ERC721 staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired", async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record ownership before attempting to initiate unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Attempt to initiate an unstake before the lockup period expires
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Invariants: ensure the ownership didn't change
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it("STAKER-64: If an ERC1155 staking pool has a cooldown, a position holder who didn't create the position should not be able to initiate an unstake before the lockup period has expired", async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceBefore = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Attempt to initiate an unstake before the lockup period expires
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceAfter = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-65: If a native token staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Attempt to initiate an unstake before the lockup period expires
        await expect(stakerWithUser0.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfter = await ethers.provider.getBalance(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.be.lessThanOrEqual(user0BalanceBefore); // Account for gas usage
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-66: If an ERC20 staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Attempt to initiate an unstake before the lockup period expires
        await expect(stakerWithUser0.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfter = await erc20.balanceOf(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-67: If an ERC721 staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Check ownership before attempting to initiate unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Attempt to initiate an unstake before the lockup period expires
        await expect(stakerWithUser0.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Check ownership after attempting to initiate unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-68: If an ERC1155 staking pool has a cooldown, a position holder who did create the position should not be able to initiate an unstake before the lockup period has expired', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Attempt to initiate an unstake before the lockup period expires
        await expect(stakerWithUser0.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfter = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-69: If a native token staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceBefore = await ethers.provider.getBalance(await user1.getAddress());

        // Attempt to initiate an unstake before the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceAfter = await ethers.provider.getBalance(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.be.lessThanOrEqual(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-70: If an ERC20 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceBefore = await erc20.balanceOf(await user1.getAddress());

        // Attempt to initiate an unstake before the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceAfter = await erc20.balanceOf(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-71: If an ERC721 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc721.balanceOf(await staker.getAddress());
        const user1BalanceBefore = await erc721.balanceOf(await user1.getAddress());

        // Attempt to initiate an unstake before the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc721.balanceOf(await staker.getAddress());
        const user1BalanceAfter = await erc721.balanceOf(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);

        // Verify ownership of the staked token
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-72: If an ERC1155 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake before the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to 1 second before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceBefore = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Attempt to initiate an unstake before the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceAfter = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);

        // Verify ownership of the staked tokens
        expect(await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID)).to.equal(stakeAmount);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-73: If a native token staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceBefore = await ethers.provider.getBalance(await user1.getAddress());

        // Attempt to initiate an unstake after the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user1BalanceAfter = await ethers.provider.getBalance(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.be.lessThanOrEqual(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-74: If an ERC20 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc20, user0, user1, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const stakeAmount = 100n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceBefore = await erc20.balanceOf(await user1.getAddress());

        // Attempt to initiate an unstake after the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user1BalanceAfter = await erc20.balanceOf(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-75: If an ERC721 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc721, user0, user1, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const tokenId = 1;

        // Mint ERC721 token to user0
        await erc721.mint(await user0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(user0).approve(await staker.getAddress(), tokenId);

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record ownership before attempting to initiate unstake
        const ownerBefore = await staker.ownerOf(positionTokenID);

        // Attempt to initiate an unstake after the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure ownership did not change
        const ownerAfter = await staker.ownerOf(positionTokenID);
        expect(ownerAfter).to.equal(ownerBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-76: If an ERC1155 staking pool has a cooldown, a position non-holder should not be able to initiate an unstake after the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, erc1155, user0, user1, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);
        const stakeAmount = 100n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceBefore = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Attempt to initiate an unstake after the lockup period expires by user1 (non-holder)
        await expect(stakerWithUser1.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Record balances after attempting to initiate unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user1BalanceAfter = await erc1155.balanceOf(await user1.getAddress(), erc1155TokenID);

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user1BalanceAfter).to.equal(user1BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-77: If a native token staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Record balances after initiating unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfter = await ethers.provider.getBalance(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.be.lessThanOrEqual(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-78: If an ERC20 staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record balances before attempting to initiate unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Record balances after initiating unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfter = await erc20.balanceOf(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-79: If an ERC721 staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record ownership before attempting to initiate unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Ensure ownership has not changed after initiating unstake
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-80: If an ERC1155 staking pool has a cooldown, a position holder should be able to initiate an unstake after the lockup period has expired', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Record balances before initiating unstake
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Ensure balances have not changed after initiating unstake
        const stakerBalanceAfter = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfter = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-81: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Re-initiate the unstake
        const reinitiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const reinitiateUnstakeTxReceipt = await reinitiateUnstakeTx.wait();
        expect(reinitiateUnstakeTxReceipt).to.not.be.null;

        // Verify that no new UnstakeInitiated event is emitted
        await expect(reinitiateUnstakeTx).to.not.emit(staker, 'UnstakeInitiated');

        // Ensure unstakeInitiatedAt remains unchanged
        const positionAfterReinitiate = await staker.Positions(positionTokenID);
        expect(positionAfterReinitiate.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-82: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Re-initiate the unstake
        const reinitiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const reinitiateUnstakeTxReceipt = await reinitiateUnstakeTx.wait();
        expect(reinitiateUnstakeTxReceipt).to.not.be.null;

        // Ensure unstakeInitiatedAt remains unchanged
        const positionAfterReinitiate = await staker.Positions(positionTokenID);
        expect(positionAfterReinitiate.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-83: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Re-initiate the unstake
        const reinitiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const reinitiateUnstakeTxReceipt = await reinitiateUnstakeTx.wait();
        expect(reinitiateUnstakeTxReceipt).to.not.be.null;

        // Ensure unstakeInitiatedAt remains unchanged
        const positionAfterReinitiate = await staker.Positions(positionTokenID);
        expect(positionAfterReinitiate.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-84: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake but not completed that unstake, any further initiations of the unstake will be idempotent', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Ensure unstakeInitiatedAt is set correctly
        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        // Re-initiate the unstake
        const reinitiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const reinitiateUnstakeTxReceipt = await reinitiateUnstakeTx.wait();
        expect(reinitiateUnstakeTxReceipt).to.not.be.null;

        // Ensure unstakeInitiatedAt remains unchanged
        const positionAfterReinitiate = await staker.Positions(positionTokenID);
        expect(positionAfterReinitiate.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-85: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Attempt to complete the unstake and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfter = await ethers.provider.getBalance(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.be.lessThanOrEqual(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-86: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Record balances before attempting to unstake
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Attempt to complete the unstake and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Record balances after attempting to unstake
        const stakerBalanceAfter = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfter = await erc20.balanceOf(await user0.getAddress());

        // Invariants: ensure no changes occurred in the balances
        expect(stakerBalanceAfter).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfter).to.equal(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-87: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Ensure the staked ERC721 token is held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Ensure the staked ERC721 token is still held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Attempt to complete the unstake and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Ensure the staked ERC721 token is still held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-88: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then the position holder cannot complete the unstake', async function () {
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
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Record balances before initiating unstake
        const stakerBalanceBeforeUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBeforeUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(cooldownSeconds);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBeforeUnstake);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceBeforeUnstake);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-89: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Check balances before staking
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstake = await ethers.provider.getBalance(await user0.getAddress());

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.be.lessThanOrEqual(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-90: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake', async function () {
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

        // Check balances before staking
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstake = await erc20.balanceOf(await user0.getAddress());

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceBefore - stakeAmount);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-91: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake', async function () {
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

        // Ensure user0 owns the ERC721 token before staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user0.getAddress());

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());
        // Ensure the staked ERC721 token is held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());
        // Ensure the staked ERC721 token is still held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-92: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake', async function () {
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

        // Check balances before staking
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Ensure the staked ERC1155 tokens are held by the staker contract
        const stakerBalanceAfterStake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterStake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        expect(stakerBalanceAfterStake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterStake).to.equal(user0BalanceBefore - stakeAmount);

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds - 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceAfterStake);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceAfterStake);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-93: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Check balances before staking
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        await stakerWithUser0.initiateUnstake(positionTokenID);

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + cooldownSeconds - 1);

        // Attempt to complete the unstake with user0 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Ensure the position holder is still user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstake = await ethers.provider.getBalance(await user0.getAddress());

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.be.lessThanOrEqual(user0BalanceBefore);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-94: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
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

        // Check balances before staking
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        await stakerWithUser0.initiateUnstake(positionTokenID);

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + cooldownSeconds - 1);

        // Attempt to complete the unstake with user0 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Ensure the position holder is still user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstake = await erc20.balanceOf(await user0.getAddress());

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceBefore - stakeAmount);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-95: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
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

        // Check ownership before staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user0.getAddress());

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        await stakerWithUser0.initiateUnstake(positionTokenID);

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + cooldownSeconds - 1);

        // Attempt to complete the unstake with user0 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Ensure the position holder is still user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Ensure the staked ERC721 token is still held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-96: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has not expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
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

        // Check balances before staking
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        await stakerWithUser0.initiateUnstake(positionTokenID);

        // Transfer the position token to user1
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), positionTokenID);

        // Ensure the position holder is now user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Fast-forward time to before the cooldown period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + cooldownSeconds - 1);

        // Attempt to complete the unstake with user0 and expect it to fail
        await expect(stakerWithUser0.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user1.getAddress(), await user0.getAddress());

        // Ensure the position holder is still user1
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user1.getAddress());

        // Invariants: ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceBefore - stakeAmount);
    });

    // Test written with the aid of ChatGPT 4o
    it('STAKER-97: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await ethers.provider.getBalance(await user0.getAddress());

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), nativePoolID, stakeAmount);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Invariants: ensure the balances are updated correctly
        const stakerBalanceAfterUnstake = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstake = await ethers.provider.getBalance(await user0.getAddress());

        const expectedUser0BalanceAfterUnstake = user0BalanceBeforeUnstake + stakeAmount - unstakeTxReceipt!.fee;

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfterUnstake).to.equal(expectedUser0BalanceAfterUnstake);
    });

    it('STAKER-98: : If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake native tokens
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await erc20.balanceOf(await user0.getAddress());

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc20PoolID, stakeAmount);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Invariants: ensure the balances are updated correctly
        const stakerBalanceAfterUnstake = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstake = await erc20.balanceOf(await user0.getAddress());

        const expectedUser0BalanceAfterUnstake = user0BalanceBeforeUnstake + stakeAmount;

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfterUnstake).to.equal(expectedUser0BalanceAfterUnstake);
    });

    it('STAKER-99: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, erc721, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenID = 76324;

        await erc721.mint(await user0.getAddress(), tokenID);
        await erc721.connect(user0).approve(await staker.getAddress(), tokenID);

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenID);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        expect(await erc721.ownerOf(tokenID)).to.equal(await staker.getAddress());
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await erc721.balanceOf(await user0.getAddress());

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc721PoolID, tokenID);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        expect(await erc721.ownerOf(tokenID)).to.equal(await user0.getAddress());
    });

    it('STAKER-100: : If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is transferable', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, erc1155, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake native tokens
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc1155PoolID, stakeAmount);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Invariants: ensure the balances are updated correctly
        const stakerBalanceAfterUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        const expectedUser0BalanceAfterUnstake = user0BalanceBeforeUnstake + stakeAmount;

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfterUnstake).to.equal(expectedUser0BalanceAfterUnstake);
    });

    it('STAKER-101: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Stake native tokens
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await ethers.provider.getBalance(await user0.getAddress());

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);
        const unstakeTxReceipt = await unstakeTx.wait();
        expect(unstakeTxReceipt).to.not.be.null;

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), nativePoolID, stakeAmount);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Invariants: ensure the balances are updated correctly
        const stakerBalanceAfterUnstake = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstake = await ethers.provider.getBalance(await user0.getAddress());

        const expectedUser0BalanceAfterUnstake = user0BalanceBeforeUnstake + stakeAmount - unstakeTxReceipt!.fee;

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfterUnstake).to.equal(expectedUser0BalanceAfterUnstake);
    });

    it('STAKER-102: : If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake native tokens
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await erc20.balanceOf(await user0.getAddress());

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc20PoolID, stakeAmount);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Invariants: ensure the balances are updated correctly
        const stakerBalanceAfterUnstake = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstake = await erc20.balanceOf(await user0.getAddress());

        const expectedUser0BalanceAfterUnstake = user0BalanceBeforeUnstake + stakeAmount;

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfterUnstake).to.equal(expectedUser0BalanceAfterUnstake);
    });

    it('STAKER-103: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, erc721, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenID = 76324;

        await erc721.mint(await user0.getAddress(), tokenID);
        await erc721.connect(user0).approve(await staker.getAddress(), tokenID);

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenID);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        expect(await erc721.ownerOf(tokenID)).to.equal(await staker.getAddress());
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await erc721.balanceOf(await user0.getAddress());

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc721PoolID, tokenID);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        expect(await erc721.ownerOf(tokenID)).to.equal(await user0.getAddress());
    });

    it('STAKER-104: : If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then the position holder can unstake and the position token is burned when the staking position is non-transferable', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, erc1155, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 100n;

        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake native tokens
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Fast-forward time to exactly after the cooldown period expires
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);

        const user0BalanceBeforeUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Complete the unstake
        const unstakeTx = await stakerWithUser0.unstake(positionTokenID);

        // Verify the Unstaked event
        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), erc1155PoolID, stakeAmount);

        // Verify the ERC721 Transfer event signifying the position token was burned
        await expect(unstakeTx)
            .to.emit(staker, 'Transfer')
            .withArgs(await user0.getAddress(), ethers.ZeroAddress, positionTokenID);

        // Ensure the position token is burned
        await expect(staker.ownerOf(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(positionTokenID);

        // Invariants: ensure the balances are updated correctly
        const stakerBalanceAfterUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        const expectedUser0BalanceAfterUnstake = user0BalanceBeforeUnstake + stakeAmount;

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore);
        expect(user0BalanceAfterUnstake).to.equal(expectedUser0BalanceAfterUnstake);
    });

    it('STAKER-105: If a native token staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1800;

        const { staker, user0, user1, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = ethers.parseEther('1');

        // Check balances before staking
        const stakerBalanceBefore = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceBefore = await ethers.provider.getBalance(await user0.getAddress());

        // Stake native tokens
        const stakeTx = await stakerWithUser0.stakeNative(nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to after cooldown period expiration
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds + 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await ethers.provider.getBalance(await staker.getAddress());
        const user0BalanceAfterUnstake = await ethers.provider.getBalance(await user0.getAddress());

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.be.lessThanOrEqual(user0BalanceBefore);
    });

    it('STAKER-106: If an ERC20 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake', async function () {
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

        // Check balances before staking
        const stakerBalanceBefore = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceBefore = await erc20.balanceOf(await user0.getAddress());

        // Stake ERC20 tokens
        const stakeTx = await stakerWithUser0.stakeERC20(erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to after cooldown period expiration
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds + 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc20.balanceOf(await staker.getAddress());
        const user0BalanceAfterUnstake = await erc20.balanceOf(await user0.getAddress());

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceBefore - stakeAmount);
    });

    it('STAKER-107: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake', async function () {
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

        // Ensure user0 owns the ERC721 token before staking
        expect(await erc721.ownerOf(tokenId)).to.equal(await user0.getAddress());

        // Stake ERC721 token
        const stakeTx = await stakerWithUser0.stakeERC721(erc721PoolID, tokenId);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());
        // Ensure the staked ERC721 token is held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to after cooldown period expiration
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds + 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());
        // Ensure the staked ERC721 token is still held by the staker contract
        expect(await erc721.ownerOf(tokenId)).to.equal(await staker.getAddress());
    });

    it('STAKER-108: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake', async function () {
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

        // Check balances before staking
        const stakerBalanceBefore = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceBefore = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        // Stake ERC1155 tokens
        const stakeTx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Ensure the staked ERC1155 tokens are held by the staker contract
        const stakerBalanceAfterStake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterStake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        expect(stakerBalanceAfterStake).to.equal(stakerBalanceBefore + stakeAmount);
        expect(user0BalanceAfterStake).to.equal(user0BalanceBefore - stakeAmount);

        // Fast-forward time to after the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds + 1);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        // Verify the UnstakeInitiated event
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user0.getAddress());

        // Fast-forward time to after cooldown period expiration
        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds + 1);

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Attempt to complete the unstake with user1 and expect it to fail
        const stakerWithUser1 = staker.connect(user1);
        await expect(stakerWithUser1.unstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await user1.getAddress());

        // Ensure the position holder is still user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Invariants: Ensure no changes occurred in the balances
        const stakerBalanceAfterUnstake = await erc1155.balanceOf(await staker.getAddress(), erc1155TokenID);
        const user0BalanceAfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);

        expect(stakerBalanceAfterUnstake).to.equal(stakerBalanceAfterStake);
        expect(user0BalanceAfterUnstake).to.equal(user0BalanceAfterStake);
    });
});
