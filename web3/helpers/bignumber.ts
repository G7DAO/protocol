import { ethers } from "hardhat";

export function toWei(value: string | number): bigint {
    return ethers.parseEther(value.toString())
}

export function fromWei(value: string | number): string {
    return ethers.formatEther(value.toString())
}