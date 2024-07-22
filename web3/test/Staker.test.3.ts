import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { setupStakingPoolsFixture } from './Staker.test.1';

describe('Staker', function () {
    it('STAKER-113: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
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

        const metadataJSON = await staker.metadataJSON(positionTokenID);
        const metadata = JSON.parse(metadataJSON);
        expect(metadata).to.not.be.null;
        expect(metadata.token_id).to.equal(positionTokenID);
        expect(metadata.attributes[0].trait_type).to.equal('Pool ID');
        expect(metadata.attributes[0].value).to.equal(erc721PoolID.toString());
        expect(metadata.attributes[1].trait_type).to.equal('Staked token ID');
        expect(metadata.attributes[1].value).to.equal(tokenId.toString());
        expect(metadata.attributes[2].trait_type).to.equal('Staked at');
        expect(metadata.attributes[2].value).to.equal(stakeBlock!.timestamp);
        expect(metadata.attributes[3].trait_type).to.equal('Lockup expires at');
        expect(metadata.attributes[3].value).to.equal(stakeBlock!.timestamp + lockupSeconds);

        const positionTokenURI = await staker.tokenURI(positionTokenID);
        const decodedMetadataJSON = Buffer.from(positionTokenURI.split(',')[1], 'base64').toString();
        const decodedMetadata = JSON.parse(decodedMetadataJSON);
        expect(decodedMetadata).to.deep.equal(metadata);
    });

    it('STAKER-114: If an ERC1155 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
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

        const metadataJSON = await staker.metadataJSON(positionTokenID);
        const metadata = JSON.parse(metadataJSON);
        expect(metadata).to.not.be.null;
        expect(metadata.token_id).to.equal(positionTokenID);
        expect(metadata.attributes[0].trait_type).to.equal('Pool ID');
        expect(metadata.attributes[0].value).to.equal(erc1155PoolID.toString());
        expect(metadata.attributes[1].trait_type).to.equal('Staked amount');
        expect(metadata.attributes[1].value).to.equal(stakeAmount.toString());
        expect(metadata.attributes[2].trait_type).to.equal('Staked at');
        expect(metadata.attributes[2].value).to.equal(stakeBlock!.timestamp);
        expect(metadata.attributes[3].trait_type).to.equal('Lockup expires at');
        expect(metadata.attributes[3].value).to.equal(stakeBlock!.timestamp + lockupSeconds);

        const positionTokenURI = await staker.tokenURI(positionTokenID);
        const decodedMetadataJSON = Buffer.from(positionTokenURI.split(',')[1], 'base64').toString();
        const decodedMetadata = JSON.parse(decodedMetadataJSON);
        expect(decodedMetadata).to.deep.equal(metadata);
    });

    it('STAKER-115: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under a native token staking pool', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stake1Amount = ethers.parseEther('0.1');
        const stake2Amount = ethers.parseEther('3.14159');

        const stakerWithUser0 = staker.connect(user0);

        const amountStakedIntoPoolAtTime0 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInPoolAtTime0 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        const stake1Tx = await stakerWithUser0.stakeNative(nativePoolID, { value: stake1Amount });
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + stake1Amount);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeNative(nativePoolID, { value: stake2Amount });
        const stake2TxReceipt = await stake2Tx.wait();
        expect(stake2TxReceipt).to.not.be.null;
        const stake2Block = await ethers.provider.getBlock(stake2TxReceipt!.blockNumber);
        expect(stake2Block).to.not.be.null;

        const stake2PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime2 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInPoolAtTime2 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        expect(amountStakedIntoPoolAtTime2).to.equal(amountStakedIntoPoolAtTime1 + stake2Amount);
        expect(positionsInPoolAtTime2).to.equal(positionsInPoolAtTime1 + 1n);

        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstake1Tx = await stakerWithUser0.unstake(stake1PositionTokenID);
        const unstake1TxReceipt = await unstake1Tx.wait();
        expect(unstake1TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime3 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInPoolAtTime3 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        expect(amountStakedIntoPoolAtTime3).to.equal(amountStakedIntoPoolAtTime2 - stake1Amount);
        expect(positionsInPoolAtTime3).to.equal(positionsInPoolAtTime2 - 1n);

        await time.setNextBlockTimestamp(stake2Block!.timestamp + lockupSeconds);
        const unstake2Tx = await stakerWithUser0.unstake(stake2PositionTokenID);
        const unstake2TxReceipt = await unstake2Tx.wait();
        expect(unstake2TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime4 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInPoolAtTime4 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime3 - stake2Amount);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime3 - 1n);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime0);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime0);
    });

    it('STAKER-116 `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC20 staking pool', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stake1Amount = ethers.parseEther('0.1');
        const stake2Amount = ethers.parseEther('3.14159');

        await erc20.mint(await user0.getAddress(), stake1Amount + stake2Amount);
        await erc20.connect(user0).approve(await staker.getAddress(), stake1Amount + stake2Amount);

        const stakerWithUser0 = staker.connect(user0);

        const amountStakedIntoPoolAtTime0 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInPoolAtTime0 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        const stake1Tx = await stakerWithUser0.stakeERC20(erc20PoolID, stake1Amount);
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + stake1Amount);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeERC20(erc20PoolID, stake2Amount);
        const stake2TxReceipt = await stake2Tx.wait();
        expect(stake2TxReceipt).to.not.be.null;
        const stake2Block = await ethers.provider.getBlock(stake2TxReceipt!.blockNumber);
        expect(stake2Block).to.not.be.null;

        const stake2PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime2 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInPoolAtTime2 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedIntoPoolAtTime2).to.equal(amountStakedIntoPoolAtTime1 + stake2Amount);
        expect(positionsInPoolAtTime2).to.equal(positionsInPoolAtTime1 + 1n);

        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstake1Tx = await stakerWithUser0.unstake(stake1PositionTokenID);
        const unstake1TxReceipt = await unstake1Tx.wait();
        expect(unstake1TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime3 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInPoolAtTime3 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedIntoPoolAtTime3).to.equal(amountStakedIntoPoolAtTime2 - stake1Amount);
        expect(positionsInPoolAtTime3).to.equal(positionsInPoolAtTime2 - 1n);

        await time.setNextBlockTimestamp(stake2Block!.timestamp + lockupSeconds);
        const unstake2Tx = await stakerWithUser0.unstake(stake2PositionTokenID);
        const unstake2TxReceipt = await unstake2Tx.wait();
        expect(unstake2TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime4 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInPoolAtTime4 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime3 - stake2Amount);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime3 - 1n);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime0);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime0);
    });

    it('STAKER-117 `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC721 staking pool', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, erc721, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stake1TokenID = 258;
        const stake2TokenID = 259;

        await erc721.mint(await user0.getAddress(), stake1TokenID);
        await erc721.mint(await user0.getAddress(), stake2TokenID);
        await erc721.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        const stakerWithUser0 = staker.connect(user0);

        const amountStakedIntoPoolAtTime0 = await stakerWithUser0.CurrentAmountInPool(erc721PoolID);
        const positionsInPoolAtTime0 = await stakerWithUser0.CurrentPositionsInPool(erc721PoolID);

        const stake1Tx = await stakerWithUser0.stakeERC721(erc721PoolID, stake1TokenID);
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc721PoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc721PoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + 1n);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeERC721(erc721PoolID, stake2TokenID);
        const stake2TxReceipt = await stake2Tx.wait();
        expect(stake2TxReceipt).to.not.be.null;
        const stake2Block = await ethers.provider.getBlock(stake2TxReceipt!.blockNumber);
        expect(stake2Block).to.not.be.null;

        const stake2PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime2 = await stakerWithUser0.CurrentAmountInPool(erc721PoolID);
        const positionsInPoolAtTime2 = await stakerWithUser0.CurrentPositionsInPool(erc721PoolID);

        expect(amountStakedIntoPoolAtTime2).to.equal(amountStakedIntoPoolAtTime1 + 1n);
        expect(positionsInPoolAtTime2).to.equal(positionsInPoolAtTime1 + 1n);

        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstake1Tx = await stakerWithUser0.unstake(stake1PositionTokenID);
        const unstake1TxReceipt = await unstake1Tx.wait();
        expect(unstake1TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime3 = await stakerWithUser0.CurrentAmountInPool(erc721PoolID);
        const positionsInPoolAtTime3 = await stakerWithUser0.CurrentPositionsInPool(erc721PoolID);

        expect(amountStakedIntoPoolAtTime3).to.equal(amountStakedIntoPoolAtTime2 - 1n);
        expect(positionsInPoolAtTime3).to.equal(positionsInPoolAtTime2 - 1n);

        await time.setNextBlockTimestamp(stake2Block!.timestamp + lockupSeconds);
        const unstake2Tx = await stakerWithUser0.unstake(stake2PositionTokenID);
        const unstake2TxReceipt = await unstake2Tx.wait();
        expect(unstake2TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime4 = await stakerWithUser0.CurrentAmountInPool(erc721PoolID);
        const positionsInPoolAtTime4 = await stakerWithUser0.CurrentPositionsInPool(erc721PoolID);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime3 - 1n);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime3 - 1n);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime0);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime0);
    });

    it('STAKER-118: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC1155 staking pool', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, erc1155, erc1155TokenID, erc1155PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stake1Amount = ethers.parseEther('0.1');
        const stake2Amount = ethers.parseEther('3.14159');

        await erc1155.mint(await user0.getAddress(), erc1155TokenID, stake1Amount + stake2Amount);
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        const stakerWithUser0 = staker.connect(user0);

        const amountStakedIntoPoolAtTime0 = await stakerWithUser0.CurrentAmountInPool(erc1155PoolID);
        const positionsInPoolAtTime0 = await stakerWithUser0.CurrentPositionsInPool(erc1155PoolID);

        const stake1Tx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stake1Amount);
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc1155PoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc1155PoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + stake1Amount);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeERC1155(erc1155PoolID, stake2Amount);
        const stake2TxReceipt = await stake2Tx.wait();
        expect(stake2TxReceipt).to.not.be.null;
        const stake2Block = await ethers.provider.getBlock(stake2TxReceipt!.blockNumber);
        expect(stake2Block).to.not.be.null;

        const stake2PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime2 = await stakerWithUser0.CurrentAmountInPool(erc1155PoolID);
        const positionsInPoolAtTime2 = await stakerWithUser0.CurrentPositionsInPool(erc1155PoolID);

        expect(amountStakedIntoPoolAtTime2).to.equal(amountStakedIntoPoolAtTime1 + stake2Amount);
        expect(positionsInPoolAtTime2).to.equal(positionsInPoolAtTime1 + 1n);

        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstake1Tx = await stakerWithUser0.unstake(stake1PositionTokenID);
        const unstake1TxReceipt = await unstake1Tx.wait();
        expect(unstake1TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime3 = await stakerWithUser0.CurrentAmountInPool(erc1155PoolID);
        const positionsInPoolAtTime3 = await stakerWithUser0.CurrentPositionsInPool(erc1155PoolID);

        expect(amountStakedIntoPoolAtTime3).to.equal(amountStakedIntoPoolAtTime2 - stake1Amount);
        expect(positionsInPoolAtTime3).to.equal(positionsInPoolAtTime2 - 1n);

        await time.setNextBlockTimestamp(stake2Block!.timestamp + lockupSeconds);
        const unstake2Tx = await stakerWithUser0.unstake(stake2PositionTokenID);
        const unstake2TxReceipt = await unstake2Tx.wait();
        expect(unstake2TxReceipt).to.not.be.null;

        const amountStakedIntoPoolAtTime4 = await stakerWithUser0.CurrentAmountInPool(erc1155PoolID);
        const positionsInPoolAtTime4 = await stakerWithUser0.CurrentPositionsInPool(erc1155PoolID);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime3 - stake2Amount);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime3 - 1n);

        expect(amountStakedIntoPoolAtTime4).to.equal(amountStakedIntoPoolAtTime0);
        expect(positionsInPoolAtTime4).to.equal(positionsInPoolAtTime0);
    });

    it('STAKER-119: `CurrentAmountInPool` and `CurrentPositionsInPool` should not be affected by positions opened under other pools', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, erc20, erc20PoolID, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stake1Amount = ethers.parseEther('0.1');
        const stake2Amount = ethers.parseEther('3.14159');

        await erc20.mint(await user0.getAddress(), stake2Amount);
        await erc20.connect(user0).approve(await staker.getAddress(), stake2Amount);

        const stakerWithUser0 = staker.connect(user0);

        const amountStakedInNativePoolAtTime0 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInNativePoolAtTime0 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        const amountStakedInERC20PoolAtTime0 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInERC20PoolAtTime0 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        const stake1Tx = await stakerWithUser0.stakeNative(nativePoolID, { value: stake1Amount });
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedInNativePoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInNativePoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        const amountStakedInERC20PoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInERC20PoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedInNativePoolAtTime1).to.equal(amountStakedInNativePoolAtTime0 + stake1Amount);
        expect(positionsInNativePoolAtTime1).to.equal(positionsInNativePoolAtTime0 + 1n);

        expect(amountStakedInERC20PoolAtTime1).to.equal(amountStakedInERC20PoolAtTime0);
        expect(positionsInERC20PoolAtTime1).to.equal(positionsInERC20PoolAtTime0);

        const stake2Tx = await stakerWithUser0.stakeERC20(erc20PoolID, stake2Amount);
        const stake2TxReceipt = await stake2Tx.wait();
        expect(stake2TxReceipt).to.not.be.null;
        const stake2Block = await ethers.provider.getBlock(stake2TxReceipt!.blockNumber);
        expect(stake2Block).to.not.be.null;

        const stake2PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedInNativePoolAtTime2 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInNativePoolAtTime2 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        const amountStakedInERC20PoolAtTime2 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInERC20PoolAtTime2 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedInNativePoolAtTime2).to.equal(amountStakedInNativePoolAtTime1);
        expect(positionsInNativePoolAtTime2).to.equal(positionsInNativePoolAtTime1);

        expect(amountStakedInERC20PoolAtTime2).to.equal(amountStakedInERC20PoolAtTime1 + stake2Amount);
        expect(positionsInERC20PoolAtTime2).to.equal(positionsInERC20PoolAtTime1 + 1n);

        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstake1Tx = await stakerWithUser0.unstake(stake1PositionTokenID);
        const unstake1TxReceipt = await unstake1Tx.wait();
        expect(unstake1TxReceipt).to.not.be.null;

        const amountStakedInNativePoolAtTime3 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInNativePoolAtTime3 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        const amountStakedInERC20PoolAtTime3 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInERC20PoolAtTime3 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedInNativePoolAtTime3).to.equal(amountStakedInNativePoolAtTime2 - stake1Amount);
        expect(positionsInNativePoolAtTime3).to.equal(positionsInNativePoolAtTime2 - 1n);

        expect(amountStakedInERC20PoolAtTime3).to.equal(amountStakedInERC20PoolAtTime2);
        expect(positionsInERC20PoolAtTime3).to.equal(positionsInERC20PoolAtTime2);

        await time.setNextBlockTimestamp(stake2Block!.timestamp + lockupSeconds);
        const unstake2Tx = await stakerWithUser0.unstake(stake2PositionTokenID);
        const unstake2TxReceipt = await unstake2Tx.wait();
        expect(unstake2TxReceipt).to.not.be.null;

        const amountStakedInNativePoolAtTime4 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInNativePoolAtTime4 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        const amountStakedInERC20PoolAtTime4 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInERC20PoolAtTime4 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedInNativePoolAtTime4).to.equal(amountStakedInNativePoolAtTime3);
        expect(positionsInNativePoolAtTime4).to.equal(positionsInNativePoolAtTime3);

        expect(amountStakedInERC20PoolAtTime4).to.equal(amountStakedInERC20PoolAtTime3 - stake2Amount);
        expect(positionsInERC20PoolAtTime4).to.equal(positionsInERC20PoolAtTime3 - 1n);
    });
});
