// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * Much of the functionality in this library is adapted from OpenZeppelin's EIP712 implementation:
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/draft-EIP712.sol
 */

import "@openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

library LibSignatures {
    bytes32 constant SIGNATURES_STORAGE_POSITION =
        keccak256("moonstreamdao.eth.storage.signatures");

    struct SignaturesStorage {
        string name;
        string version;
        bytes32 CACHED_DOMAIN_SEPARATOR;
        uint256 CACHED_CHAIN_ID;
        bytes32 HASHED_NAME;
        bytes32 HASHED_VERSION;
        bytes32 TYPE_HASH;
        mapping(uint256 => bool) completedRequests;
    }

    function signaturesStorage()
        internal
        pure
        returns (SignaturesStorage storage ss)
    {
        bytes32 position = SIGNATURES_STORAGE_POSITION;
        assembly {
            ss.slot := position
        }
    }

    function _buildDomainSeparator(
        bytes32 typeHash,
        bytes32 nameHash,
        bytes32 versionHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    typeHash,
                    nameHash,
                    versionHash,
                    block.chainid,
                    address(this)
                )
            );
    }

    function _setEIP712Parameters(string memory name, string memory version)
        internal
    {
        SignaturesStorage storage ss = signaturesStorage();
        ss.name = name;
        ss.version = version;
        bytes32 hashedName = keccak256(bytes(name));
        bytes32 hashedVersion = keccak256(bytes(version));
        bytes32 typeHash = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        ss.HASHED_NAME = hashedName;
        ss.HASHED_VERSION = hashedVersion;
        ss.CACHED_CHAIN_ID = block.chainid;
        ss.CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(
            typeHash,
            hashedName,
            hashedVersion
        );
        ss.TYPE_HASH = typeHash;
    }

    function _domainSeparatorV4() internal view returns (bytes32) {
        SignaturesStorage storage ss = signaturesStorage();
        if (block.chainid == ss.CACHED_CHAIN_ID) {
            return ss.CACHED_DOMAIN_SEPARATOR;
        } else {
            return
                _buildDomainSeparator(
                    ss.TYPE_HASH,
                    ss.HASHED_NAME,
                    ss.HASHED_VERSION
                );
        }
    }

    function _hashTypedDataV4(bytes32 structHash)
        internal
        view
        returns (bytes32)
    {
        return ECDSA.toTypedDataHash(_domainSeparatorV4(), structHash);
    }

    function _completeRequest(uint256 requestId) internal {
        SignaturesStorage storage ss = signaturesStorage();
        ss.completedRequests[requestId] = true;
    }

    function _clearRequest(uint256 requestId) internal {
        SignaturesStorage storage ss = signaturesStorage();
        ss.completedRequests[requestId] = false;
    }

    function _checkRequest(uint256 requestId) internal view returns (bool) {
        SignaturesStorage storage ss = signaturesStorage();
        return ss.completedRequests[requestId];
    }
}
