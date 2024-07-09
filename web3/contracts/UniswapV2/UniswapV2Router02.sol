// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.6;

import '@uniswap/v2-periphery/contracts/UniswapV2Router02.sol';

contract UniswapV2Router is UniswapV2Router02 {

    constructor(address _v2Factory, address _WETH) UniswapV2Router02(_v2Factory, _WETH) public{}

}