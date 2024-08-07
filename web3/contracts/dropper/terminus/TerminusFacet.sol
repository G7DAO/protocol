// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 *
 * This is an implementation of the Terminus decentralized authorization contract.
 *
 * Terminus users can create authorization pools. Each authorization pool has the following properties:
 * 1. Controller: The address that controls the pool. Initially set to be the address of the pool creator.
 * 2. Pool URI: Metadata URI for the authorization pool.
 * 3. Pool capacity: The total number of tokens that can be minted in that authorization pool.
 * 4. Pool supply: The number of tokens that have actually been minted in that authorization pool.
 * 5. Transferable: A boolean value which denotes whether or not tokens from that pool can be transfered
 *    between addresses. (Note: Implemented by TerminusStorage.poolNotTransferable since we expect most
 *    pools to be transferable. This negation is better for storage + gas since false is default value
 *    in map to bool.)
 * 6. Burnable: A boolean value which denotes whether or not tokens from that pool can be burned.
 */

pragma solidity ^0.8.0;

import "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./ERC1155WithTerminusStorage.sol";
import "./LibTerminus.sol";
import {LibDiamondMoonstream as LibDiamond} from "../diamond/libraries/LibDiamondMoonstream.sol";

contract TerminusFacet is ERC1155WithTerminusStorage {
    constructor() {
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.controller = msg.sender;
    }

    event PoolMintBatch(
        uint256 indexed id,
        address indexed operator,
        address from,
        address[] toAddresses,
        uint256[] amounts
    );

    function setController(address newController) external {
        LibTerminus.enforceIsController();
        LibTerminus.setController(newController);
    }

    function poolMintBatch(
        uint256 id,
        address[] memory toAddresses,
        uint256[] memory amounts
    ) public {
        require(
            toAddresses.length == amounts.length,
            "TerminusFacet: _poolMintBatch -- toAddresses and amounts length mismatch"
        );
        address operator = _msgSender();
        require(
            isApprovedForPool(id, operator),
            "TerminusFacet: poolMintBatch -- caller is neither owner nor approved"
        );

        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();

        uint256 i = 0;
        uint256 totalAmount = 0;

        for (i = 0; i < toAddresses.length; i++) {
            address to = toAddresses[i];
            uint256 amount = amounts[i];
            require(
                to != address(0),
                "TerminusFacet: _poolMintBatch -- cannot mint to zero address"
            );
            totalAmount += amount;
            ts.poolBalances[id][to] += amount;
            emit TransferSingle(operator, address(0), to, id, amount);
        }

        require(
            ts.poolSupply[id] + totalAmount <= ts.poolCapacity[id],
            "TerminusFacet: _poolMintBatch -- Minted tokens would exceed pool capacity"
        );
        ts.poolSupply[id] += totalAmount;

        emit PoolMintBatch(id, operator, address(0), toAddresses, amounts);
    }

    function terminusController() external view returns (address) {
        return LibTerminus.terminusStorage().controller;
    }

    function paymentToken() external view returns (address) {
        return LibTerminus.terminusStorage().paymentToken;
    }

    function setPaymentToken(address newPaymentToken) external {
        LibTerminus.enforceIsController();
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.paymentToken = newPaymentToken;
    }

    function poolBasePrice() external view returns (uint256) {
        return LibTerminus.terminusStorage().poolBasePrice;
    }

    function setPoolBasePrice(uint256 newBasePrice) external {
        LibTerminus.enforceIsController();
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.poolBasePrice = newBasePrice;
    }

    function _paymentTokenContract() internal view returns (IERC20) {
        address paymentTokenAddress = LibTerminus
            .terminusStorage()
            .paymentToken;
        require(
            paymentTokenAddress != address(0),
            "TerminusFacet: Payment token has not been set"
        );
        return IERC20(paymentTokenAddress);
    }

    function withdrawPayments(address toAddress, uint256 amount) external {
        LibTerminus.enforceIsController();
        require(
            _msgSender() == toAddress,
            "TerminusFacet: withdrawPayments -- Controller can only withdraw to self"
        );
        IERC20 paymentTokenContract = _paymentTokenContract();
        paymentTokenContract.transfer(toAddress, amount);
    }

    function contractURI() public view returns (string memory) {
        return LibTerminus.terminusStorage().contractURI;
    }

    function setContractURI(string memory _contractURI) external {
        LibTerminus.enforceIsController();
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.contractURI = _contractURI;
    }

    function setURI(uint256 poolID, string memory poolURI) external {
        LibTerminus.enforcePoolIsController(poolID, _msgSender());
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.poolURI[poolID] = poolURI;
    }

    function totalPools() external view returns (uint256) {
        return LibTerminus.terminusStorage().currentPoolID;
    }

    function setPoolController(uint256 poolID, address newController) external {
        LibTerminus.enforcePoolIsController(poolID, msg.sender);
        LibTerminus.setPoolController(poolID, newController);
    }

    function terminusPoolController(
        uint256 poolID
    ) external view returns (address) {
        return LibTerminus.terminusStorage().poolController[poolID];
    }

    function terminusPoolCapacity(
        uint256 poolID
    ) external view returns (uint256) {
        return LibTerminus.terminusStorage().poolCapacity[poolID];
    }

    function terminusPoolSupply(
        uint256 poolID
    ) external view returns (uint256) {
        return LibTerminus.terminusStorage().poolSupply[poolID];
    }

    function poolIsTransferable(uint256 poolID) external view returns (bool) {
        return !LibTerminus.terminusStorage().poolNotTransferable[poolID];
    }

    function poolIsBurnable(uint256 poolID) external view returns (bool) {
        return LibTerminus.terminusStorage().poolBurnable[poolID];
    }

    function setPoolTransferable(uint256 poolID, bool transferable) external {
        LibTerminus.enforcePoolIsController(poolID, msg.sender);
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.poolNotTransferable[poolID] = !transferable;
    }

    function setPoolBurnable(uint256 poolID, bool burnable) external {
        LibTerminus.enforcePoolIsController(poolID, msg.sender);
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        ts.poolBurnable[poolID] = burnable;
    }

    function createSimplePool(uint256 _capacity) external returns (uint256) {
        LibTerminus.enforceIsController();
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        uint256 requiredPayment = ts.poolBasePrice;

        if (requiredPayment > 0) {
            IERC20 paymentTokenContract = _paymentTokenContract();
            require(
                paymentTokenContract.allowance(_msgSender(), address(this)) >=
                    requiredPayment,
                "TerminusFacet: createSimplePool -- Insufficient allowance on payment token"
            );
            require(
                paymentTokenContract.transferFrom(
                    msg.sender,
                    address(this),
                    requiredPayment
                ),
                "TerminusFacet: createSimplePool -- Transfer of payment token was unsuccessful"
            );
        }
        return LibTerminus.createSimplePool(_capacity);
    }

    function createPoolV1(
        uint256 _capacity,
        bool _transferable,
        bool _burnable
    ) external returns (uint256) {
        LibTerminus.enforceIsController();
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        uint256 requiredPayment = ts.poolBasePrice;
        if (requiredPayment > 0) {
            IERC20 paymentTokenContract = _paymentTokenContract();
            require(
                paymentTokenContract.allowance(_msgSender(), address(this)) >=
                    requiredPayment,
                "TerminusFacet: createPoolV1 -- Insufficient allowance on payment token"
            );
            require(
                paymentTokenContract.transferFrom(
                    msg.sender,
                    address(this),
                    requiredPayment
                ),
                "TerminusFacet: createPoolV1 -- Transfer of payment token was unsuccessful"
            );
        }
        uint256 poolID = LibTerminus.createSimplePool(_capacity);
        if (!_transferable) {
            ts.poolNotTransferable[poolID] = true;
        }
        if (_burnable) {
            ts.poolBurnable[poolID] = true;
        }
        return poolID;
    }

    function createPoolV2(
        uint256 _capacity,
        bool _transferable,
        bool _burnable,
        string memory poolURI
    ) external returns (uint256) {
        LibTerminus.enforceIsController();
        LibTerminus.TerminusStorage storage ts = LibTerminus.terminusStorage();
        uint256 requiredPayment = ts.poolBasePrice;
        if (requiredPayment > 0) {
            IERC20 paymentTokenContract = _paymentTokenContract();
            require(
                paymentTokenContract.allowance(_msgSender(), address(this)) >=
                    requiredPayment,
                "TerminusFacet: createPoolV2 -- Insufficient allowance on payment token"
            );
            require(
                paymentTokenContract.transferFrom(
                    msg.sender,
                    address(this),
                    requiredPayment
                ),
                "TerminusFacet: createPoolV2 -- Transfer of payment token was unsuccessful"
            );
        }
        uint256 poolID = LibTerminus.createSimplePool(_capacity);
        if (!_transferable) {
            ts.poolNotTransferable[poolID] = true;
        }
        if (_burnable) {
            ts.poolBurnable[poolID] = true;
        }
        ts.poolURI[poolID] = poolURI;
        return poolID;
    }

    function mint(
        address to,
        uint256 poolID,
        uint256 amount,
        bytes memory data
    ) external {
        require(
            isApprovedForPool(poolID, msg.sender),
            "TerminusFacet: mint -- caller is neither owner nor approved"
        );
        _mint(to, poolID, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory poolIDs,
        uint256[] memory amounts,
        bytes memory data
    ) external {
        for (uint256 i = 0; i < poolIDs.length; i++) {
            require(
                isApprovedForPool(poolIDs[i], msg.sender),
                "TerminusFacet: mintBatch -- caller is neither owner nor approved"
            );
        }
        _mintBatch(to, poolIDs, amounts, data);
    }

    function burn(address from, uint256 poolID, uint256 amount) external {
        address operator = _msgSender();
        require(
            operator == from || isApprovedForPool(poolID, operator),
            "TerminusFacet: burn -- caller is neither owner nor approved"
        );
        _burn(from, poolID, amount);
    }
}
