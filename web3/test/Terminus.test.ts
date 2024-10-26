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

    })
    //Pick up on line 517 in moonstream/web3/cli/web3cli/test_terminus.py

})