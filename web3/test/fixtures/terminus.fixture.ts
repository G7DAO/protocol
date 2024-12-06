import { ethers } from "hardhat";
import { deployDiamond } from "../utils/diamond";
import { encodeFunctionWithArgs } from "../utils/encode";

/**
 * @notice Deploy the Terminus diamond
 * @dev Deploys the Terminus diamond and returns the contract instance
 * @returns Contract instance of the Terminus diamond
 */
export async function deployTerminusDiamond() {
    const initCalldata = await encodeFunctionWithArgs("TerminusFacet", "init", []);
    const diamond = await deployDiamond(["TerminusFacet"], initCalldata);
    const terminusFacet = await ethers.getContractAt("TerminusFacet", diamond);
    return terminusFacet
}  