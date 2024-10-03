import { ethers } from 'hardhat';
import { expect } from 'chai';
import { HardhatEthersSigner } from '../helpers/type';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployDropperV3Contracts } from './fixture/dropperV3.fixture';
import { dropperClaimMessageHash } from './helpers/utils/dropperV3Signer';
import { TerminusFacet, DropperV3Facet, MockERC1155, MockERC20, MockERC721 } from '../typechain-types';




describe("DropperV3Facet", async function () {

    let admin0: HardhatEthersSigner;
    let admin1: HardhatEthersSigner;
    let user0: HardhatEthersSigner;
    let user1: HardhatEthersSigner;

    let terminusFacet: TerminusFacet;
    let dropperV3Facet: DropperV3Facet;

    let mockERC721: MockERC721;
    let mockERC20: MockERC20;
    let mockERC1155: MockERC1155;

    let authorizationTokenAddress: string;

    const authorizationPoolId = 1n;
    const tokenId = 1n;
    const InitialTokenBalance = ethers.parseEther('1000');

    before(async function () {
        [admin1, user0, user1] = await ethers.getSigners();
    })

    beforeEach(async function () {
        const contracts = await loadFixture(deployDropperV3Contracts);

        admin0 = contracts.admin0;
        terminusFacet = contracts.terminusDiamond;
        dropperV3Facet = contracts.dropperV3Facet;
        mockERC1155 = contracts.erc1155;
        mockERC20 = contracts.erc20;
        mockERC721 = contracts.erc721;

        authorizationTokenAddress = await terminusFacet.getAddress();

    })

    describe('CreateDrop function', async function () {

        it('DropperV3-1: Address should be Proper', async function () {
            expect(await terminusFacet.getAddress()).to.be.properAddress;
            expect(await dropperV3Facet.getAddress()).to.be.properAddress;
        })

        it("DropperV3-2: Create a new drop with Native token type", async function () {
            const tokenType = 1;
            const maxNumberOfTokens = 100;
            const amount = 0;
            const uri = "https://example.com/metadata";

            const tx = await dropperV3Facet.createDrop(
                tokenType,
                ethers.ZeroAddress,
                tokenId,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0.1") } // If the function is payable, send some Ether
            );

            await tx.wait();

            const drop = await dropperV3Facet.getDrop(1); // Assuming this function exists
            expect(drop.tokenType).to.equal(tokenType);
            expect(drop.tokenAddress).to.equal(ethers.ZeroAddress);
            expect(drop.amount).to.equal(amount);
        });

        it("DropperV3-3: Create a new drop with ERC20 token type", async function () {
            const tokenType = 20;
            const maxNumberOfTokens = 100;
            const amount = 0;
            const erc20Address = await mockERC20.getAddress();
            const uri = "https://example.com/metadata";

            const tx = await dropperV3Facet.createDrop(
                tokenType,
                erc20Address,
                tokenId,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0") }
            );

            await tx.wait();

            const drop = await dropperV3Facet.getDrop(1); // Assuming this function exists
            expect(drop.tokenType).to.equal(tokenType);
            expect(drop.tokenAddress).to.equal(erc20Address);
            expect(drop.amount).to.equal(amount);
            expect(drop.maxNumberOfTokens).to.equal(maxNumberOfTokens);

        });

        it("DropperV3-4: Create a new drop with ERC721 token type", async function () {
            const tokenType = 721;
            const maxNumberOfTokens = 100;
            const amount = 0;
            const erc721Address = await mockERC721.getAddress();
            const uri = "https://example.com/metadata";

            const tx = await dropperV3Facet.createDrop(
                tokenType,
                erc721Address,
                0,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0") }
            );

            await tx.wait();

            const drop = await dropperV3Facet.getDrop(1); // Assuming this function exists
            expect(drop.tokenType).to.equal(tokenType);
            expect(drop.tokenAddress).to.equal(erc721Address);
            expect(drop.amount).to.equal(amount);
            expect(drop.maxNumberOfTokens).to.equal(maxNumberOfTokens);

        });

        it("DropperV3-5: Create a new drop with ERC1155 token type", async function () {
            const tokenType = 1155;
            const maxNumberOfTokens = 100;
            const amount = 0;
            const erc1155Address = await mockERC1155.getAddress();
            const uri = "https://example.com/metadata";

            const tx = await dropperV3Facet.createDrop(
                tokenType,
                erc1155Address,
                tokenId,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0") }
            );

            await tx.wait();

            const drop = await dropperV3Facet.getDrop(1); // Assuming this function exists
            expect(drop.tokenType).to.equal(tokenType);
            expect(drop.tokenAddress).to.equal(erc1155Address);
            expect(drop.amount).to.equal(amount);
            expect(drop.maxNumberOfTokens).to.equal(maxNumberOfTokens);

        });

        it("DropperV3-6: Revert if the token type is unknown", async function () {
            const invalidTokenType = 999; // Invalid token type
            const amount = 0;
            const maxNumberOfTokens = 100;
            const uri = "https://example.com/metadata";

            await expect(
                dropperV3Facet.connect(admin0).createDrop(
                    invalidTokenType,
                    ethers.ZeroAddress,
                    tokenId,
                    amount,
                    authorizationTokenAddress,
                    authorizationPoolId,
                    maxNumberOfTokens,
                    uri,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Dropper: createDrop -- Unknown token type");
        });

        it("DropperV3-7: Revert if the token type is 721 and tokenId not zero", async function () {
            const tokenType = 721; // Invalid token type
            const amount = 0;
            const maxNumberOfTokens = 100;
            const uri = "https://example.com/metadata";

            await expect(
                dropperV3Facet.connect(admin0).createDrop(
                    tokenType,
                    ethers.ZeroAddress,
                    tokenId,
                    amount,
                    authorizationTokenAddress,
                    authorizationPoolId,
                    maxNumberOfTokens,
                    uri,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Dropper: createDrop -- TokenId should be zero for ERC721 drop.");
        });

    });

    describe("Claim function", async function () {

        let chainId: number;
        let dropperV3Address: string;

        beforeEach(async function () {
            const tokenType = 1;
            const maxNumberOfTokens = 100;
            const amount = 0;
            const uri = "https://example.com/metadata";

            const tx = await dropperV3Facet.createDrop(
                tokenType,
                ethers.ZeroAddress,
                tokenId,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0.00000000000000005") } // If the function is payable, send some Ether
            );

            await tx.wait();

            const erc20Address = await mockERC20.getAddress();

            const e20tx = await dropperV3Facet.createDrop(
                20,
                erc20Address,
                tokenId,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0") }
            );

            await e20tx.wait();

            const erc721Address = await mockERC721.getAddress();

            const e721tx = await dropperV3Facet.createDrop(
                721,
                erc721Address,
                0,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0") }
            );

            await e721tx.wait();

            const erc1155Address = await mockERC1155.getAddress();

            const e1155tx = await dropperV3Facet.createDrop(
                1155,
                erc1155Address,
                tokenId,
                amount,
                authorizationTokenAddress,
                authorizationPoolId,
                maxNumberOfTokens,
                uri,
                { value: ethers.parseEther("0") }
            );

            await e1155tx.wait();
            const dropperAddress = dropperV3Facet.getAddress()

            await mockERC721.mint(dropperAddress, tokenId);
            await mockERC20.mint(dropperAddress, InitialTokenBalance);
            await mockERC1155.mint(dropperAddress, tokenId, InitialTokenBalance);

            const chainIdBigInt = await admin0.provider.getNetwork().then((network) => network.chainId);
            chainId = Number(chainIdBigInt);

            dropperV3Address = await dropperV3Facet.getAddress();
        });


        it('DropperV3-8: Claim Native Token', async function () {

            const dropId = 1;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            const tx = await dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            );

            await tx.wait();

            const dropClaimed = await dropperV3Facet.claimStatus(dropId, requestID);
            const dropToken = await dropperV3Facet.getDrop(dropId);
            expect(dropClaimed).to.be.true;
            expect(dropToken.claimCount).to.be.equal(amount);
        });

        it('DropperV3-9: Claim ERC20 Token', async function () {

            const dropId = 2;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            const tx = await dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            );

            await tx.wait();

            const dropClaimed = await dropperV3Facet.claimStatus(dropId, requestID);
            const dropToken = await dropperV3Facet.getDrop(dropId);
            expect(dropClaimed).to.be.true;
            expect(dropToken.claimCount).to.be.equal(amount);
        });

        it('DropperV3-10: Claim ERC721 Token', async function () {

            const dropId = 3;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            const tx = await dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            );

            await tx.wait();

            const dropClaimed = await dropperV3Facet.claimStatus(dropId, requestID);
            const dropToken = await dropperV3Facet.getDrop(dropId);
            expect(dropClaimed).to.be.true;
            expect(dropToken.claimCount).to.be.equal(amount);
        });

        it('DropperV3-11: Claim ERC1155 Token', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            const tx = await dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            );

            await tx.wait();

            const dropClaimed = await dropperV3Facet.claimStatus(dropId, requestID);
            const dropToken = await dropperV3Facet.getDrop(dropId);
            expect(dropClaimed).to.be.true;
            expect(dropToken.claimCount).to.be.equal(amount);
        });

        it('DropperV3-12: Revert on sending claim request twice', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            const tx = await dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            );

            await tx.wait();


            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature)).to.be.revertedWith('Dropper: _claim -- That (dropID, requestID) pair has already been claimed');
        });

        it('DropperV3-13: Revert on bad signer', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                user0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- Unauthorized signer for drop');

        });

        it('DropperV3-14: Revert on bad signer', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                admin0.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                user0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- Unauthorized signer for drop');
        });

        it('DropperV3-15: Revert on bad signature message, with correct signer', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user0.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- Invalid signature for claim.');
        });

        it('DropperV3-16: Revert on bad signature and signer, correct messageHash', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await user0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                user0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- Unauthorized signer for drop');
        });

        it('DropperV3-17: Revert on Deadline Past', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);
            await time.increase(blockDeadline + blockDeadline);
            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- Block deadline exceeded.');
        });

        it('DropperV3-18: Revert on Inactive Drop', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await dropperV3Facet.setDropStatus(dropId, false);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- cannot claim inactive drop');
        });

        it('DropperV3-19: Revert on Token send failure', async function () {

            const dropId = 2;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 1;
            const erc20Address = await mockERC20.getAddress();

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.reverted;
        });

        it('DropperV3-20: Revert on ERC721 claim on tokenId not owned by dropper', async function () {

            const dropId = 3;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 101; //erc721 amount is equal to erc721 TokenID

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.reverted;
        });

        it('DropperV3-20: Revert on not enough to claim', async function () {

            const dropId = 4;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 101;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.revertedWith('DF: Claims exceed Tokens to distribute');
        });

        it('DropperV3-21: Revert on Native Transfer Failure', async function () {

            const dropId = 1;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 51;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.revertedWith('Failed to send Native Token');
        });

        it('DropperV3-22: Revert on Unknown Type', async function () {

            const dropId = 5;
            const requestID = 7;
            const blockDeadline = Math.floor(Date.now() / 1000) + 3600;
            const amount = 0;

            const { domain, types, message } = await dropperClaimMessageHash(
                chainId,
                dropperV3Address,
                dropId.toString(),
                requestID.toString(),
                user1.address,
                blockDeadline.toString(),
                amount.toString()
            );
            const signature = await admin0.signTypedData(domain, types, message);

            //activate a non-initalized dropId to give tokenType 0 during claims.
            await dropperV3Facet.setDropStatus(dropId, true);
            const terminusAddress = await terminusFacet.getAddress();
            await dropperV3Facet.setDropAuthorization(dropId, terminusAddress, 1);

            await expect(dropperV3Facet.connect(user1).claim(
                dropId,
                requestID,
                blockDeadline,
                amount,
                user1.address,
                admin0.address,
                signature
            )).to.be.revertedWith('Dropper: _claim -- Unknown token type in claim');
        });
    })
})