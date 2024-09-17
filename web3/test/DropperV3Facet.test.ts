import { ethers } from 'hardhat';
import {expect } from 'chai';
import { HardhatEthersSigner } from '../helpers/type';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployDropperV3Contracts } from './fixture/dropperV3.fixture';
import { dropperClaimMessageHash } from './helpers/utils/dropperV3Signer'; 
import { TerminusFacet, DropperV3Facet, MockERC1155, MockERC20, MockERC721 } from '../typechain-types';
import { ONE_DAY } from '../constants/time';



describe("DropperV3Facet", async function(){

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

    before(async function(){
        [admin1, user0, user1] = await ethers.getSigners();
    })

    beforeEach(async function() {
        const contracts = await loadFixture(deployDropperV3Contracts);
        
        admin0 = contracts.admin0;
        terminusFacet = contracts.terminusDiamond;
        dropperV3Facet = contracts.dropperV3Facet;
        mockERC1155 = contracts.erc1155;
        mockERC20 = contracts.erc20;
        mockERC721 = contracts.erc721;

        authorizationTokenAddress = await terminusFacet.getAddress();

    })

    describe('Create Drops', async function() {

        it('DropperV3 - 1 Address should be Proper', async function (){
            expect(await terminusFacet.getAddress()).to.be.properAddress;
            expect(await dropperV3Facet.getAddress()).to.be.properAddress;
        })

       it("DropperV3 - 2 Create a new drop with Native token type", async function () {
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

        it("DropperV3 - 3 Create a new drop with ERC20 token type", async function () {
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

        it("DropperV3 - 4 Create a new drop with ERC721 token type", async function () {
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

        it("DropperV3 - 5 Create a new drop with ERC1155 token type", async function () {
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

        it("DropperV3 - 6 Revert if the token type is unknown", async function () {
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

        it("DropperV3 - 7 Revert if the token type is 721 and tokenId not zero", async function () {
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

    })

    describe("Claim rewards", async function(){
        
        let chainId: number;

        beforeEach(async function() {
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

            await e1155tx.wait();
            const dropperAddress = dropperV3Facet.getAddress()
        
            await mockERC721.mint(dropperAddress, tokenId);
            await mockERC20.mint(dropperAddress, InitialTokenBalance);
            await mockERC1155.mint(dropperAddress, tokenId, InitialTokenBalance);

            const chainIdBigInt = await admin0.provider.getNetwork().then((network) => network.chainId);
            chainId = Number(chainIdBigInt);
        })

        

        it('DropperV3 - 8', async function() {
            
        })

    })
})