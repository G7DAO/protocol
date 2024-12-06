import { ethers } from "hardhat";

/**
 * Get the function selectors for a given contract
 * @param contractName The name of the contract
 * @returns The function selectors
 */
export async function getContractFunctionSelectors(contractName: string) {
    const factory = await ethers.getContractFactory(contractName);
    //console.log(`${contractName}`);
    const functionSelectors = factory.interface.fragments
        .filter(fragment => fragment.type === 'function')
        .map((fragment: any) => {
            const signature = `${fragment.name}(${fragment.inputs.map(encodeParameter).join(',')})`;
            //console.log(signature, ethers.id(signature).slice(0, 10));
            const selector = ethers.id(signature).slice(0, 10); // The function selector is the first 4 bytes (8 hex chars) of the keccak256 hash
            return selector;
        });
    //console.log('\n');
    return functionSelectors;
}

/** 
 * Encode a parameter for a function
 * @param input The parameter to encode
 * @returns The encoded parameter
 */
function encodeParameter(input: any): string {
    if (input.type === 'tuple') {
        return `(${input.components.map(encodeParameter).join(',')})`;
    } else if (input.type === 'tuple[]') {
        return `(${input.components.map(encodeParameter).join(',')})[]`;
    } else {
        return input.type;
    }
}

/**
 * Get the function selector for a given contract and function
 * @param contractName The name of the contract
 * @param functionName The name of the function
 * @returns The function selector
 */
export async function getFunctionSelector(contractName: string, functionName: string) {
    const factory = await ethers.getContractFactory(contractName);
    const functionSelector = factory.interface.getFunction(functionName)?.selector;
    return functionSelector || "0x";
}

/**
 * Encode function data for a given contract and function
 * @param contractName The name of the contract
 * @param functionName The name of the function
 * @param args The arguments to pass to the function
 * @returns The encoded function data
 */
export async function encodeFunctionWithArgs(contractName: string, functionName: string, args: any[]) {
    const factory = await ethers.getContractFactory(contractName);
    const iface = new ethers.Interface(factory.interface.format());
    return iface.encodeFunctionData(functionName, args);
}