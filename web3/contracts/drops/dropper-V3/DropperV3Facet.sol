// SPDX-License-Identifier: MIT

/**
 * Authors: Game7 World Builder
 * Email: worldbuilder@game7.io
 */

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "./LibDropperV3.sol";
import "./interfaces/IERC721Mint.sol";
import "./interfaces/ITerminus.sol";
import "./diamond/security/DiamondReentrancyGuard.sol";
import { LibDiamondDropperV3 as LibDiamond } from "./diamond/libraries/LibDiamondDropperV3.sol";
import "./diamond/libraries/LibSignatures.sol";
import { TerminusPermissions } from "../../security/terminus/TerminusPermissions.sol";
import "../../libraries/TokenType.sol";

/**
 * @title Game7 Dropper
 * @author Game7 World Builder team:  worldbuilder@game7.io
 * @notice This contract manages drops for Native Tokens, ERC20, ERC1155, and ERC721 tokens.
 */
contract DropperV3Facet is ERC721Holder, ERC1155Holder, TerminusPermissions, DiamondReentrancyGuard {
    event Claimed(
        uint256 indexed dropId,
        address indexed claimant,
        address indexed signer,
        uint256 requestID,
        uint256 amount
    );
    event DropCreated(
        uint256 dropId,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 maxNumberOfTokens
    );
    event DropStatusChanged(uint256 indexed dropId, bool status);
    event DropMaxTokensChanged(uint256 indexed dropId, uint256 maxNumberOfTokens);
    event DropURIChanged(uint256 indexed dropId, string uri);
    event DropAuthorizationChanged(uint256 indexed dropId, address terminusAddress, uint256 poolId);

    modifier onlyTerminusAdmin() {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        require(
            _holdsPoolToken(
                ds.TerminusAdminContractAddress,
                ds.TerminusAdminPoolID,
                TokenType.terminus_mintable_type()
            ),
            "DropperFacet.onlyTerminusAdmin: Sender does not hold administrator token"
        );

        // Execute modified function
        _;
    }

    function init(address _terminusAdminContractAddress, uint256 _terminusAdminPoolId) external {
        LibDiamond.enforceIsContractOwner();

        // Set up server side signing parameters for EIP712
        LibSignatures._setEIP712Parameters("Game7 Dropper", "3.0");

        // Initialize Terminus administration information
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();

        ds.TerminusAdminContractAddress = _terminusAdminContractAddress;
        ds.TerminusAdminPoolID = _terminusAdminPoolId;
    }

    function adminTerminusInfo() external view returns (address, uint) {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        return (ds.TerminusAdminContractAddress, ds.TerminusAdminPoolID);
    }

    function dropperVersion() public view returns (string memory, string memory) {
        LibSignatures.SignaturesStorage storage ss = LibSignatures.signaturesStorage();
        return (ss.name, ss.version);
    }

    function createDrop(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        address authorizationTokenAddress,
        uint256 authorizationPoolId,
        uint256 maxNumberOfTokens,
        string memory uri
    ) external payable onlyTerminusAdmin returns (uint256) {
        require(
            tokenType == TokenType.erc20_type() ||
                tokenType == TokenType.erc721_type() ||
                tokenType == TokenType.erc1155_type() ||
                tokenType == TokenType.native_token_type() ||
                tokenType == TokenType.terminus_mintable_type(),
            "Dropper: createDrop -- Unknown token type"
        );

        require(
            tokenId == 0 || tokenType != TokenType.erc721_type(),
            "Dropper: createDrop -- TokenId should be zero for ERC721 drop."
        );

        require(
            tokenAddress == address(0) || tokenType != TokenType.native_token_type(),
            "Dropper: createDrop -- TokenAddress should equal address(0) for native drop"
        );

        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();

        ds.NumDrops++;

        DroppableToken memory tokenMetadata;
        tokenMetadata.tokenType = tokenType;
        tokenMetadata.tokenAddress = tokenAddress;
        tokenMetadata.tokenId = tokenId;
        tokenMetadata.amount = amount;
        tokenMetadata.maxNumberOfTokens = maxNumberOfTokens;
        ds.DropToken[ds.NumDrops] = tokenMetadata;
        emit DropCreated(ds.NumDrops, tokenType, tokenAddress, tokenId, amount, maxNumberOfTokens);

        ds.IsDropActive[ds.NumDrops] = true;
        emit DropStatusChanged(ds.NumDrops, true);

        ds.DropAuthorizations[ds.NumDrops] = TerminusAuthorization({
            terminusAddress: authorizationTokenAddress,
            poolId: authorizationPoolId
        });
        emit DropAuthorizationChanged(ds.NumDrops, authorizationTokenAddress, authorizationPoolId);

        emit DropMaxTokensChanged(ds.NumDrops, maxNumberOfTokens);

        ds.DropURI[ds.NumDrops] = uri;
        emit DropURIChanged(ds.NumDrops, uri);

        return ds.NumDrops;
    }

    function numDrops() external view returns (uint256) {
        return LibDropper.dropperStorage().NumDrops;
    }

    function getDrop(uint256 dropId) public view returns (DroppableToken memory) {
        return LibDropper.dropperStorage().DropToken[dropId];
    }

    function setMaxNumberOfTokens(uint256 dropId, uint256 maxNumberOfTokens) external onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.DropToken[dropId].maxNumberOfTokens = maxNumberOfTokens;
        emit DropMaxTokensChanged(dropId, maxNumberOfTokens);
    }

    function setDropStatus(uint256 dropId, bool status) external onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.IsDropActive[dropId] = status;
        emit DropStatusChanged(dropId, status);
    }

    function dropStatus(uint256 dropId) external view returns (bool) {
        return LibDropper.dropperStorage().IsDropActive[dropId];
    }

    function setDropAuthorization(uint256 dropId, address terminusAddress, uint256 poolId) public onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.DropAuthorizations[dropId] = TerminusAuthorization({ terminusAddress: terminusAddress, poolId: poolId });
        emit DropAuthorizationChanged(dropId, terminusAddress, poolId);
    }

    function getDropAuthorization(uint256 dropId) external view returns (TerminusAuthorization memory) {
        return LibDropper.dropperStorage().DropAuthorizations[dropId];
    }

    function claimDataMessageHash(
        uint256 dropId,
        uint256 requestID,
        address claimant,
        uint256 blockDeadline,
        uint256 amount,
        bytes memory data
    ) public view virtual returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "ClaimPayload(uint256 dropId,uint256 requestID,address claimant,uint256 blockDeadline,uint256 amount, bytes data)"
                ),
                dropId,
                requestID,
                claimant,
                blockDeadline,
                amount,
                data
            )
        );
        bytes32 digest = LibSignatures._hashTypedDataV4(structHash);
        return digest;
    }

    function claimMessageHash(
        uint256 dropId,
        uint256 requestID,
        address claimant,
        uint256 blockDeadline,
        uint256 amount
    ) public view virtual returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "ClaimPayload(uint256 dropId,uint256 requestID,address claimant,uint256 blockDeadline,uint256 amount)"
                ),
                dropId,
                requestID,
                claimant,
                blockDeadline,
                amount
            )
        );
        bytes32 digest = LibSignatures._hashTypedDataV4(structHash);
        return digest;
    }

    function _internalChecks(uint256 dropId, uint256 requestID, uint256 deadline, address signer) internal view {
        require(block.timestamp <= blockDeadline, "Dropper: _claim -- Block deadline exceeded.");

        LibDropper.DropperStorage memory ds = LibDropper.dropperStorage();

        ITerminus authorizationTerminus = ITerminus(ds.DropAuthorizations[dropId].terminusAddress);
        require(
            authorizationTerminus.balanceOf(signer, ds.DropAuthorizations[dropId].poolId) > 0,
            "Dropper: _claim -- Unauthorized signer for drop"
        );

        require(ds.IsDropActive[dropId], "Dropper: _claim -- cannot claim inactive drop");

        require(
            !ds.DropRequestClaimed[dropId][requestID],
            "Dropper: _claim -- That (dropID, requestID) pair has already been claimed"
        );
    }

    function _claim(
        uint256 dropId,
        uint256 requestID,
        uint256 blockDeadline,
        uint256 amount,
        address recipient,
        address signer,
        bytes memory data,
        bytes memory signature
    ) internal virtual {
        _internalChecks(dropId, requestID, blockDeadline, signer);
        if (data == "") {
            bytes32 hash = claimMessageHash(dropId, requestID, recipient, blockDeadline, amount);
            require(
                SignatureChecker.isValidSignatureNow(signer, hash, signature),
                "Dropper: _claim -- Invalid signature for claim."
            );
        } else {
            bytes32 hash = claimDataMessageHash(dropId, requestID, recipient, blockDeadline, amount, data);
            require(
                SignatureChecker.isValidSignatureNow(signer, hash, signature),
                "Dropper: _claim -- Invalid signature for claim."
            );
        }

        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        DroppableToken memory claimToken = ds.DropToken[dropId];

        // ERC721 drop type passes the token id as the amount. There should be no default token id.
        if (amount == 0 && claimToken.tokenType != TokenType.erc721_type()) {
            amount = claimToken.amount;
        }

        if (claimToken.tokenType == TokenType.erc20_type()) {
            IERC20 erc20Contract = IERC20(claimToken.tokenAddress);
            bool sent = erc20Contract.transfer(recipient, amount);
            require(sent, "Failed to send ERC20");
        } else if (claimToken.tokenType == TokenType.erc721_type()) {
            IERC721 erc721Contract = IERC721(claimToken.tokenAddress);
            erc721Contract.safeTransferFrom(address(this), recipient, amount, "");
            //Amount change after safeTransferFrom only on erc721. Since amount is used as tokenId for erc721 transfers
            amount = 1;
        } else if (claimToken.tokenType == TokenType.erc1155_type()) {
            IERC1155 erc1155Contract = IERC1155(claimToken.tokenAddress);
            erc1155Contract.safeTransferFrom(address(this), recipient, claimToken.tokenId, amount, "");
        } else if (claimToken.tokenType == TokenType.native_token_type()) {
            (bool sent, ) = payable(recipient).call{ value: amount }("");
            require(sent, "Failed to send Native Token");
        } else if (claimToken.tokenType == TokenType.terminus_mintable_type()) {
            ITerminus terminusFacetContract = ITerminus(claimToken.tokenAddress);
            terminusFacetContract.mint(recipient, claimToken.tokenId, amount, "");
        } else {
            revert("Dropper: _claim -- Unknown token type in claim");
        }

        require(
            ds.DropToken[dropId].claimCount + amount <= ds.DropToken[dropId].maxNumberOfTokens,
            "DF: Claims exceed Tokens to distribute"
        );
        ds.DropToken[dropId].claimCount += amount;

        ds.DropRequestClaimed[dropId][requestID] = true;

        emit Claimed(dropId, recipient, signer, requestID, amount);
    }

    function claim(
        uint256 dropId,
        uint256 requestID,
        uint256 blockDeadline,
        uint256 amount,
        address recipient,
        address signer,
        bytes memory signature
    ) public virtual diamondNonReentrant {
        _claim(dropId, requestID, blockDeadline, amount, recipient, signer, signature);
    }

    function batchClaim(
        uint256[] memory dropIDList,
        uint256[] memory requestIDList,
        uint256[] memory blockDeadlineList,
        uint256[] memory amountList,
        address[] memory recipientList,
        address[] memory signerList,
        bytes[] memory signatureList
    ) public virtual diamondNonReentrant {
        _batchClaim(dropIDList, requestIDList, blockDeadlineList, amountList, recipientList, signerList, signatureList);
    }

    function _batchClaim(
        uint256[] memory dropIDList,
        uint256[] memory requestIDList,
        uint256[] memory blockDeadlineList,
        uint256[] memory amountList,
        address[] memory recipientList,
        address[] memory signerList,
        bytes[] memory signatureList
    ) internal virtual {
        require(
            dropIDList.length == requestIDList.length,
            "Dropper: batchClaim -- dropIDList and requestIDList length mismatch"
        );
        require(
            dropIDList.length == blockDeadlineList.length,
            "Dropper: batchClaim -- dropIDList and blockDeadlineList length mismatch"
        );
        require(
            dropIDList.length == amountList.length,
            "Dropper: batchClaim -- dropIDList and amountList length mismatch"
        );
        require(
            dropIDList.length == signerList.length,
            "Dropper: batchClaim -- dropIDList and signerList length mismatch"
        );
        require(
            dropIDList.length == signatureList.length,
            "Dropper: batchClaim -- dropIDList and signatureList length mismatch"
        );
        require(
            recipientList.length == signatureList.length,
            "Dropper: batachClaim -- recipientList and signatureList length mismatch"
        );

        uint256 i = 0;
        for (i = 0; i < dropIDList.length; i++) {
            _claim(
                dropIDList[i],
                requestIDList[i],
                blockDeadlineList[i],
                amountList[i],
                recipientList[i],
                signerList[i],
                signatureList[i]
            );
        }
    }

    function claimStatus(uint256 dropId, uint256 requestId) external view returns (bool) {
        return LibDropper.dropperStorage().DropRequestClaimed[dropId][requestId];
    }

    function surrenderPoolControl(
        uint256 poolId,
        address terminusAddress,
        address newPoolController
    ) public onlyTerminusAdmin {
        ITerminus terminusFacetContract = ITerminus(terminusAddress);
        terminusFacetContract.setPoolController(poolId, newPoolController);
    }

    function dropUri(uint256 dropId) public view returns (string memory) {
        return LibDropper.dropperStorage().DropURI[dropId];
    }

    function setDropUri(uint256 dropId, string memory uri) external onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.DropURI[dropId] = uri;
        emit DropURIChanged(dropId, uri);
    }

    receive() external payable {}

    fallback() external payable {}
}
