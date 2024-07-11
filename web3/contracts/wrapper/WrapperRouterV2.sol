// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../uniswapv2/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./WrapperFunctions.sol";

contract WrapperRouter is WrapperFunctions, ReentrancyGuard{

    address immutable public uniswapV2router;


    constructor(address _uniswapV2router,address _wrapperFactory) WrapperFunctions(_wrapperFactory){
        uniswapV2router = _uniswapV2router;
    }
    struct unwrapped1155Params{
        address _contract;
        uint256 tokenId;
        uint256 amountDesired;
        uint256 amountMinium;
    }

    //functions liquidity add and remove, eth and non-eth

    function addliquidity1155_1155(unwrapped1155Params memory token0, unwrapped1155Params memory token1,address to, uint deadline) external nonReentrant returns(uint256 liquidityAdded){
        (address _token0, uint256 _amount0Desired) = wrap1155(token0._contract, address(this), token0.amountDesired, token0.tokenId);
        (address _token1, uint256 _amount1Desired) = wrap1155(token1._contract, address(this), token1.amountDesired, token1.tokenId); 
        
        _approveRouter(_token0, _amount0Desired);
        _approveRouter(_token1, _amount1Desired);

        (,,liquidityAdded) = IUniswapV2Router02(uniswapV2router).addLiquidity(_token0, _token1, _amount0Desired, _amount1Desired, token0.amountMinium * 1 ether, token1.amountMinium * 1 ether, to, deadline);
                    
    }

    function addLiquidity1155_ETH(unwrapped1155Params memory token, uint amountETHMin, address to, uint deadline) external nonReentrant payable returns(uint liquidityAdded){
        (address _token, uint256 _amountDesired) = wrap1155(token._contract, address(this), token.amountDesired, token.tokenId);
        _approveRouter(_token, _amountDesired);

        (,,liquidityAdded) = IUniswapV2Router02(uniswapV2router).addLiquidityETH{value: msg.value}(_token, _amountDesired, token.amountMinium * 1 ether, amountETHMin, to, deadline);

    }


    //functions swaps, from 1155 to (1155, 20, eth)
    //functions swaps, from 20/eth to (1155)


    function _approveRouter(address token, uint amount) internal{
        IDEXW1155(token).approve(uniswapV2router, amount);
    }

}