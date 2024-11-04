import { ethers } from 'hardhat';
import { deployTerminusDiamond } from './terminus.fixture'
import { deployDiamond } from '../helpers/diamond'
import { encodeFunctionWithArgs } from '../helpers/utils/encode';


export async function deployDropperV3Contracts() {
    const [admin0] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory('MockERC20');
    const erc20 = await ERC20.deploy();

    const ERC721 = await ethers.getContractFactory('MockERC721');
    const erc721 = await ERC721.deploy();

    const ERC1155 = await ethers.getContractFactory('MockERC1155');
    const erc1155 = await ERC1155.deploy();

    const terminusDiamond = await deployTerminusDiamond();
    const terminusDiamondAddress = await terminusDiamond.getAddress();

    const executoirPoolId = await terminusDiamond.createPoolV1.staticCall(100, false, false);
    await terminusDiamond.createPoolV1(100, false, false);
    await terminusDiamond.isApprovedForPool(executoirPoolId, admin0.address);
    await terminusDiamond.mint(admin0.address, executoirPoolId, 2, '0x');

    const initCalldata = await encodeFunctionWithArgs('DropperV3Facet', 'init', [
        terminusDiamondAddress,
        executoirPoolId
    ])

    const dropperV3Address = await deployDiamond(
        ['DropperV3Facet'],
        initCalldata);

    const dropperV3Facet = await ethers.getContractAt('DropperV3Facet', dropperV3Address);

    return { dropperV3Facet, terminusDiamond, erc20, erc721, erc1155, admin0 };
} 