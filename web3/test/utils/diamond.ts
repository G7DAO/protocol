import { ethers } from 'hardhat';
import { FacetCut, FacetCutAction } from './types/diamond.types';
import { getContractFunctionSelectors } from './encode';

/**
 * Deploys a diamond contract with the given contract name and initializes it with the given function name and arguments.
 * @param contractName - The name of the contract to deploy.
 * @param init - The initialization function name and arguments. If not provided, the contract will be initialized with the default constructor.
 * @returns The address of the deployed diamond contract.
 */
export async function deployDiamond(
    facetsNames: string[],
    initCalldata: string
) {
    const facetCut: FacetCut[] = [];
    const deployer = (await ethers.getSigners())[0];
    for (const facetName of facetsNames) {
        const FacetFactory = await ethers.getContractFactory(facetName);
        const facet = await FacetFactory.connect(deployer).deploy();
        await facet.waitForDeployment();
        const facetAddress = await facet.getAddress();
        const selectors = await getContractFunctionSelectors(facetName);
        facetCut.push({
            facetAddress: facetAddress,
            action: FacetCutAction.Add,
            functionSelectors: selectors,
        });
    }

    const DiamondCutFacetFactory = await ethers.getContractFactory('DiamondCutFacet');
    const diamondCutFacet = await DiamondCutFacetFactory.connect(deployer).deploy();
    await diamondCutFacet.waitForDeployment;
    const diamondCutFacetAddress = await diamondCutFacet.getAddress();

    const contractOwner = deployer.address;
    const DiamondFactory = await ethers.getContractFactory('Diamond');
    const diamond = await DiamondFactory.connect(deployer).deploy(contractOwner, diamondCutFacetAddress);
    await diamond.waitForDeployment();
    const diamondAddress = await diamond.getAddress();

    const cutContract = await ethers.getContractAt('DiamondCutFacet', diamondAddress);
    await cutContract.diamondCut(facetCut, diamondAddress, initCalldata);

    return diamondAddress;
}