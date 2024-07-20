import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { setupStakingPoolsFixture } from './Staker.test.1';

describe('Staker', function () {
    it('STAKER-113: If an ERC721 staking pool has a cooldown, if a position holder has successfully initiated an unstake, and if the cooldown period has expired, then a position non-holder cannot complete the unstake, even if they were the original creator of the position', async function () {
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
});
