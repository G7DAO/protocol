// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IWETH } from "../interfaces/IWETH.sol";
import { IL1ArbitrumGateway } from "../interfaces/IL1ArbitrumGateway.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { IInboxBase } from "../interfaces/IInboxBase.sol";
import { IERC20Bridge } from "../interfaces/IERC20Bridge.sol";

/**
 * @title ERC20OrbitBridger
 * @author Game7 Engineering - worldbuilder@game7.io
 * @notice This contract is used to bridge any ERC20 token to Orbit Chains automatically calculating gas fees.
 * @dev This contract should not hold any funds.
 */
contract ERC20OrbitBridger {
    uint256 public constant DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE = 300;
    uint256 public constant DEFAULT_GAS_LIMIT = 300_000;
    bool public isReentrant;

    modifier nonReentrant() {
        require(!isReentrant, "ReentrancyGuard");
        isReentrant = true;
        _;
        isReentrant = false;
    }

    constructor() {}

    /**
     * @notice Bridge ERC20 token to Orbit Chain
     * @param _token Address of the ERC20 token to bridge
     * @param _amount Amount of the ERC20 token to bridge
     * @param _to Address of the recipient on the destination chain
     * @param _router Address of the L1ArbitrumGateway contract
     */
    function bridgeERC20(address _token,  uint256 _amount, address _to, address _router) external nonReentrant {
        address _gateway = IL1ArbitrumGateway(_router).getGateway(_token);
        address _inbox = IL1ArbitrumGateway(_router).inbox();
        address _bridge = IInboxBase(_inbox).bridge();
        address _nativeToken = IERC20Bridge(_bridge).nativeToken();
        
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        IERC20(_token).approve(_gateway, _amount);

        bytes memory outboundCalldata = IL1ArbitrumGateway(_router).getOutboundCalldata(
            _token,
            address(this),
            _to,
            _amount,
            ""
        );
        uint256 maxSubmissionCost = calculateRetryableSubmissionFee(outboundCalldata, block.basefee);
        uint256 tokenTotalFeeAmount = maxSubmissionCost + (DEFAULT_GAS_LIMIT * block.basefee);
        bytes memory encodedRouterData = abi.encode(maxSubmissionCost, "", tokenTotalFeeAmount);

        if (_nativeToken != address(0)) {
            IERC20(_nativeToken).transferFrom(msg.sender, address(this), tokenTotalFeeAmount);
            IERC20(_nativeToken).approve(_gateway, tokenTotalFeeAmount);
        }

        IL1ArbitrumGateway(_gateway).outboundTransfer(
            _token,
            _to,
            _amount,
            DEFAULT_GAS_LIMIT,
            block.basefee,
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
