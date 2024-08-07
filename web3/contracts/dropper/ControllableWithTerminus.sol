// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 */

pragma solidity ^0.8.9;
import {TerminusFacet} from "./terminus/TerminusFacet.sol";
import "@openzeppelin-contracts/contracts/access/Ownable.sol";

abstract contract ControllableWithTerminus is Ownable {
    TerminusFacet private terminus;
    uint256 public administratorPoolId;

    constructor(
        address _terminusContractAddress,
        uint256 _administratorPoolId
    ) {
        terminus = TerminusFacet(_terminusContractAddress);
        administratorPoolId = _administratorPoolId;
    }

    /**
     * @dev throws if called by account that doesn't hold the administrator pool token
     * or is the contract owner
     */
    modifier onlyAdministrator() {
        require(
            terminus.balanceOf(msg.sender, administratorPoolId) > 0 ||
                msg.sender == owner(),
            "Lootbox.sol: Sender is not an administrator"
        );
        _;
    }

    function changeAdministratorPoolId(
        uint256 _administratorPoolId
    ) public onlyOwner {
        administratorPoolId = _administratorPoolId;
    }

    function grantAdminRole(address to) public onlyOwner {
        require(
            address(this) ==
                terminus.terminusPoolController(administratorPoolId),
            "The contract is not the pool controller for the administrator pool. Please transfer the controller role to the contract."
        );
        terminus.mint(to, administratorPoolId, 1, "");
    }

    function revokeAdminRole(address from) public onlyOwner {
        TerminusFacet terminusContract = TerminusFacet(terminus);
        require(
            address(this) ==
                terminusContract.terminusPoolController(administratorPoolId),
            "The contract is not the pool controller for the administrator pool. Please transfer the controller role to the contract."
        );

        uint256 balance = terminusContract.balanceOf(from, administratorPoolId);
        terminusContract.burn(from, administratorPoolId, balance);
    }
}
