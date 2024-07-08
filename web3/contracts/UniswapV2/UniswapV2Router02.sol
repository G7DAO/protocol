// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.6;

import '@uniswap/v2-periphery/contracts/UniswapV2Router02.sol';

contract Game7Router is UniswapV2Router02 {

    address public immutable wrapperFactory;

    constructor(address _v2Factory, address _WETH, address _wrapperFactory) UniswapV2Router02(_v2Factory, _WETH) public {
        wrapperFactory = _wrapperFactory;

    }


}