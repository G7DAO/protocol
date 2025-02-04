// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IWETH } from "../interfaces/IWETH.sol";
import { ITokenGateway } from "../interfaces/ITokenGateway.sol";
import { IERC20 } from "../interfaces/IERC20.sol";

/**
 * @title USDCBridger
 * @author Game7 Engineering - worldbuilder@game7.io
 * @notice This contract is used to bridge a single ERC20 token to Orbit Chain
 * @dev This contract should not hold any funds.
 */
contract USDCOrbitBridger {
    uint256 public constant DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = 300;
    uint256 public constant DEFAULT_GAS_LIMIT = 300_000;

    address public gateway;
    address public router;
    address public customNativeToken;
    address public usdc;

    /**
     * @notice Constructor
     * @param _gateway Address of the token gateway
     * @param _router Address of the router
     * @param _usdc Address of the USDC token
     * @param _customNativeToken Address of the custom native token
     */
    constructor(address _gateway, address _router, address _usdc, address _customNativeToken) {
        gateway = _gateway;
        router = _router;
        usdc = _usdc;
        customNativeToken = _customNativeToken;
    }

    /**
     * @notice Bridge USDC to Orbit Chain
     * @param _receiver Address of the recipient on the destination chain
     * @param _amount Amount of USDC to bridge
     */
    function bridgeUSDC(address _receiver, uint256 _amount) external {
        IERC20(usdc).transferFrom(msg.sender, address(this), _amount);
        IERC20(usdc).approve(gateway, _amount);

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
            IERC20(customNativeToken).approve(gateway, tokenTotalFeeAmount);
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

    /**
     * @notice Calculate the retryable submission fee
     * @param _calldata Calldata of the message to be sent
     * @param _baseFee Base fee of the chain
     */
    function calculateRetryableSubmissionFee(bytes memory _calldata, uint256 _baseFee) public pure returns (uint256) {
        uint256 multiplier = 1400 + (6 * _calldata.length);
        uint256 submissionFee = multiplier * _baseFee;
        uint256 increasedSubmissionFee = (submissionFee * (100 + DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE)) / 100;

        return increasedSubmissionFee;
    }
}
