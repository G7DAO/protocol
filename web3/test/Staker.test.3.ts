import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture, setNextBlockBaseFeePerGas, time } from '@nomicfoundation/hardhat-network-helpers';
import { setupStakingPoolsFixture, setupFixture } from './Staker.test.1';

describe('Staker', function () {
    it('STAKER-113: The ERC721 representing an ERC721 staking position have as its metadata URI a data URI representing an appropriate JSON object', async function () {
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

        // Stake ERC721 token
        const tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const metadataDataURI = await staker.tokenURI(positionTokenID);
        const metadataBase64 = metadataDataURI.split(',')[1];
        const metadata = JSON.parse(Buffer.from(metadataBase64, 'base64').toString('utf-8'));

        // Uncomment to see the image
        // console.log(metadata.image);

        expect(metadata).to.deep.equal({
            token_id: positionTokenID.toString(),
            image: metadata.image,
            result_version: 1,
            attributes: [
                {
                    trait_type: 'Pool ID',
                    value: erc721PoolID.toString(),
                },
                {
                    trait_type: 'Staked token ID',
                    value: tokenId.toString(),
                },
                {
                    trait_type: 'Staked at',
                    value: block!.timestamp,
                    display_type: 'number',
                },
                {
                    trait_type: 'Lockup expires at',
                    value: block!.timestamp + lockupSeconds,
                    display_type: 'number',
                },
            ],
        });
    });
    it('STAKER-114: The ERC721 representing an ERC20 staking position have as its metadata URI a data URI representing an appropriate JSON object', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const stakeAmount = 17n;

        // Mint ERC20 tokens to user0
        await erc20.mint(await user0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC20 tokens
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        // Stake ERC20 tokens
        const tx = await stakerWithUser0.stakeERC20(await user0.getAddress(), erc20PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;

        // Get the position token ID of the newly minted tokens
        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const metadataDataURI = await staker.tokenURI(positionTokenID);
        const metadataBase64 = metadataDataURI.split(',')[1];
        const metadata = JSON.parse(Buffer.from(metadataBase64, 'base64').toString('utf-8'));

        // Uncomment to see the image
        //console.log(metadata.image);

        expect(metadata).to.deep.equal({
            token_id: positionTokenID.toString(),
            image: metadata.image,
            result_version: 1,
            attributes: [
                {
                    trait_type: 'Pool ID',
                    value: erc20PoolID.toString(),
                },
                {
                    trait_type: 'Staked amount',
                    value: stakeAmount.toString(),
                },
                {
                    trait_type: 'Staked at',
                    value: block!.timestamp,
                    display_type: 'number',
                },
                {
                    trait_type: 'Lockup expires at',
                    value: block!.timestamp + lockupSeconds,
                    display_type: 'number',
                },
            ],
        });
    });
    it('STAKER-115: The ERC721 representing an ERC1155 staking position have as its metadata URI a data URI representing an appropriate JSON object', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, erc1155PoolID, erc1155 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const tokenId = 1n;
        const amountErc1155 = 1n;

        // Mint ERC1155 tokens to user0
        await erc1155.mint(await user0.getAddress(), tokenId, amountErc1155);

        // Approve staker contract to transfer ERC1155 tokens
        await erc1155.connect(user0).setApprovalForAll(await staker.getAddress(), true);

        // Stake ERC1155 tokens
        const tx = await stakerWithUser0.stakeERC1155(await user0.getAddress(), erc1155PoolID, amountErc1155);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const metadataDataURI = await staker.tokenURI(positionTokenID);
        const metadataBase64 = metadataDataURI.split(',')[1];
        const metadata = JSON.parse(Buffer.from(metadataBase64, 'base64').toString('utf-8'));

        // Uncomment to get image and paste it in the browser to test! (ERC1155)
        // console.log(metadata.image);

        expect(metadata).to.deep.equal({
            token_id: positionTokenID.toString(),
            image: metadata.image,
            result_version: 1,
            attributes: [
                {
                    trait_type: 'Pool ID',
                    value: erc1155PoolID.toString(),
                },
                {
                    trait_type: 'Staked amount',
                    value: amountErc1155.toString(),
                },
                {
                    trait_type: 'Staked at',
                    value: block!.timestamp,
                    display_type: 'number',
                },
                {
                    trait_type: 'Lockup expires at',
                    value: block!.timestamp + lockupSeconds,
                    display_type: 'number',
                },
            ],
        });
    });
    it('STAKER-116: The ERC721 representing a native staking position have as its metadata URI a data URI representing an appropriate JSON object', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);
        const amountNative = 10n;

        // Stake native tokens
        const tx = await stakerWithUser0.stakeNative(user0.getAddress(), nativePoolID, { value: amountNative });
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;
        const block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        expect(block).to.not.be.null;

        // Get the position token ID of the newly minted token
        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const metadataDataURI = await staker.tokenURI(positionTokenID);
        const metadataBase64 = metadataDataURI.split(',')[1];
        const metadata = JSON.parse(Buffer.from(metadataBase64, 'base64').toString('utf-8'));

        // Uncomment to see the image
        // console.log(metadata.image);

        expect(metadata).to.deep.equal({
            token_id: positionTokenID.toString(),
            image: metadata.image,
            result_version: 1,
            attributes: [
                {
                    trait_type: 'Pool ID',
                    value: nativePoolID.toString(),
                },
                {
                    trait_type: 'Staked amount',
                    value: amountNative.toString(),
                },
                {
                    trait_type: 'Staked at',
                    value: block!.timestamp,
                    display_type: 'number',
                },
                {
                    trait_type: 'Lockup expires at',
                    value: block!.timestamp + lockupSeconds,
                    display_type: 'number',
                },
            ],
        });
    });

    it('STAKER-117: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under a native token staking pool', async function () {
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

        const stake1Tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stake1Amount });
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(nativePoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(nativePoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + stake1Amount);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stake2Amount });
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

    it('STAKER-118 `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC20 staking pool', async function () {
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

        const stake1Tx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stake1Amount);
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc20PoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc20PoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + stake1Amount);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stake2Amount);
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

    it('STAKER-119 `CurrentAmountInPool` and `CurrentPositionsInPool` should accurate reflect the amount of tokens and number of positions currently open under an ERC721 staking pool', async function () {
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

        const stake1Tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, stake1TokenID);
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc721PoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc721PoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + 1n);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeERC721(user0, erc721PoolID, stake2TokenID);
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

    it('STAKER-120: `CurrentAmountInPool` and `CurrentPositionsInPool` should accurately reflect the amount of tokens and number of positions currently open under an ERC1155 staking pool', async function () {
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

        const stake1Tx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stake1Amount);
        const stake1TxReceipt = await stake1Tx.wait();
        expect(stake1TxReceipt).to.not.be.null;
        const stake1Block = await ethers.provider.getBlock(stake1TxReceipt!.blockNumber);
        expect(stake1Block).to.not.be.null;

        const stake1PositionTokenID = (await staker.TotalPositions()) - 1n;

        const amountStakedIntoPoolAtTime1 = await stakerWithUser0.CurrentAmountInPool(erc1155PoolID);
        const positionsInPoolAtTime1 = await stakerWithUser0.CurrentPositionsInPool(erc1155PoolID);

        expect(amountStakedIntoPoolAtTime1).to.equal(amountStakedIntoPoolAtTime0 + stake1Amount);
        expect(positionsInPoolAtTime1).to.equal(positionsInPoolAtTime0 + 1n);

        const stake2Tx = await stakerWithUser0.stakeERC1155(user0, erc1155PoolID, stake2Amount);
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

    it('STAKER-121: `CurrentAmountInPool` and `CurrentPositionsInPool` should not be affected by positions opened under other pools', async function () {
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

        const stake1Tx = await stakerWithUser0.stakeNative(user0, nativePoolID, { value: stake1Amount });
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

        const stake2Tx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stake2Amount);
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

    it('`STAKER-122`: For pools without cooldowns, changes to the `lockupSeconds` setting apply to all unstaked users', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, stakerWithAdmin0, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = ethers.parseEther('79');

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);

        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        const stakePositionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithAdmin0.updatePoolConfiguration(erc20PoolID, false, false, true, 2 * lockupSeconds, false, 0);

        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);
        await expect(stakerWithUser0.unstake(stakePositionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + 2 * lockupSeconds);

        await time.setNextBlockTimestamp(stakeBlock!.timestamp + 2 * lockupSeconds);
        await stakerWithUser0.unstake(stakePositionTokenID);
        await expect(stakerWithUser0.ownerOf(stakePositionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(stakePositionTokenID);
    });

    it('`STAKER-123`: For pools with cooldowns, for users who have not yet initiated a cooldown, changes to the `lockupSeconds` setting apply to determine when it is possible for them to `initiateUnstake`', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1;

        const { staker, stakerWithAdmin0, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = ethers.parseEther('79');

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);

        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        const stakePositionTokenID = (await staker.TotalPositions()) - 1n;

        await stakerWithAdmin0.updatePoolConfiguration(erc20PoolID, false, false, true, 2 * lockupSeconds, false, 0);

        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);
        await expect(stakerWithUser0.initiateUnstake(stakePositionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + 2 * lockupSeconds);

        await time.setNextBlockTimestamp(stakeBlock!.timestamp + 2 * lockupSeconds);
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(stakePositionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        const positionAfter = await staker.Positions(stakePositionTokenID);
        expect(positionAfter.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);
    });

    it('`STAKER-124`: For pools with cooldowns, for users who have initiated a cooldown already, changes to the `cooldownSeconds` setting apply to their final unstake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1;

        const { staker, stakerWithAdmin0, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = ethers.parseEther('79');

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);

        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        const stakePositionTokenID = (await staker.TotalPositions()) - 1n;

        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(stakePositionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        const positionAfter = await staker.Positions(stakePositionTokenID);
        expect(positionAfter.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);

        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + cooldownSeconds);
        await stakerWithAdmin0.updatePoolConfiguration(
            erc20PoolID,
            false,
            false,
            false,
            0,
            true,
            1000 * cooldownSeconds
        );

        await expect(stakerWithUser0.unstake(stakePositionTokenID))
            .to.be.revertedWithCustomError(staker, 'InitiateUnstakeFirst')
            .withArgs(1000 * cooldownSeconds);

        await time.setNextBlockTimestamp(initiateUnstakeBlock!.timestamp + 1000 * cooldownSeconds);
        await stakerWithUser0.unstake(stakePositionTokenID);
        await expect(stakerWithUser0.ownerOf(stakePositionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(stakePositionTokenID);
    });

    it('`STAKER-125`: If an administrator changes `transferable` from `true` to `false`, position tokens are no longer transferable even if they were transferable, and were transferred! before', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1;

        const { staker, stakerWithAdmin0, user0, user1, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = ethers.parseEther('79');

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);

        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        const stakePositionTokenID = (await staker.TotalPositions()) - 1n;

        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user0.getAddress());
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), stakePositionTokenID);
        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user1.getAddress());

        await stakerWithAdmin0.updatePoolConfiguration(erc20PoolID, true, false, false, 0, false, 0);
        await expect(
            stakerWithUser1.transferFrom(await user1.getAddress(), await user0.getAddress(), stakePositionTokenID)
        )
            .to.be.revertedWithCustomError(staker, 'PositionNotTransferable')
            .withArgs(stakePositionTokenID);
        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user1.getAddress());
    });

    it('`STAKER-126`: If an administrator changes `transferable` from `true` to `false`, position tokens that were not transferable before become transferable if so configured', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1;

        const { staker, stakerWithAdmin0, user0, user1, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakeAmount = ethers.parseEther('79');

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);
        const stakerWithUser1 = staker.connect(user1);

        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        const stakePositionTokenID = (await staker.TotalPositions()) - 1n;

        await expect(
            stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), stakePositionTokenID)
        )
            .to.be.revertedWithCustomError(staker, 'PositionNotTransferable')
            .withArgs(stakePositionTokenID);
        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user0.getAddress());

        await stakerWithAdmin0.updatePoolConfiguration(erc20PoolID, true, true, false, 0, false, 0);

        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user0.getAddress());
        await stakerWithUser0.transferFrom(await user0.getAddress(), await user1.getAddress(), stakePositionTokenID);
        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user1.getAddress());
    });

    it('`STAKER-127`: Position tokens from transferable pools can be staked back into the `Staker`', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1;

        const { staker, stakerWithAdmin0, user0, erc20, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        await stakerWithAdmin0.createPool(
            721,
            await staker.getAddress(),
            0,
            transferable,
            lockupSeconds,
            cooldownSeconds,
            stakerWithAdmin0
        );
        const stakerPositionPoolID = (await staker.TotalPools()) - 1n;
        const stakerPositionPool = await staker.Pools(stakerPositionPoolID);

        expect(stakerPositionPool.tokenType).to.equal(721);
        expect(stakerPositionPool.tokenAddress).to.equal(await staker.getAddress());
        expect(stakerPositionPool.tokenID).to.equal(0);
        expect(stakerPositionPool.transferable).to.be.true;
        expect(stakerPositionPool.lockupSeconds).to.equal(lockupSeconds);
        expect(stakerPositionPool.cooldownSeconds).to.equal(cooldownSeconds);

        const stakeAmount = ethers.parseEther('79');

        await erc20.mint(await user0.getAddress(), stakeAmount);
        await erc20.connect(user0).approve(await staker.getAddress(), stakeAmount);

        const stakerWithUser0 = staker.connect(user0);

        const stakeTx = await stakerWithUser0.stakeERC20(user0, erc20PoolID, stakeAmount);
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;
        const stakeBlock = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        expect(stakeBlock).to.not.be.null;

        const stakePositionTokenID = (await staker.TotalPositions()) - 1n;
        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await user0.getAddress());

        await stakerWithUser0.approve(await staker.getAddress(), stakePositionTokenID);
        await stakerWithUser0.stakeERC721(user0, stakerPositionPoolID, stakePositionTokenID);
        expect(await staker.ownerOf(stakePositionTokenID)).to.equal(await staker.getAddress());

        const newPositionTokenID = (await staker.TotalPositions()) - 1n;
        const newPosition = await staker.Positions(newPositionTokenID);

        expect(newPosition.poolID).to.equal(stakerPositionPoolID);
        expect(newPosition.amountOrTokenID).to.equal(stakePositionTokenID);
    });

    it('`STAKER-128`: A user must call the correct `stake*` method to stake their tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 1;

        const { staker, stakerWithAdmin0, user0, nativePoolID, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        await expect(stakerWithUser0.stakeNative(user0, erc20PoolID, { value: 1 }))
            .to.be.revertedWithCustomError(staker, 'IncorrectTokenType')
            .withArgs(erc20PoolID, 20, 1);

        await expect(stakerWithUser0.stakeERC20(user0, nativePoolID, 1))
            .to.be.revertedWithCustomError(staker, 'IncorrectTokenType')
            .withArgs(nativePoolID, 1, 20);

        await expect(stakerWithUser0.stakeERC721(user0, erc20PoolID, 1))
            .to.be.revertedWithCustomError(staker, 'IncorrectTokenType')
            .withArgs(erc20PoolID, 20, 721);

        await expect(stakerWithUser0.stakeERC1155(user0, erc20PoolID, 1))
            .to.be.revertedWithCustomError(staker, 'IncorrectTokenType')
            .withArgs(erc20PoolID, 20, 1155);
    });

    it('`STAKER-129`: When a user calls `stakeNative`, they must stake a non-zero number of tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, nativePoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        await expect(stakerWithUser0.stakeNative(user0, nativePoolID, { value: 0 })).to.be.revertedWithCustomError(
            staker,
            'NothingToStake'
        );
    });

    it('`STAKER-130`: When a user calls `stakeERC20`, they must stake a non-zero number of tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        await expect(stakerWithUser0.stakeERC20(user0, erc20PoolID, 0)).to.be.revertedWithCustomError(
            staker,
            'NothingToStake'
        );
    });

    it('`STAKER-131`: When a user calls `stakeERC1155`, they must stake a non-zero number of tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker, user0, erc1155PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithUser0 = staker.connect(user0);

        await expect(stakerWithUser0.stakeERC1155(user0, erc1155PoolID, 0)).to.be.revertedWithCustomError(
            staker,
            'NothingToStake'
        );
    });

    it('`STAKER-132`: Calls to `tokenURI` for position tokens of unstaked positions should revert', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 300;

        const { staker } = await loadFixture(setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds));

        const nonexistentPositionTokenID = (await staker.TotalPositions()) + 1n;

        await expect(staker.tokenURI(nonexistentPositionTokenID))
            .to.be.revertedWithCustomError(staker, 'ERC721NonexistentToken')
            .withArgs(nonexistentPositionTokenID);
    });

    it('`STAKER-133`: If a user who holds a position in a pool with `cooldownSeconds = 0` calls `initiateUnstake` after the lockup period has expired, the `unstakeInitiatedAt` parameter of the position is updated', async function () {
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

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to when the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds);

        // Initiate the unstake
        const initiateUnstakeTx = await stakerWithUser0.initiateUnstake(positionTokenID);
        const initiateUnstakeTxReceipt = await initiateUnstakeTx.wait();
        expect(initiateUnstakeTxReceipt).to.not.be.null;
        const initiateUnstakeBlock = await ethers.provider.getBlock(initiateUnstakeTxReceipt!.blockNumber);
        expect(initiateUnstakeBlock).to.not.be.null;

        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(initiateUnstakeBlock!.timestamp);
    });

    it('`STAKER-134`: If a user who holds a position in a pool with `cooldownSeconds = 0` calls `initiateUnstake` before the lockup period has expired, the transaction reverts', async function () {
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

        // Ensure the position holder is user0
        expect(await staker.ownerOf(positionTokenID)).to.equal(await user0.getAddress());

        // Fast-forward time to just before the lockup period expires
        await time.setNextBlockTimestamp(stakeBlock!.timestamp + lockupSeconds - 1);

        await expect(stakerWithUser0.initiateUnstake(positionTokenID))
            .to.be.revertedWithCustomError(staker, 'LockupNotExpired')
            .withArgs(stakeBlock!.timestamp + lockupSeconds);

        const position = await staker.Positions(positionTokenID);
        expect(position.unstakeInitiatedAt).to.equal(0);
    });

    it('`STAKER-133`: If an admin pool who want to stake native tokens for another user should successfully stake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID, admin0 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);

        const stakeAmount = ethers.parseEther('1');
        const stakeTx = await stakerWithAdmin0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());

        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-134`: If an admin pool who want to stake native tokens for another user should successfully stake - non transferable pool', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID, admin0 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);

        const stakeAmount = ethers.parseEther('1');
        const stakeTx = await stakerWithAdmin0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());

        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-135`: If an admin pool who want to stake erc20 tokens for another user should successfully stake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, admin0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);
        const stakeAmount = 17n;

        // Mint ERC20 token to admin0
        await erc20.mint(await admin0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC721 token
        await erc20.connect(admin0).approve(await staker.getAddress(), stakeAmount);
        const stakeTx = await stakerWithAdmin0.stakeERC20(user0, erc20PoolID, stakeAmount);

        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-136`: If an admin pool who want to stake erc20 tokens for another user should successfully stake - non transferable pool', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, admin0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);
        const stakeAmount = 17n;

        // Mint ERC20 token to admin0
        await erc20.mint(await admin0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC721 token
        await erc20.connect(admin0).approve(await staker.getAddress(), stakeAmount);
        const stakeTx = await stakerWithAdmin0.stakeERC20(user0, erc20PoolID, stakeAmount);

        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-137`: If a staker user who want to stake erc721 tokens for another user should successfully stake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, admin0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const tokenId = 1n;

        // Mint ERC721 token to user0
        await erc721.mint(await admin0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(admin0).approve(await staker.getAddress(), tokenId);

        const stakerWithAdmin0 = staker.connect(admin0);
        const tx = await stakerWithAdmin0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        const user0Balance = await staker.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-138`: If a staker user who want to stake erc721 tokens for another user should successfully stake - non transferable pool', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, admin0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const tokenId = 1n;

        // Mint ERC721 token to user0
        await erc721.mint(await admin0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(admin0).approve(await staker.getAddress(), tokenId);

        const stakerWithAdmin0 = staker.connect(admin0);
        const tx = await stakerWithAdmin0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        const user0Balance = await staker.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-139`: If a staker user who want to stake erc1155 tokens for another user should successfully stake', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, admin0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);
        const stakeAmount = 17n;

        await erc1155.mint(await admin0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(admin0).setApprovalForAll(await staker.getAddress(), true);

        const tx = await stakerWithAdmin0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        const user0Balance = await staker.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-140`: If a staker user who want to stake erc1155 tokens for another user should successfully stake - non transferable', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, admin0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);
        const stakeAmount = 17n;

        await erc1155.mint(await admin0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(admin0).setApprovalForAll(await staker.getAddress(), true);

        const tx = await stakerWithAdmin0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        const user0Balance = await staker.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);
    });

    it('`STAKER-141`: As an admin pool I can unstake any position in the pool that still active', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID, admin0 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);

        const stakeAmount = ethers.parseEther('1');
        const stakeTx = await stakerWithAdmin0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);

        const user0BalanceOfNativeTokenBefore = await ethers.provider.getBalance(await user0.getAddress());

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstakeTx = await stakerWithAdmin0.unstake(positionTokenID);

        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), nativePoolID, stakeAmount);

        await unstakeTx.wait();

        const user0BalanceOfPositionTokenAfter = await stakerWithAdmin0.balanceOf(await user0.getAddress());


        expect(user0BalanceOfPositionTokenAfter).to.equal(0n);

        const user0BalanceOfNativeTokensAfter = await ethers.provider.getBalance(await user0.getAddress());

        expect(user0BalanceOfNativeTokensAfter).to.equal(stakeAmount + user0BalanceOfNativeTokenBefore);
    });

    it('`STAKER-142`: As an admin pool I can unstake any position in the pool that still active even if the pool - non transferable', async function () {
        const transferable = false;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID, admin0 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);

        const stakeAmount = ethers.parseEther('1');
        const stakeTx = await stakerWithAdmin0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstakeTx = await stakerWithAdmin0.unstake(positionTokenID);

        await expect(unstakeTx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user0.getAddress(), nativePoolID, stakeAmount);
        const user0BalanceAfter = await stakerWithAdmin0.balanceOf(await user0.getAddress());

        expect(user0BalanceAfter).to.equal(0n);
    });

    it('`STAKER-143`: As an admin pool unstake should works even if the position holder were transferred', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID, admin0, user1 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);

        const stakeAmount = ethers.parseEther('1');
        const stakeTx = await stakerWithAdmin0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();
        const user0Balance = await stakerWithAdmin0.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);

        const stakerWithUser0 = staker.connect(user0);
        const transferTrx = await stakerWithUser0.transferFrom(
            await user0.getAddress(),
            await user1.getAddress(),
            positionTokenID
        );
        await transferTrx.wait();

        const user0BalanceAfter = await stakerWithAdmin0.balanceOf(await user0.getAddress());
        expect(user0BalanceAfter).to.equal(0n);

        const initiateUnstakeTx = await stakerWithAdmin0.initiateUnstake(positionTokenID);
        await expect(initiateUnstakeTx)
            .to.emit(staker, 'UnstakeInitiated')
            .withArgs(positionTokenID, await user1.getAddress());

        await initiateUnstakeTx.wait();

        // the event will have the user1 address because the position was transferred
        const tx = await stakerWithAdmin0.unstake(positionTokenID);
        await expect(tx)
            .to.emit(staker, 'Unstaked')
            .withArgs(positionTokenID, await user1.getAddress(), nativePoolID, stakeAmount);

        await tx.wait();
        const user1Balance = await stakerWithAdmin0.balanceOf(await user1.getAddress());
        expect(user1Balance).to.equal(0n);
    });

    it('`STAKER-144`: As an admin pool I can unstake any position the owner of the position should recieve back the native tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, user0, nativePoolID, admin0 } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );
        const stakerWithAdmin0 = staker.connect(admin0);

        const stakeAmount = ethers.parseEther('1');
        const stakeTx = await stakerWithAdmin0.stakeNative(user0, nativePoolID, { value: stakeAmount });
        const stakeTxReceipt = await stakeTx.wait();

        const user0BalanceOfNativeTokenBefore = await ethers.provider.getBalance(await user0.getAddress());
        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstakeTx = await stakerWithAdmin0.unstake(positionTokenID);
        await unstakeTx.wait();

        const user0BalanceOfNativeTokensAfter = await ethers.provider.getBalance(await user0.getAddress());
        expect(user0BalanceOfNativeTokensAfter).to.equal(stakeAmount + user0BalanceOfNativeTokenBefore);
    });

    it('`STAKER-145`: As an admin pool I can unstake any position the owner of the position should recieve back the erc20 tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc20, user0, admin0, erc20PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const stakerWithAdmin0 = staker.connect(admin0);
        const stakeAmount = 17n;
        const extraAmount = 15n;

        // Mint ERC20 token to admin0
        await erc20.mint(await admin0.getAddress(), stakeAmount);

        // Approve staker contract to transfer ERC721 token
        await erc20.connect(admin0).approve(await staker.getAddress(), stakeAmount);
        const stakeTx = await stakerWithAdmin0.stakeERC20(user0, erc20PoolID, stakeAmount);

        const stakeTxReceipt = await stakeTx.wait();
        expect(stakeTxReceipt).to.not.be.null;

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(stakeTxReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);
        const unstakeTx = await stakerWithAdmin0.unstake(positionTokenID);
        await unstakeTx.wait();

        const user0BalanceOfErc20After = await erc20.balanceOf(await user0.getAddress());
        expect(user0BalanceOfErc20After).to.equal(stakeAmount);
    });

    it('`STAKER-146`: As an admin pool I can unstake any position the owner of the position should recieve back the erc721 tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc721, user0, admin0, erc721PoolID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );

        const tokenId = 1n;

        // Mint ERC721 token to user0
        await erc721.mint(await admin0.getAddress(), tokenId);

        // Approve staker contract to transfer ERC721 token
        await erc721.connect(admin0).approve(await staker.getAddress(), tokenId);

        const stakerWithAdmin0 = staker.connect(admin0);
        const tx = await stakerWithAdmin0.stakeERC721(user0, erc721PoolID, tokenId);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        const user0BalanceOfErc721AfterStake = await erc721.balanceOf(await user0.getAddress());
        expect(user0BalanceOfErc721AfterStake).to.equal(0n);

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);

        const unstakeTx = await stakerWithAdmin0.unstake(positionTokenID);
        await unstakeTx.wait();

        const user0BalanceOfErc721AfterUnstake = await erc721.balanceOf(await user0.getAddress());
        expect(user0BalanceOfErc721AfterUnstake).to.equal(1n);
    });

    it('`STAKER-147`: As an admin pool I can unstake any position the owner of the position should recieve back the native erc1155 tokens', async function () {
        const transferable = true;
        const lockupSeconds = 3600;
        const cooldownSeconds = 0;

        const { staker, erc1155, user0, admin0, erc1155PoolID, erc1155TokenID } = await loadFixture(
            setupStakingPoolsFixture(transferable, lockupSeconds, cooldownSeconds)
        );


        const stakerWithAdmin0 = staker.connect(admin0);
        const stakeAmount = 17n;

        await erc1155.mint(await admin0.getAddress(), erc1155TokenID, stakeAmount);
        await erc1155.connect(admin0).setApprovalForAll(await staker.getAddress(), true);

        const tx = await stakerWithAdmin0.stakeERC1155(user0, erc1155PoolID, stakeAmount);
        const txReceipt = await tx.wait();
        expect(txReceipt).to.not.be.null;

        const user0BalanceOfErc1155AfterStake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        expect(user0BalanceOfErc1155AfterStake).to.equal(0n);

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const stake1Block = await ethers.provider.getBlock(txReceipt!.blockNumber);
        await time.setNextBlockTimestamp(stake1Block!.timestamp + lockupSeconds);

        const unstakeTx = await stakerWithAdmin0.unstake(positionTokenID);
        await unstakeTx.wait();

        const user0BalanceOfErc1155AfterUnstake = await erc1155.balanceOf(await user0.getAddress(), erc1155TokenID);
        expect(user0BalanceOfErc1155AfterUnstake).to.equal(stakeAmount);
    });

    it('STAKER-148: Any account should be able to create a staking pool for native tokens using 0 address', async function () {
        const { staker, anyone, user0 } = await loadFixture(setupFixture);
        const stakerWithAnyone = staker.connect(anyone);


        const tx = await stakerWithAnyone.createPool(
            await stakerWithAnyone.NATIVE_TOKEN_TYPE(),
            ethers.ZeroAddress,
            0,
            true,
            0,
            0,
            ethers.ZeroAddress
        );

        await expect(tx)
            .to.emit(staker, 'StakingPoolCreated')
            .withArgs(
                0, // poolID should be 0 for the first pool
                await stakerWithAnyone.NATIVE_TOKEN_TYPE(),
                ethers.ZeroAddress,
                0
            );

        await expect(tx)
            .to.emit(staker, 'StakingPoolConfigured')
            .withArgs(0, ethers.ZeroAddress, true, 0, 0);

        const pool = await staker.Pools(0);
        expect(pool.tokenType).to.equal(await stakerWithAnyone.NATIVE_TOKEN_TYPE());
        expect(pool.tokenAddress).to.equal(ethers.ZeroAddress);
        expect(pool.tokenID).to.equal(0);
        expect(pool.transferable).to.equal(true);
        expect(pool.lockupSeconds).to.equal(0);
        expect(pool.cooldownSeconds).to.equal(0);
        expect(pool.administrator).to.equal(ethers.ZeroAddress);

        const stakeAmount = 17n;
        const positionPoolID = (await staker.TotalPools()) - 1n;


        const stakeTrx = await stakerWithAnyone.stakeNative(user0, positionPoolID, { value: stakeAmount });

        await expect(stakeTrx)
            .to.emit(stakerWithAnyone, 'Staked')
            .withArgs(0, await user0.getAddress(), positionPoolID, stakeAmount);

        await stakeTrx.wait();

        const user0Balance = await staker.balanceOf(await user0.getAddress());
        expect(user0Balance).to.equal(1n);

        const positionTokenID = (await staker.TotalPositions()) - 1n;
        const position = await staker.Positions(positionTokenID);
        expect(position.poolID).to.equal(0);

        // as pool with address 0 administrator, anyone can stake or unstake for you as final user - must be reverted
        await (expect(stakerWithAnyone.unstake(positionTokenID)).to.be.revertedWithCustomError(stakerWithAnyone, 'UnauthorizedForPosition')
            .withArgs(await user0.getAddress(), await anyone.getAddress()));

    });
});
