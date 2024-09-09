# `DropperV3Facet`: Execution flows for DropperV3, Game7's distirbution protocol

This document enumerates the known execution flows for the [`DropperV3Facet`](../contracts/drops/dropper-V3/DropperV3Facet.sol)
contract.

## Flows

### Deployment and setup

#### `DropperV3Facet-1`: Anybody should be able to deploy a Dropper contract.

Any account should be able to deploy a `DropperV3Facet` contract. The constructor should not revert.

