// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../interfaces/IERC20.sol";
import {IYakRouter, Trade} from "../interfaces/IYakRouter.sol";

/**
 * @title USDC2G7
 * @author Game7 Engineering Team - worldbuilder@game7.io
 * @notice This contract is used to swap USDC to G7.
 */
contract USDC2G7 {
    address public bridgedUSDC;
    address public yakRouter;
    address public wg7;
    address public algebraAdapter;
    constructor(address _bridgedUSDC, address _yakRouter, address _wg7, address _algebraAdapter) {
        bridgedUSDC = _bridgedUSDC;
        yakRouter = _yakRouter;
        wg7 = _wg7;
        algebraAdapter = _algebraAdapter;
    }

    function swap(uint256 _amount, address _to) external payable {
        IERC20(bridgedUSDC).transferFrom(msg.sender, address(this), _amount);
        IERC20(bridgedUSDC).approve(yakRouter, _amount);

/* [
    "5000",
    "995058672571716153",
    [
        "0x401ecb1d350407f13ba348573e5630b83638e30d",
        "0xfa3ed70386b9255fc04aa008a8ad1b0cda816fac"
    ],
    [
        "0x8c945644cad6a78caa7955b6f333bc7d8a0c39fb"
    ],
    [
        "0x8c945644cad6a78caa7955b6f333bc7d8a0c39fb"
    ]
] */
        Trade memory trade = Trade({
            amountIn: _amount,
            amountOut: 0,
            path: new address[](2),
            adapters: new address[](1),
            recipients: new address[](1)
        });

        trade.path[0] = bridgedUSDC;
        trade.path[1] = wg7;
        trade.adapters[0] = algebraAdapter;
        trade.recipients[0] = algebraAdapter;
        
        IYakRouter(yakRouter).swapNoSplitToETH(trade, 0, _to);
    }
}
