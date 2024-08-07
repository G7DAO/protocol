// SPDX-License-Identifier: UNLICENSED
///@notice This contract is for mock for terminus token (used only for cli generation).
pragma solidity ^0.8.0;

import "../terminus/TerminusFacet.sol";

contract MockTerminus is TerminusFacet {
    constructor() {}
}
