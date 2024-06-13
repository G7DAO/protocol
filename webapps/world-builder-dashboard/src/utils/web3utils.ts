import {ethers} from "ethers";

export const convertToBigNumber = (numberString: string, precision = 18) => {
    const [integerPart, decimalPart] = numberString.split(".");
    const decimalPartPadded = (decimalPart || "").padEnd(precision, "0");
    const bigNumberString = integerPart + decimalPartPadded;
    return ethers.BigNumber.from(bigNumberString);
}