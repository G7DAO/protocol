# ITokenGateway
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/interfaces/ITokenGateway.sol)


## Functions
### outboundTransfer

event deprecated in favor of DepositInitiated and WithdrawalInitiated

event deprecated in favor of DepositFinalized and WithdrawalFinalized


```solidity
function outboundTransfer(
    address _token,
    address _to,
    uint256 _amount,
    uint256 _maxGas,
    uint256 _gasPriceBid,
    bytes calldata _data
) external payable returns (bytes memory);
```

### finalizeInboundTransfer


```solidity
function finalizeInboundTransfer(address _token, address _from, address _to, uint256 _amount, bytes calldata _data)
    external
    payable;
```

### calculateL2TokenAddress

Calculate the address used when bridging an ERC20 token

*the L1 and L2 address oracles may not always be in sync.
For example, a custom token may have been registered but not deploy or the contract self destructed.*


```solidity
function calculateL2TokenAddress(address l1ERC20) external view returns (address);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`l1ERC20`|`address`|address of L1 token|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`address`|L2 address of a bridged ERC20 token|


### getOutboundCalldata


```solidity
function getOutboundCalldata(address _token, address _from, address _to, uint256 _amount, bytes memory _data)
    external
    view
    returns (bytes memory);
```

