import { ethers } from 'hardhat';
import { expect } from 'chai';
import { HardhatEthersSigner } from '../helpers/type';
import { deployTerminusDiamond } from './fixtures/terminus.fixture';


describe('Terminus', async function () {

    let terminusFacet: any;
    let terminusFacetAddress: string;
    let erc20: any;
    let erc20Address: string;
    let admin0: HardhatEthersSigner;
    let admin1: HardhatEthersSigner;
    let user0: HardhatEthersSigner;
    let user1: HardhatEthersSigner;
    let user2: HardhatEthersSigner;

    beforeEach(async function () {
        [admin0, admin1, user0, user1, user2] = await ethers.getSigners();
        terminusFacet = await deployTerminusDiamond();
        terminusFacetAddress = await terminusFacet.getAddress();
        const ERC20 = await ethers.getContractFactory('MockERC20');
        erc20 = await ERC20.deploy();
        erc20.waitForDeployment();
        erc20Address = erc20.getAddress();
        await terminusFacet.connect(admin0).setPaymentToken(erc20Address);
        await terminusFacet.connect(admin0).setPoolBasePrice(1000);
        await erc20.mint(admin0.address, 1000)
        await erc20.connect(admin0).approve(terminusFacetAddress, 1000);
    });
    describe('Terminus Deployment and Set up', async function () {
        it('Terminus-1: Anyone should be able to deploy Terminus and be admin0', async function () {
            expect(terminusFacetAddress).to.be.properAddress;
            const controller = await terminusFacet.terminusController();
            expect(controller).to.equal(admin0.address);
        })
        it('Terminus-2: Can set new admin0', async function () {
            await terminusFacet.setController(admin1);
            const controller = await terminusFacet.terminusController();
            expect(controller).to.equal(admin1.address);
        })
        it('Terminus-3: Non-admin0 attempts to set new admin0', async function () {
            await expect(await terminusFacet.terminusController()).to.equal(admin0.address);
            await expect(terminusFacet.connect(admin1).setController(admin1.address)).to.be.reverted;
        })
        it('Terminus-4: Set contract URI', async function () {
            let contractURI = await terminusFacet.contractURI();
            expect(contractURI).to.equal("");

            await terminusFacet.connect(admin0).setContractURI("https://example.com");

            contractURI = await terminusFacet.contractURI();

            expect(contractURI).to.equal("https://example.com");

        })
    })



    describe('Terminus Pool Creation', async function () {

        //test written with aid chat gpt-4
        it('Terminus-5: Simple Pool Creation and validate balance', async function () {

            const poolBasePrice = await terminusFacet.connect(admin0).poolBasePrice();
            expect(poolBasePrice).to.equal(1000);

            // Store initial values
            const initialAdmin0Balance = await erc20.balanceOf(admin0.address);
            const initialTerminusBalance = await erc20.balanceOf(terminusFacetAddress);
            const initialTotalPools = await terminusFacet.totalPools();

            // Create a simple pool
            await terminusFacet.connect(admin0).createSimplePool(10);

            // Verify that the total pool count increased by 1
            const finalTotalPools = await terminusFacet.totalPools();
            expect(finalTotalPools).to.equal(initialTotalPools + BigInt(1));

            // Verify balances after creating the pool
            const intermediateTerminusBalance = await erc20.balanceOf(terminusFacetAddress);
            const intermediateAdmin0Balance = await erc20.balanceOf(admin0.address);
            expect(intermediateAdmin0Balance).to.equal(initialAdmin0Balance - poolBasePrice);
            expect(intermediateTerminusBalance).to.equal(initialTerminusBalance + poolBasePrice);

            // Unauthorized withdrawals should revert
            await expect(
                terminusFacet.connect(admin0).withdrawPayments(admin1.address, 1000)
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).withdrawPayments(admin0.address, 1000)
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).withdrawPayments(admin1.address, 1000)
            ).to.be.reverted;

            // Authorized withdrawal by the admin0
            await terminusFacet.connect(admin0).withdrawPayments(admin0.address, 1000);

            // Verify balances after withdrawal
            const finalAdmin0Balance = await erc20.balanceOf(admin0.address);
            const finalTerminusBalance = await erc20.balanceOf(terminusFacetAddress);
            expect(finalTerminusBalance).to.equal(intermediateTerminusBalance - poolBasePrice);
            expect(finalAdmin0Balance).to.equal(intermediateAdmin0Balance + poolBasePrice);

            // Attempt to overdraw should revert
            await expect(
                terminusFacet.connect(admin0).withdrawPayments(admin0.address, poolBasePrice)
            ).to.be.reverted;

            // Check the pool admin0 and capacity
            const pooladmin0 = await terminusFacet.terminusPoolController(finalTotalPools);
            expect(pooladmin0).to.equal(admin0.address);
            const poolCapacity = await terminusFacet.terminusPoolCapacity(finalTotalPools);
            expect(poolCapacity).to.equal(10);
        })
    })

    describe('Test Pool Operations', async function () {



        it("Terminus-6: Should correctly set and revert pool controller changes", async function () {

            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();

            // Set the initial controller for the pool to `admin1`
            await terminusFacet.connect(admin0).setPoolController(poolId, admin1.address);

            // Verify that the current pool controller is `oldController`
            let currentControllerAddress = await terminusFacet.terminusPoolController(poolId);
            expect(currentControllerAddress).to.equal(admin1.address);

            // Attempting to set a new controller from `newController` (unauthorized)
            await expect(
                terminusFacet.connect(user0).setPoolController(poolId, user0.address)
            ).to.be.reverted;

            // Verify that the pool controller hasn't changed
            currentControllerAddress = await terminusFacet.terminusPoolController(poolId);
            expect(currentControllerAddress).to.equal(admin1.address);

            // Authorized change of pool controller from `admin1` to `user0`
            await terminusFacet.connect(admin1).setPoolController(poolId, user0.address);

            // Verify the pool controller has been updated to `user0`
            currentControllerAddress = await terminusFacet.terminusPoolController(poolId);
            expect(currentControllerAddress).to.equal(user0.address);

            // Attempting to set the controller back to `admin1` by `admin1` (unauthorized)
            await expect(
                terminusFacet.connect(admin1).setPoolController(poolId, admin1.address)
            ).to.be.reverted;

            // Verify that the controller remains `user0`
            currentControllerAddress = await terminusFacet.terminusPoolController(poolId);
            expect(currentControllerAddress).to.equal(user0.address);

            // Authorized change of pool controller back to `admin1` by `user0`
            await terminusFacet.connect(user0).setPoolController(poolId, admin1.address);

            // Verify the controller has reverted back to `admin1`
            currentControllerAddress = await terminusFacet.terminusPoolController(poolId);
            expect(currentControllerAddress).to.equal(admin1.address);
        });

        it("Terminus-7: Should mint tokens to a specified account and update supply", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to the recipient in the specified pool
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Check the recipient's balance in the pool
            const balance = await terminusFacet.balanceOf(user0.address, poolId);
            expect(balance).to.equal(1);

            // Verify the total supply in the pool
            const supply = await terminusFacet.terminusPoolSupply(poolId);
            expect(supply).to.equal(1);
        });

        it("Terminus-8: Should fail to mint if it exceeds pool capacity", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();

            // Attempt to mint more than the pool's capacity (11 tokens in this case)
            await expect(
                terminusFacet.connect(admin0).mint(admin1.address, poolId, 11, "0x")
            ).to.be.reverted;

            // Check that the recipient's balance and total pool supply remain at 0
            const balance = await terminusFacet.balanceOf(admin1.address, poolId);
            expect(balance).to.equal(0);

            const supply = await terminusFacet.terminusPoolSupply(poolId);
            expect(supply).to.equal(0);
        });

        it("Terminus-9: Should mint tokens in batch to the specified account and update supply", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();

            // Batch mint 1 token to the recipient in the specified pool
            await terminusFacet.connect(admin0).mintBatch(
                admin1.address,
                [poolId], // Array of pool IDs
                [1],      // Array of amounts corresponding to each pool ID
                "0x"      // Optional data parameter
            );

            // Check the recipient's balance in the pool
            const balance = await terminusFacet.balanceOf(admin1.address, poolId);
            expect(balance).to.equal(1);

            // Verify the total supply in the pool
            const supply = await terminusFacet.terminusPoolSupply(poolId);
            expect(supply).to.equal(1);
        });

        it("Terminus-10: Should only allow minting to approved pools in batch", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const previousPoolId = await terminusFacet.totalPools();
            await erc20.connect(admin0).mint(admin0.address, 1000);
            await erc20.connect(admin0).approve(terminusFacetAddress, 1000);
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();


            // Check initial approval status (should be false)
            expect(await terminusFacet.isApprovedForPool(poolId, admin1.address)).to.be.false;
            expect(await terminusFacet.isApprovedForPool(previousPoolId, admin1.address)).to.be.false;

            // Initial balances and supplies for the user0 in each pool
            const balancesBefore = [
                await terminusFacet.balanceOf(user0.address, poolId),
                await terminusFacet.balanceOf(user0.address, previousPoolId),
            ];
            const suppliesBefore = [
                await terminusFacet.terminusPoolSupply(poolId),
                await terminusFacet.terminusPoolSupply(previousPoolId),
            ];

            // Approve the admin1 for one of the pools (poolId)
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);

            // Attempt batch minting; should revert because previousPoolId is not approved for admin1
            await expect(
                terminusFacet.connect(admin1).mintBatch(
                    user0.address,
                    [poolId, previousPoolId],
                    [1, 1],
                    "0x"
                )
            ).to.be.reverted;

            // Approve the minter for the second pool (previousPoolId)
            await terminusFacet.connect(admin0).approveForPool(previousPoolId, admin1.address);

            // Now attempt the batch minting, which should succeed
            await terminusFacet.connect(admin1).mintBatch(
                user0.address,
                [poolId, previousPoolId],
                [1, 1],
                "0x"
            );

            // Verify updated balances for user0
            const balanceAfterPool1 = await terminusFacet.balanceOf(user0.address, poolId);
            const balanceAfterPool2 = await terminusFacet.balanceOf(user0.address, previousPoolId);
            expect(balanceAfterPool1).to.equal(balancesBefore[0] + BigInt(1));
            expect(balanceAfterPool2).to.equal(balancesBefore[1] + BigInt(1));

            // Verify updated supplies for each pool
            const supplyAfterPool1 = await terminusFacet.terminusPoolSupply(poolId);
            const supplyAfterPool2 = await terminusFacet.terminusPoolSupply(previousPoolId);
            expect(supplyAfterPool1).to.equal(suppliesBefore[0] + BigInt(1));
            expect(supplyAfterPool2).to.equal(suppliesBefore[1] + BigInt(1));
        });

        it("Terminus-11: Should fail batch minting if it exceeds the pool capacity", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const previousPoolId = await terminusFacet.totalPools();
            await erc20.connect(admin0).mint(admin0.address, 1000);
            await erc20.connect(admin0).approve(terminusFacetAddress, 1000);
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);
            await terminusFacet.connect(admin0).approveForPool(previousPoolId, admin1.address);

            // Attempt batch minting that exceeds pool capacity
            await expect(
                terminusFacet.connect(admin0).mintBatch(
                    user0.address,
                    [poolId, previousPoolId], // Same pool ID twice
                    [11, 11], // Amounts that together exceed capacity
                    "0x" // Optional data
                )
            ).to.be.reverted;

            // Verify that the recipient's balance and total pool supply remain at 0
            const balance = await terminusFacet.balanceOf(user0.address, poolId);
            expect(balance).to.equal(0);

            const supply = await terminusFacet.terminusPoolSupply(poolId);
            expect(supply).to.equal(0);
        });
        it("Terminus-12: Should fail batch minting if it exceeds the pool capacity with single-token mints", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const previousPoolId = await terminusFacet.totalPools();
            await erc20.connect(admin0).mint(admin0.address, 1000);
            await erc20.connect(admin0).approve(terminusFacetAddress, 1000);
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);
            await terminusFacet.connect(admin0).approveForPool(previousPoolId, admin1.address);

            await expect(
                terminusFacet.connect(admin0).mintBatch(
                    user0.address,
                    [poolId, previousPoolId],   // Array of pool IDs
                    [1, 11],   // Array of amounts corresponding to each pool ID
                    "0x"       // Optional data parameter
                )
            ).to.be.reverted;

            // Verify that the recipient's balance and total pool supply remain at 0 after the failed mint attempt
            const balance = await terminusFacet.balanceOf(user0.address, poolId);
            expect(balance).to.equal(0);

            const supply = await terminusFacet.terminusPoolSupply(poolId);
            expect(supply).to.equal(0);
        });

        it("Terminus-13: Should mint tokens in batch to multiple accounts and update their balances and supply", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);


            const targetAddresses = [user0.address, user1.address];

            // Record initial balances and supply for verification
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialBalances = [
                await terminusFacet.balanceOf(user0.address, poolId),
                await terminusFacet.balanceOf(user1.address, poolId),
            ];

            // Perform batch minting to multiple accounts
            await terminusFacet.connect(admin0).poolMintBatch(
                poolId,
                targetAddresses,
                [1, 1]
            );

            // Verify the final pool supply
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            expect(finalPoolSupply).to.equal(2);

            // Verify final balances for each account
            for (let i = 0; i < 2; i++) {
                const finalBalance = await terminusFacet.balanceOf(targetAddresses[i], poolId);
                expect(finalBalance).to.equal(1);
            }
        });

        it("Terminus-14: Should fail batch minting if attempted by the contract controller instead of the pool controller", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).setPoolController(poolId, admin1.address);

            // Prepare target addresses and mint amounts
            const targetAddresses = [user0.address, user1.address, user2.address]
            const targetAmounts = [1, 1, 1];

            // Record initial balances and supply for verification
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialBalances = [await terminusFacet.balanceOf(user0.address, poolId),
            await terminusFacet.balanceOf(user1.address, poolId),
            await terminusFacet.balanceOf(user2.address, poolId)]

            // Attempt batch minting by the contract controller instead of the pool controller
            await expect(
                terminusFacet.connect(admin0).poolMintBatch(
                    poolId,
                    targetAddresses,
                    targetAmounts
                )
            ).to.be.reverted;

            // Verify that the pool supply and target accounts' balances remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            expect(finalPoolSupply).to.equal(initialPoolSupply);

            for (let i = 0; i < targetAddresses.length; i++) {
                const finalBalance = await terminusFacet.balanceOf(targetAddresses[i], poolId);
                expect(finalBalance).to.equal(initialBalances[i]);
            }
        });
        it("Terminus-15: Should fail batch minting if attempted by an unauthorized third party", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).setPoolController(poolId, admin1.address);

            // Prepare target addresses and mint amounts
            const targetAddresses = [user0.address, user1.address, user2.address]
            const targetAmounts = [1, 1, 1];

            // Record initial balances and supply for verification
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialBalances = [await terminusFacet.balanceOf(user0.address, poolId),
            await terminusFacet.balanceOf(user1.address, poolId),
            await terminusFacet.balanceOf(user2.address, poolId)]

            // Attempt batch minting by an unauthorized user
            await expect(
                terminusFacet.connect(user2).poolMintBatch(
                    poolId,
                    targetAddresses,
                    targetAmounts
                )
            ).to.be.reverted;

            // Verify that the pool supply and target accounts' balances remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            expect(finalPoolSupply).to.equal(initialPoolSupply);

            for (let i = 0; i < targetAddresses.length; i++) {
                const finalBalance = await terminusFacet.balanceOf(targetAddresses[i], poolId);
                expect(finalBalance).to.equal(initialBalances[i]);
            }
        });

        it("Terminus-16: Should allow minting with pool approval", async function () {
            // Create a new pool with controlled minting and without default approval
            await terminusFacet.connect(admin0).createPoolV1(10, false, false);
            const poolId = await terminusFacet.totalPools();

            // Verify that the unauthorized user is initially not approved
            expect(await terminusFacet.isApprovedForPool(poolId, admin1.address)).to.be.false;

            // Attempt minting by unauthorized user, expecting it to fail
            await expect(
                terminusFacet.connect(admin1).mint(
                    admin1.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Approve the unauthorized user for minting in the pool
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);

            // Record initial balance and supply for verification
            const initialSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialBalance = await terminusFacet.balanceOf(admin1.address, poolId);

            // Perform minting with the approved user
            await terminusFacet.connect(admin1).mint(
                admin1.address,
                poolId,
                1,
                "0x"
            );

            // Verify final balance and supply are updated as expected
            const finalBalance = await terminusFacet.balanceOf(admin1.address, poolId);
            const finalSupply = await terminusFacet.terminusPoolSupply(poolId);
            expect(finalBalance).to.equal(initialBalance + BigInt(1));
            expect(finalSupply).to.equal(initialSupply + BigInt(1));
        });

        it("Terminus-17: Should allow transfer of tokens by the pool controller", async function () {
            await terminusFacet.connect(admin0).createSimplePool(10);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).setPoolController(poolId, admin1.address);

            // Mint 1 token to recipient1
            await terminusFacet.connect(admin1).mint(user0.address, poolId, 1, "0x");

            // Record initial balances for sender and receiver
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Pool controller initiates transfer from recipient1 to recipient2
            await terminusFacet.connect(admin1).safeTransferFrom(
                user0.address,
                user1.address,
                poolId,
                1,
                "0x"
            );

            // Verify final balances after transfer
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance - BigInt(1));
            expect(finalReceiverBalance).to.equal(initialReceiverBalance + BigInt(1));
        });

        it("Terminus-18: Should prevent unauthorized transfer by controller of a different pool", async function () {
            // First, ensure `admin1` controls another separate pool
            await terminusFacet.connect(admin0).createPoolV1(100, true, true);
            const controlledPoolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).setPoolController(controlledPoolId, admin1.address)

            // Verify that `poolController` is the controller of this new pool
            expect(await terminusFacet.terminusPoolController(controlledPoolId)).to.equal(admin1.address);

            // Create another pool to perform unauthorized transfer test
            await erc20.connect(admin0).mint(admin0.address, 1000);
            await erc20.connect(admin0).approve(terminusFacetAddress, 1000);
            await terminusFacet.connect(admin0).createPoolV1(100, true, true);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Transfer control of `poolId` to `user1`
            await terminusFacet.connect(admin0).setPoolController(poolId, user1.address);

            // Record initial balances for sender and receiver
            const initialSenderBalance = await terminusFacet.balanceOf(user1.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user2.address, poolId);

            // Attempt transfer by original pool controller, expecting it to fail
            await expect(
                terminusFacet.connect(admin1).safeTransferFrom(
                    user1.address,
                    user2.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Verify balances remain unchanged after the failed transfer
            const finalSenderBalance = await terminusFacet.balanceOf(user1.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user2.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance);
            expect(finalReceiverBalance).to.equal(initialReceiverBalance);
        });
        it("Terminus-19: Should fail transfer as Terminus controller without approval", async function () {
            // Create a new pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(100, true, true);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Remove control from the terminusController
            await terminusFacet.connect(admin0).setPoolController(poolId, admin1.address);

            // Record initial balances for sender and receiver
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Attempt transfer by terminusController without approval, expecting it to fail
            await expect(
                terminusFacet.connect(admin0).safeTransferFrom(
                    user1.address,
                    user2.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Verify balances remain unchanged
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);
            expect(finalSenderBalance).to.equal(initialSenderBalance);
            expect(finalReceiverBalance).to.equal(initialReceiverBalance);
        });

        it("Terminus-20: Should fail transfer by unauthorized recipient", async function () {
            // Create a new pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, true);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial balances for sender and receiver
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Attempt transfer by unauthorized recipient, expecting it to fail
            await expect(
                terminusFacet.connect(user1).safeTransferFrom(
                    user0.address,
                    user1.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Verify balances remain unchanged
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);
            expect(finalSenderBalance).to.equal(initialSenderBalance);
            expect(finalReceiverBalance).to.equal(initialReceiverBalance);
        });

        it("Terminus-21: Should allow transfer by authorized recipient", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, true);
            const poolId = await terminusFacet.totalPools();
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial balances for sender and receiver
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Approve recipient2 for the pool
            await terminusFacet.connect(admin0).approveForPool(poolId, user1.address);

            // Perform the transfer by recipient2
            await terminusFacet.connect(user1).safeTransferFrom(
                user0.address,
                user1.address,
                poolId,
                1,
                "0x"
            );

            // Verify final balances after transfer
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance - BigInt(1));
            expect(finalReceiverBalance).to.equal(initialReceiverBalance + BigInt(1));
        });

        it("Terminus-22: Should allow transfer as an approved operator", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial balances
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Approve the operator for all pools for recipient1
            await terminusFacet.connect(user0).setApprovalForAll(admin1.address, true);

            // Perform the transfer by the approved operator
            await terminusFacet.connect(admin1).safeTransferFrom(
                user0.address,
                user1.address,
                poolId,
                1,
                "0x"
            );

            // Revoke the approval to reset state
            await terminusFacet.connect(user0).setApprovalForAll(admin1.address, false);

            // Verify final balances after transfer
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance - BigInt(1));
            expect(finalReceiverBalance).to.equal(initialReceiverBalance + BigInt(1));

            // Verify approval is revoked
            expect(await terminusFacet.isApprovedForAll(user0.address, admin1.address)).to.be.false;
        });

        it("Terminus-23: Should fail transfer by unauthorized unrelated party", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial balances
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Attempt transfer by unauthorizedUser, expecting it to fail
            await expect(
                terminusFacet.connect(admin1).safeTransferFrom(
                    user0.address,
                    user1.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Verify balances remain unchanged after the failed transfer
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance);
            expect(finalReceiverBalance).to.equal(initialReceiverBalance);
        });

        it("Terminus-24: Should allow transfer by authorized unrelated party", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial balances
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Approve unauthorizedUser for the pool
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);

            // Perform the transfer by the authorized unrelated party
            await terminusFacet.connect(admin1).safeTransferFrom(
                user0.address,
                user1.address,
                poolId,
                1,
                "0x"
            );

            // Verify final balances after transfer
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance - BigInt(1));
            expect(finalReceiverBalance).to.equal(initialReceiverBalance + BigInt(1));
        });

        it("Terminus-25: Should fail burn as token owner", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, false);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Attempt to burn by token owner, expecting it to fail
            await expect(
                terminusFacet.connect(user0).burn(user0.address, poolId, 1)
            ).to.be.reverted;

            // Verify final supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });

        it("Terminus-26: Should fail burn as pool controller", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, false);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Attempt to burn by pool controller, expecting it to fail
            await expect(
                terminusFacet.connect(admin0).burn(user0.address, poolId, 1)
            ).to.be.reverted;

            // Verify final supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });

        it("Terminus-27: Should fail burn as an unauthorized third party", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, false);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Attempt to burn by an unauthorized user, expecting it to fail
            await expect(
                terminusFacet.connect(admin1).burn(user0.address, poolId, 1)
            ).to.be.reverted;

            // Verify final supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });

        it("Terminus-28: Should fail burn as an authorized third party", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, false);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to user0
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Approve a third party for the pool
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);

            // Attempt to burn by the authorized third party, expecting it to fail
            await expect(
                terminusFacet.connect(admin1).burn(user0.address, poolId, 1)
            ).to.be.reverted;

            // Verify final supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });

        it("Terminus-29: Should test pool approval for minting and burning permissions", async function () {
            // Create a pool and set the pool controller
            await terminusFacet.connect(admin0).createPoolV1(ethers.MaxUint256, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint tokens to controller, operator, and user
            await terminusFacet.connect(admin0).mint(admin0.address, poolId, 5, "0x");
            await terminusFacet.connect(admin0).mint(admin1.address, poolId, 5, "0x");
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 5, "0x");

            const initialControllerBalance = await terminusFacet.balanceOf(admin0.address, poolId);
            const initialOperatorBalance = await terminusFacet.balanceOf(admin1.address, poolId);
            const initialUserBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(await terminusFacet.isApprovedForPool(poolId, admin1.address)).to.be.false;

            // Ensure minting fails when attempted by the operator without approval
            await expect(
                terminusFacet.connect(admin1).mint(admin0.address, poolId, 1, "0x")
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).mint(admin1.address, poolId, 1, "0x")
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).mint(user0.address, poolId, 1, "0x")
            ).to.be.reverted;

            // Ensure balances remain unchanged after failed minting attempts
            expect(await terminusFacet.balanceOf(admin0.address, poolId)).to.equal(initialControllerBalance);
            expect(await terminusFacet.balanceOf(admin1.address, poolId)).to.equal(initialOperatorBalance);
            expect(await terminusFacet.balanceOf(user0.address, poolId)).to.equal(initialUserBalance);

            // Ensure burning fails when attempted by the operator without approval
            await expect(
                terminusFacet.connect(admin1).burn(admin0.address, poolId, 1)
            ).to.be.reverted;

            // Burn one token from operator's balance
            await terminusFacet.connect(admin1).burn(admin1.address, poolId, 1);

            expect(await terminusFacet.balanceOf(admin1.address, poolId)).to.equal(initialOperatorBalance - BigInt(1));

            // Attempt to burn user’s token by operator without approval, expecting failure
            await expect(
                terminusFacet.connect(admin1).burn(user0.address, poolId, 1)
            ).to.be.reverted;

            // Approve operator for pool
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);
            expect(await terminusFacet.isApprovedForPool(poolId, admin1.address)).to.be.true;

            // Now operator can mint tokens on behalf of others
            await terminusFacet.connect(admin1).mint(admin0.address, poolId, 1, "0x");
            await terminusFacet.connect(admin1).mint(admin1.address, poolId, 1, "0x");
            await terminusFacet.connect(admin1).mint(user0.address, poolId, 1, "0x");

            // Check updated balances after successful minting
            expect(await terminusFacet.balanceOf(admin0.address, poolId)).to.equal(initialControllerBalance + BigInt(1));
            expect(await terminusFacet.balanceOf(admin1.address, poolId)).to.equal(initialOperatorBalance);
            expect(await terminusFacet.balanceOf(user0.address, poolId)).to.equal(initialUserBalance + BigInt(1));

            // Operator can also burn tokens from any account
            await terminusFacet.connect(admin1).burn(admin0.address, poolId, 1);
            await terminusFacet.connect(admin1).burn(admin1.address, poolId, 1);
            await terminusFacet.connect(admin1).burn(user0.address, poolId, 1);

            expect(await terminusFacet.balanceOf(admin0.address, poolId)).to.equal(initialControllerBalance);
            expect(await terminusFacet.balanceOf(admin1.address, poolId)).to.equal(initialOperatorBalance - BigInt(1));
            expect(await terminusFacet.balanceOf(user0.address, poolId)).to.equal(initialUserBalance);

            // Revoke pool approval from operator
            await terminusFacet.connect(admin0).unapproveForPool(poolId, admin1.address);
            expect(await terminusFacet.isApprovedForPool(poolId, admin1.address)).to.be.false;

            // Ensure minting and burning fail again after revoking approval
            await expect(
                terminusFacet.connect(admin1).mint(admin0.address, poolId, 1, "0x")
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).mint(admin1.address, poolId, 1, "0x")
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).mint(user0.address, poolId, 1, "0x")
            ).to.be.reverted;

            await expect(
                terminusFacet.connect(admin1).burn(admin0.address, poolId, 1)
            ).to.be.reverted;

            // Operator can only burn its own tokens
            await terminusFacet.connect(admin1).burn(admin1.address, poolId, 1);

            // Verify final balances remain consistent with allowed actions
            expect(await terminusFacet.balanceOf(admin0.address, poolId)).to.equal(initialControllerBalance);
            expect(await terminusFacet.balanceOf(admin1.address, poolId)).to.equal(initialOperatorBalance - BigInt(2));
            expect(await terminusFacet.balanceOf(user0.address, poolId)).to.equal(initialUserBalance);
        });
    })
    describe("Pool Creation and State View Tests", async function () {

        it("Termiuns-30: Should prevent transfers for a nontransferable pool", async function () {
            // Create a nontransferable, nonburnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, false, false);
            const poolId = await terminusFacet.totalPools();

            // Mint 1 token to sender in the newly created pool
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial balances
            const initialSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const initialReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            // Attempt to transfer from sender to receiver, expecting it to fail
            await expect(
                terminusFacet.connect(user0).safeTransferFrom(
                    user0.address,
                    user1.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Verify balances remain unchanged
            const finalSenderBalance = await terminusFacet.balanceOf(user0.address, poolId);
            const finalReceiverBalance = await terminusFacet.balanceOf(user1.address, poolId);

            expect(finalSenderBalance).to.equal(initialSenderBalance);
            expect(finalReceiverBalance).to.equal(initialReceiverBalance);
        });

        it("Terminus-31: Should check pool properties for transferability, burnability, and URI", async function () {
            await erc20.connect(admin0).mint(admin0, 4000);
            await erc20.connect(admin0).approve(terminusFacetAddress, 4000);
            // Nontransferable, nonburnable pool
            const nontransferableNonburnableUri = "https://example.com/ff.json";
            await terminusFacet.connect(admin0).createPoolV2(10, false, false, nontransferableNonburnableUri);
            const nontransferableNonburnablePoolId = await terminusFacet.totalPools();

            expect(await terminusFacet.poolIsTransferable(nontransferableNonburnablePoolId)).to.be.false;
            expect(await terminusFacet.poolIsBurnable(nontransferableNonburnablePoolId)).to.be.false;
            expect(await terminusFacet.uri(nontransferableNonburnablePoolId)).to.equal(nontransferableNonburnableUri);

            // Transferable, nonburnable pool
            const transferableNonburnableUri = "https://example.com/tf.json";
            await terminusFacet.connect(admin0).createPoolV2(10, true, false, transferableNonburnableUri);
            const transferableNonburnablePoolId = await terminusFacet.totalPools();

            expect(await terminusFacet.poolIsTransferable(transferableNonburnablePoolId)).to.be.true;
            expect(await terminusFacet.poolIsBurnable(transferableNonburnablePoolId)).to.be.false;
            expect(await terminusFacet.uri(transferableNonburnablePoolId)).to.equal(transferableNonburnableUri);

            // Transferable, burnable pool
            const transferableBurnableUri = "https://example.com/tt.json";
            await terminusFacet.connect(admin0).createPoolV2(10, true, true, transferableBurnableUri);
            const transferableBurnablePoolId = await terminusFacet.totalPools();

            expect(await terminusFacet.poolIsTransferable(transferableBurnablePoolId)).to.be.true;
            expect(await terminusFacet.poolIsBurnable(transferableBurnablePoolId)).to.be.true;
            expect(await terminusFacet.uri(transferableBurnablePoolId)).to.equal(transferableBurnableUri);

            // Nontransferable, burnable pool
            const nontransferableBurnableUri = "https://example.com/ft.json";
            await terminusFacet.connect(admin0).createPoolV2(10, false, true, nontransferableBurnableUri);
            const nontransferableBurnablePoolId = await terminusFacet.totalPools();

            expect(await terminusFacet.poolIsTransferable(nontransferableBurnablePoolId)).to.be.false;
            expect(await terminusFacet.poolIsBurnable(nontransferableBurnablePoolId)).to.be.true;
            expect(await terminusFacet.uri(nontransferableBurnablePoolId)).to.equal(nontransferableBurnableUri);
        });

        it("Terminus-32: Should allow pool state to be set by the controller only", async function () {
            // Create a nontransferable, nonburnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, false, false);
            const poolId = await terminusFacet.totalPools();

            // Verify initial state
            expect(await terminusFacet.terminusPoolController(poolId)).to.equal(admin0.address);
            expect(await terminusFacet.poolIsTransferable(poolId)).to.be.false;
            expect(await terminusFacet.poolIsBurnable(poolId)).to.be.false;

            // Set pool as transferable
            await terminusFacet.connect(admin0).setPoolTransferable(poolId, true);
            expect(await terminusFacet.poolIsTransferable(poolId)).to.be.true;
            expect(await terminusFacet.poolIsBurnable(poolId)).to.be.false;

            // Set pool as burnable
            await terminusFacet.connect(admin0).setPoolBurnable(poolId, true);
            expect(await terminusFacet.poolIsTransferable(poolId)).to.be.true;
            expect(await terminusFacet.poolIsBurnable(poolId)).to.be.true;

            // Reset pool state back to nontransferable and nonburnable
            await terminusFacet.connect(admin0).setPoolTransferable(poolId, false);
            await terminusFacet.connect(admin0).setPoolBurnable(poolId, false);
            expect(await terminusFacet.poolIsTransferable(poolId)).to.be.false;
            expect(await terminusFacet.poolIsBurnable(poolId)).to.be.false;
        });

        it("Terminus-33: Should prevent non-controller from setting pool state parameters", async function () {
            // Create a nontransferable, nonburnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, false, false);
            const poolId = await terminusFacet.totalPools();

            // Verify initial state
            expect(await terminusFacet.terminusPoolController(poolId)).to.equal(admin0.address);
            expect(await terminusFacet.poolIsTransferable(poolId)).to.be.false;
            expect(await terminusFacet.poolIsBurnable(poolId)).to.be.false;

            // Attempt to set state by a non-controller, expecting failures
            await expect(
                terminusFacet.connect(admin1).setPoolTransferable(poolId, true)
            ).to.be.reverted;
            await expect(
                terminusFacet.connect(admin1).setPoolBurnable(poolId, true)
            ).to.be.reverted;

            // Verify state remains unchanged
            expect(await terminusFacet.poolIsTransferable(poolId)).to.be.false;
            expect(await terminusFacet.poolIsBurnable(poolId)).to.be.false;
        });

        it("Terminus-34: Should allow token owner to burn in a burnable pool", async function () {
            // Create a transferable, burnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint a token to the token owner
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial pool supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Token owner burns their token
            await terminusFacet.connect(user0).burn(user0.address, poolId, 1);

            // Verify final supply and owner balance after burn
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply - BigInt(1));
            expect(finalOwnerBalance).to.equal(initialOwnerBalance - BigInt(1));
        });

        it("Terminus-35: Should allow pool controller to burn tokens in a burnable pool", async function () {
            // Create a transferable, burnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint a token to the token owner
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial pool supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Pool controller burns the token owned by tokenOwner
            await terminusFacet.connect(admin0).burn(user0.address, poolId, 1);

            // Verify final supply and owner balance after burn
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply - BigInt(1));
            expect(finalOwnerBalance).to.equal(initialOwnerBalance - BigInt(1));
        });

        it("Termins-36: Should allow authorized third party to burn tokens in a burnable pool", async function () {
            // Create a transferable, burnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint a token to the token owner
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial pool supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Authorize third party for the pool
            await terminusFacet.connect(admin0).approveForPool(poolId, admin1.address);

            // Authorized third party burns the token
            await terminusFacet.connect(admin1).burn(user0.address, poolId, 1);

            // Verify final supply and owner balance after burn
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply - BigInt(1));
            expect(finalOwnerBalance).to.equal(initialOwnerBalance - BigInt(1));
        });

        it("Terminus-37: Should prevent unauthorized third party from burning tokens in a burnable pool", async function () {
            // Create a transferable, burnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, true, true);
            const poolId = await terminusFacet.totalPools();

            // Mint a token to the token owner
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial pool supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Attempt to burn by unauthorized third party, expecting failure
            await expect(
                terminusFacet.connect(user1).burn(user0.address, poolId, 1)
            ).to.be.reverted;

            // Verify pool supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });

        it("Terminus-38: Should prevent transfers in a nontransferable pool", async function () {
            // Create a nontransferable, nonburnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, false, false);
            const poolId = await terminusFacet.totalPools();

            // Mint a token to the token owner
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial pool supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Attempt to transfer token to receiver, expecting it to fail
            await expect(
                terminusFacet.connect(user0).safeTransferFrom(
                    user0.address,
                    user1.address,
                    poolId,
                    1,
                    "0x"
                )
            ).to.be.reverted;

            // Verify pool supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });

        it("Terminus-39: Should prevent batch transfers in a nontransferable pool", async function () {
            // Create a nontransferable, nonburnable pool
            await terminusFacet.connect(admin0).createPoolV1(10, false, false);
            const poolId = await terminusFacet.totalPools();

            // Mint a token to the token owner
            await terminusFacet.connect(admin0).mint(user0.address, poolId, 1, "0x");

            // Record initial pool supply and owner balance
            const initialPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const initialOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            // Attempt to batch transfer token to receiver, expecting it to fail
            await expect(
                terminusFacet.connect(user0).safeBatchTransferFrom(
                    user0.address,
                    user1.address,
                    [poolId],
                    [1],
                    "0x"
                )
            ).to.be.reverted;

            // Verify pool supply and owner balance remain unchanged
            const finalPoolSupply = await terminusFacet.terminusPoolSupply(poolId);
            const finalOwnerBalance = await terminusFacet.balanceOf(user0.address, poolId);

            expect(finalPoolSupply).to.equal(initialPoolSupply);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance);
        });
    })
})