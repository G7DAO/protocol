# ERC1155WithTerminusStorage
[Git Source](https://github.com/G7DAO/protocol/blob/f0f83a37294cdf00eb87c0478d9db8879b5b60dc/contracts/security/terminus/ERC1155WithTerminusStorage.sol)

**Inherits:**
Context, ERC165, IERC1155, IERC1155MetadataURI

Authors: Moonstream Engineering (engineering@moonstream.to)
GitHub: https://github.com/bugout-dev/dao
An ERC1155 implementation which uses the Moonstream DAO common storage structure for proxies.
EIP1155: https://eips.ethereum.org/EIPS/eip-1155
The Moonstream contract is used to delegate calls from an EIP2535 Diamond proxy.
This implementation is adapted from the OpenZeppelin ERC1155 implementation:
https://github.com/OpenZeppelin/openzeppelin-contracts/tree/6bd6b76d1156e20e45d1016f355d154141c7e5b9/contracts/token/ERC1155


## Functions
### constructor


```solidity
constructor();
```

### supportsInterface

*See [IERC165-supportsInterface](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#supportsinterface).*


```solidity
function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool);
```

### uri


```solidity
function uri(uint256 poolID) public view virtual override returns (string memory);
```

### balanceOf

*See [IERC1155-balanceOf](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#balanceof).
Requirements:
- `account` cannot be the zero address.*


```solidity
function balanceOf(address account, uint256 id) public view virtual override returns (uint256);
```

### balanceOfBatch

*See [IERC1155-balanceOfBatch](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#balanceofbatch).
Requirements:
- `accounts` and `ids` must have the same length.*


```solidity
function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
    public
    view
    virtual
    override
    returns (uint256[] memory);
```

### setApprovalForAll

*See [IERC1155-setApprovalForAll](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#setapprovalforall).*


```solidity
function setApprovalForAll(address operator, bool approved) public virtual override;
```

### isApprovedForAll

*See [IERC1155-isApprovedForAll](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#isapprovedforall).*


```solidity
function isApprovedForAll(address account, address operator) public view virtual override returns (bool);
```

### isApprovedForPool


```solidity
function isApprovedForPool(uint256 poolID, address operator) public view returns (bool);
```

### approveForPool


```solidity
function approveForPool(uint256 poolID, address operator) external;
```

### unapproveForPool


```solidity
function unapproveForPool(uint256 poolID, address operator) external;
```

### safeTransferFrom

*See [IERC1155-safeTransferFrom](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#safetransferfrom).*


```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data)
    public
    virtual
    override;
```

### safeBatchTransferFrom

*See [IERC1155-safeBatchTransferFrom](/contracts/security/terminus/interfaces/ITerminus.sol/interface.ITerminus.md#safebatchtransferfrom).*


```solidity
function safeBatchTransferFrom(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) public virtual override;
```

### _safeTransferFrom

*Transfers `amount` tokens of token type `id` from `from` to `to`.
Emits a {TransferSingle} event.
Requirements:
- `to` cannot be the zero address.
- `from` must have a balance of tokens of type `id` of at least `amount`.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value.*


```solidity
function _safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) internal virtual;
```

### _safeBatchTransferFrom

*xref:ROOT:erc1155.adoc#batch-operations[Batched] version of [_safeTransferFrom](/contracts/security/terminus/ERC1155WithTerminusStorage.sol/contract.ERC1155WithTerminusStorage.md#_safetransferfrom).
Emits a {TransferBatch} event.
Requirements:
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value.*


```solidity
function _safeBatchTransferFrom(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) internal virtual;
```

### _mint

*Creates `amount` tokens of token type `id`, and assigns them to `to`.
Emits a {TransferSingle} event.
Requirements:
- `to` cannot be the zero address.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value.*


```solidity
function _mint(address to, uint256 id, uint256 amount, bytes memory data) internal virtual;
```

### _mintBatch

*xref:ROOT:erc1155.adoc#batch-operations[Batched] version of [_mint](/contracts/security/terminus/ERC1155WithTerminusStorage.sol/contract.ERC1155WithTerminusStorage.md#_mint).
Requirements:
- `ids` and `amounts` must have the same length.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value.*


```solidity
function _mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal virtual;
```

### _burn

*Destroys `amount` tokens of token type `id` from `from`
Requirements:
- `from` cannot be the zero address.
- `from` must have at least `amount` tokens of token type `id`.*


```solidity
function _burn(address from, uint256 id, uint256 amount) internal virtual;
```

### _burnBatch

*xref:ROOT:erc1155.adoc#batch-operations[Batched] version of [_burn](/contracts/security/terminus/ERC1155WithTerminusStorage.sol/contract.ERC1155WithTerminusStorage.md#_burn).
Requirements:
- `ids` and `amounts` must have the same length.*


```solidity
function _burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) internal virtual;
```

### _setApprovalForAll

*Approve `operator` to operate on all of `owner` tokens
Emits a {ApprovalForAll} event.*


```solidity
function _setApprovalForAll(address owner, address operator, bool approved) internal virtual;
```

### _beforeTokenTransfer

*Hook that is called before any token transfer. This includes minting
and burning, as well as batched variants.
The same hook is called on both single and batched variants. For single
transfers, the length of the `id` and `amount` arrays will be 1.
Calling conditions (for each `id` and `amount` pair):
- When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
of token type `id` will be  transferred to `to`.
- When `from` is zero, `amount` tokens of token type `id` will be minted
for `to`.
- when `to` is zero, `amount` of ``from``'s tokens of token type `id`
will be burned.
- `from` and `to` are never both zero.
- `ids` and `amounts` have the same, non-zero length.
To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].*


```solidity
function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) internal virtual;
```

### _doSafeTransferAcceptanceCheck


```solidity
function _doSafeTransferAcceptanceCheck(
    address operator,
    address from,
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
) private;
```

### _doSafeBatchTransferAcceptanceCheck


```solidity
function _doSafeBatchTransferAcceptanceCheck(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) private;
```

### _asSingletonArray


```solidity
function _asSingletonArray(uint256 element) private pure returns (uint256[] memory);
```

