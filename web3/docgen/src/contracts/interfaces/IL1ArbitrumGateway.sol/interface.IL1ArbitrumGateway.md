# IL1ArbitrumGateway
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/interfaces/IL1ArbitrumGateway.sol)

**Inherits:**
[IGatewayRouter](/contracts/interfaces/IGatewayRouter.sol/interface.IGatewayRouter.md)


## Functions
### inbox


```solidity
function inbox() external view returns (address);
```

### outboundTransferCustomRefund

Deposit ERC20 token from Ethereum into Arbitrum. If L2 side hasn't been deployed yet, includes name/symbol/decimals data for initial L2 deploy. Initiate by GatewayRouter.

*L2 address alias will not be applied to the following types of addresses on L1:
- an externally-owned account
- a contract in construction
- an address where a contract will be created
- an address where a contract lived, but was destroyed*


```solidity
function outboundTransferCustomRefund(
    address _l1Token,
    address _refundTo,
    address _to,
    uint256 _amount,
    uint256 _maxGas,
    uint256 _gasPriceBid,
    bytes calldata _data
) external payable returns (bytes memory);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_l1Token`|`address`|L1 address of ERC20|
|`_refundTo`|`address`|Account, or its L2 alias if it have code in L1, to be credited with excess gas refund in L2|
|`_to`|`address`|Account to be credited with the tokens in the L2 (can be the user's L2 account or a contract), not subject to L2 aliasing This account, or its L2 alias if it have code in L1, will also be able to cancel the retryable ticket and receive callvalue refund|
|`_amount`|`uint256`|Token Amount|
|`_maxGas`|`uint256`|Max gas deducted from user's L2 balance to cover L2 execution|
|`_gasPriceBid`|`uint256`|Gas price for L2 execution|
|`_data`|`bytes`|encoded data from router and user|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`bytes`|res abi encoded inbox sequence number|


