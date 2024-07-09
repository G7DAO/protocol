// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;



import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {WrapperFunctions} from "./WrapperFunctions.sol";

contract WrapperRouter is WrapperFunctions{

    address immutable public uniswapV2router;


    constructor(address _uniswapV2router,address _wrapperFactory) WrapperFunctions(_wrapperFactory){
        uniswapV2router = _uniswapV2router;
    }

    //functions liquidity add and remove, eth and non-eth
    //functions swaps, from 1155 to (1155, 20, eth)
    //functions swaps, from 20/eth to (1155)




}