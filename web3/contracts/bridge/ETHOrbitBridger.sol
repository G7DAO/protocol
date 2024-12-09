// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IWETH } from "../interfaces/IWETH.sol";
import { ITokenGateway } from "../interfaces/ITokenGateway.sol";
import { IERC20 } from "../interfaces/IERC20.sol";

/**
 * @title ETHBridger
 * @author Game7 Engineering - worldbuilder@game7.io
 * @notice This contract is used to bridge ETH to Orbit Chains in a single transaction.
 */
contract ETHOrbitBridger {
    uint256 public constant DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = 300;
    uint256 public constant DEFAULT_GAS_LIMIT = 300_000;

    address public standardGateway;
    address public router;
    address public weth;
    address public customNativeToken;

    constructor(address _standardGateway, address _router, address _weth, address _customNativeToken) {
        standardGateway = _standardGateway;
        router = _router;
        weth = _weth;
        customNativeToken = _customNativeToken;
    }

    function bridge(address _receiver) external payable {
        require(msg.value > 0, "ETHOrbitBridger: No ETH sent");
        uint256 _amount = msg.value;
        IWETH(weth).deposit{ value: _amount }();
        IWETH(weth).approve(standardGateway, _amount);

        bytes memory outboundCalldata = ITokenGateway(router).getOutboundCalldata(
            weth,
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
            weth,
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
