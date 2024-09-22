
# `Dropper V3`: Execution flows for DropperV3Facet, handling token drops

This document outlines the execution flows for the `DropperV3Facet` contract, used to create, manage, and claim token drops in a permissionless way.

## Flows

### Deployment and setup

#### `DropperV3-1`: Anybody should be able to deploy a DropperV3Facet contract.

Any account should be able to deploy a `DropperV3Facet` contract. The constructor should not revert.

#### `DropperV3-2`: Create a new Native token drop

The contract should allow creating drops for ERC20 tokens. The function `createDrop` should be callable by any account to set up a drop, specifying parameters like the token address, drop ID, and amount. The transaction should emit a `DropCreated` event on success.

#### `DropperV3-3`: Create ERC20 token drop

The contract should also support ERC721 token drops. Like the ERC20 drop creation, it should emit a `DropCreated` event when successful. The ERC721 drop should have specific attributes like the tokenId and authorizationTokenAddress set accordingly.

#### `DropperV3-4`: Create ERC720 token drop

Support for ERC1155 token drops should be present. Like other token types, the `createDrop` function should accept parameters such as the token address, drop ID, and tokenId. The creation of a drop should emit a `DropCreated` event.

#### `DropperV3-5`: Create ERC1155 token drop

Support for ERC1155 token drops should be present. Like other token types, the `createDrop` function should accept parameters such as the token address, drop ID, and tokenId. The creation of a drop should emit a `DropCreated` event.

#### `DropperV3-6`: Reverting on unknown types

If a user attempts to claim a token from an unknown or unrecognized drop type, the contract should revert with the message: `'Dropper: _claim -- Unknown token type in claim'`.

#### `DropperV3-7`: Reverting on ERC721 drop creation if tokenId not zero

If a user attempts to create a ERC721 drop with a tokenId, the contract should revert with the message: `'Dropper: createDrop -- TokenId should be zero for ERC721 drop.'`.

#### Claim Function

#### `DropperV3-8`: Claim Native Token

The contract should allow users to claim native tokens from a created drop by providing the correct signature and drop details. The `claim` function must check for the validity of the drop and ensure that the signature matches the expected message. If successful, the token should be transferred, and the event `Claimed` should be emitted.

### `DropperV3-9`: Claim ERC20 Token 

The contract should allow users to claim ERC20 tokens from a created drop by providing the correct signature and drop details. The `claim` function must check for the validity of the drop and ensure that the signature matches the expected message. If successful, the token should be transferred, and the event `Claimed` should be emitted.

### `DropperV3-10`: Claim ERC721 Token

The contract should allow users to claim ERC721 tokens from a created drop by providing the correct signature and drop details. The `claim` function must check for the validity of the drop and ensure that the signature matches the expected message. If successful, the token should be transferred, and the event `Claimed` should be emitted.

### `DropperV3-11`: Claim ERC1155 Token

The contract should allow users to claim ERC1155 tokens from a created drop by providing the correct signature and drop details. The `claim` function must check for the validity of the drop and ensure that the signature matches the expected message. If successful, the token should be transferred, and the event `Claimed` should be emitted.