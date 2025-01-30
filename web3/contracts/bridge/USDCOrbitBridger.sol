// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IWETH } from "../interfaces/IWETH.sol";
import { ITokenGateway } from "../interfaces/ITokenGateway.sol";
import { IERC20 } from "../interfaces/IERC20.sol";

/**
 * @title USDCBridger
 * @author Game7 Engineering - worldbuilder@game7.io
 * @notice This contract is used to bridge USDC to Orbit Chains in a single transaction.
 */
contract USDCOrbitBridger {
    uint256 public constant DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = 300;
    uint256 public constant DEFAULT_GAS_LIMIT = 300_000;

    address public standardGateway;
    address public router;
    address public customNativeToken;
    address public usdc;
    constructor(address _standardGateway, address _router, address _usdc, address _customNativeToken) {
        standardGateway = _standardGateway;
        router = _router;
        usdc = _usdc;
        customNativeToken = _customNativeToken;
    }

    function bridgeUSDC(address _receiver, uint256 _amount) external {
        IERC20(usdc).transferFrom(msg.sender, address(this), _amount);
        IERC20(usdc).approve(standardGateway, _amount);

        bytes memory outboundCalldata = ITokenGateway(router).getOutboundCalldata(
            usdc,
            address(this),
            _receiver,
            _amount,
            ""
        );
        uint256 gasPriceBid = block.basefee;
        uint256 maxSubmissionCost = calculateRetryableSubmissionFee(outboundCalldata, gasPriceBid);
        uint256 executionCost = DEFAULT_GAS_LIMIT * gasPriceBid;
        uint256 tokenTotalFeeAmount = maxSubmissionCost + executionCost;
        bytes memory encodedRouterData = abi.encode(maxSubmissionCost, "", tokenTotalFeeAmount);

        if (customNativeToken != address(0)) {
            IERC20(customNativeToken).transferFrom(msg.sender, address(this), tokenTotalFeeAmount);
            IERC20(customNativeToken).approve(standardGateway, tokenTotalFeeAmount);
        }

        ITokenGateway(router).outboundTransfer(
            usdc,
            _receiver,
            _amount,
            DEFAULT_GAS_LIMIT,
            gasPriceBid,
            encodedRouterData
        );
    }

    function calculateRetryableSubmissionFee(bytes memory _calldata, uint256 _baseFee) public pure returns (uint256) {
        uint256 multiplier = 1400 + (6 * _calldata.length);
        uint256 submissionFee = multiplier * _baseFee;
        uint256 increasedSubmissionFee = (submissionFee * (100 + DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE)) / 100;

        return increasedSubmissionFee;
    }
}
