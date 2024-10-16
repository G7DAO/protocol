import { ErrorDecoder } from "ethers-decode-error";
import { TokenSenderABI } from "../abis/TokenSenderABI";

export const tokenSenderErrorDecoder = ErrorDecoder.create([TokenSenderABI]);
