// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/engine
 */

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "./LibDropper.sol";
import "../interfaces/IERC721Mint.sol";
import "../interfaces/ITerminus.sol";
import "../diamond/security/DiamondReentrancyGuard.sol";
import {LibDiamondMoonstream as LibDiamond} from "../diamond/libraries/LibDiamondMoonstream.sol";
import "../diamond/libraries/LibSignatures.sol";
import {TerminusPermissions} from "../terminus/TerminusPermissions.sol";
import "../libraries/TokenType.sol";

/**
 * @title Moonstream Dropper
 * @author Moonstream Engineering (engineering@moonstream.to)
 * @notice This contract manages drops for ERC20, ERC1155, and ERC721 tokens.
 */
contract DropperFacet is
    IERC721Receiver,
    ERC1155Holder,
    TerminusPermissions,
    DiamondReentrancyGuard
{
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
        uint256 amount
    );
    event DropStatusChanged(uint256 indexed dropId, bool status);
    event DropURIChanged(uint256 indexed dropId, string uri);
    event DropAuthorizationChanged(
        uint256 indexed dropId,
        address terminusAddress,
        uint256 poolId
    );
    event Withdrawal(
        address recipient,
        uint256 indexed tokenType,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        uint256 amount
    );

    address terminusAdminContractAddress;
    uint256 terminusAdminPoolID;
    constructor(address _terminusAdminContractAddress, uint256 _terminusAdminPoolId) {
        terminusAdminContractAddress = _terminusAdminContractAddress;
        terminusAdminPoolID = _terminusAdminPoolId;

    }


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



    function init() external {
        LibDiamond.enforceIsContractOwner();

        // Set up server side signing parameters for EIP712
        LibSignatures._setEIP712Parameters("Game7 Dropper", "0.3.0");

        // Initialize Terminus administration information
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();

        ds.TerminusAdminContractAddress = terminusAdminContractAddress;
        ds.TerminusAdminPoolID = terminusAdminPoolID;
    }

    function adminTerminusInfo() external view returns (address, uint) {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        return (ds.TerminusAdminContractAddress, ds.TerminusAdminPoolID);
    }

    function dropperVersion()
        public
        view
        returns (string memory, string memory)
    {
        LibSignatures.SignaturesStorage storage ss = LibSignatures
            .signaturesStorage();
        return (ss.name, ss.version);
    }

    function createDrop(
        uint256 tokenType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        address authorizationTokenAddress,
        uint256 authorizationPoolId,
        string memory uri
    ) external onlyTerminusAdmin payable returns (uint256) {
        require(
            tokenType == TokenType.erc20_type() ||
                tokenType == TokenType.erc721_type() ||
                tokenType == TokenType.erc1155_type() ||
                tokenType == TokenType.native_token_type() ||
                tokenType == TokenType.terminus_mintable_type(),
            "Dropper: createDrop -- Unknown token type"
        );

        require(
            amount != 0,
            "Dropper: createDrop -- Amount must be greater than 0"
        );

        require(
            tokenId == 0 || tokenType != TokenType.erc721_type(),
            "Dropper: createDrop -- TokenId should be zero for ERC721 drop."
        );

        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();

        ds.NumDrops++;

        DroppableToken memory tokenMetadata;
        tokenMetadata.tokenType = tokenType;
        tokenMetadata.tokenAddress = tokenAddress;
        tokenMetadata.tokenId = tokenId;
        tokenMetadata.amount = amount;
        ds.DropToken[ds.NumDrops] = tokenMetadata;
        emit DropCreated(ds.NumDrops, tokenType, tokenAddress, tokenId, amount);

        ds.IsDropActive[ds.NumDrops] = true;
        emit DropStatusChanged(ds.NumDrops, true);

        ds.DropAuthorizations[ds.NumDrops] = TerminusAuthorization({
            terminusAddress: authorizationTokenAddress,
            poolId: authorizationPoolId
        });
        emit DropAuthorizationChanged(
            ds.NumDrops,
            authorizationTokenAddress,
            authorizationPoolId
        );

        ds.DropURI[ds.NumDrops] = uri;
        emit DropURIChanged(ds.NumDrops, uri);

        return ds.NumDrops;
    }

    function numDrops() external view returns (uint256) {
        return LibDropper.dropperStorage().NumDrops;
    }

    function getDrop(
        uint256 dropId
    ) public view returns (DroppableToken memory) {
        return LibDropper.dropperStorage().DropToken[dropId];
    }

    function setDropStatus(
        uint256 dropId,
        bool status
    ) external onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.IsDropActive[dropId] = status;
        emit DropStatusChanged(dropId, status);
    }

    function dropStatus(uint256 dropId) external view returns (bool) {
        return LibDropper.dropperStorage().IsDropActive[dropId];
    }

    function setDropAuthorization(
        uint256 dropId,
        address terminusAddress,
        uint256 poolId
    ) public onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.DropAuthorizations[dropId] = TerminusAuthorization({
            terminusAddress: terminusAddress,
            poolId: poolId
        });
        emit DropAuthorizationChanged(dropId, terminusAddress, poolId);
    }

    function getDropAuthorization(
        uint256 dropId
    ) external view returns (TerminusAuthorization memory) {
        return LibDropper.dropperStorage().DropAuthorizations[dropId];
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

    function _claim(
        uint256 dropId,
        uint256 requestID,
        uint256 blockDeadline,
        uint256 amount,
        address signer,
        bytes memory signature
    ) internal virtual {
        require(
            block.timestamp <= blockDeadline,
            "Dropper: _claim -- Block deadline exceeded."
        );

        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();

        ITerminus authorizationTerminus = ITerminus(
            ds.DropAuthorizations[dropId].terminusAddress
        );
        require(
            authorizationTerminus.balanceOf(
                signer,
                ds.DropAuthorizations[dropId].poolId
            ) > 0,
            "Dropper: _claim -- Unauthorized signer for drop"
        );

        require(
            ds.IsDropActive[dropId],
            "Dropper: _claim -- cannot claim inactive drop"
        );

        require(
            !ds.DropRequestClaimed[dropId][requestID],
            "Dropper: _claim -- That (dropID, requestID) pair has already been claimed"
        );

        bytes32 hash = claimMessageHash(
            dropId,
            requestID,
            msg.sender,
            blockDeadline,
            amount
        );
        require(
            SignatureChecker.isValidSignatureNow(signer, hash, signature),
            "Dropper: _claim -- Invalid signature for claim."
        );

        DroppableToken memory claimToken = ds.DropToken[dropId];

        // ERC721 drop type passes the token id as the amount. There should be no default token id.
        if (amount == 0 && claimToken.tokenType != TokenType.erc721_type()) {
            amount = claimToken.amount;
        }

        if (claimToken.tokenType == TokenType.erc20_type()) {
            IERC20 erc20Contract = IERC20(claimToken.tokenAddress);
            erc20Contract.transfer(msg.sender, amount);
        } else if (claimToken.tokenType == TokenType.erc721_type()) {
            IERC721 erc721Contract = IERC721(claimToken.tokenAddress);
            erc721Contract.safeTransferFrom(
                address(this),
                msg.sender,
                amount,
                ""
            );
        } else if (claimToken.tokenType == TokenType.erc1155_type()) {
            IERC1155 erc1155Contract = IERC1155(claimToken.tokenAddress);
            erc1155Contract.safeTransferFrom(
                address(this),
                msg.sender,
                claimToken.tokenId,
                amount,
                ""
            );
        } else if (claimToken.tokenType == TokenType.terminus_mintable_type()) {
            ITerminus terminusFacetContract = ITerminus(
                claimToken.tokenAddress
            );
            terminusFacetContract.mint(
                msg.sender,
                claimToken.tokenId,
                amount,
                ""
            );
        } else {
            revert("Dropper: _claim -- Unknown token type in claim");
        }

        ds.DropRequestClaimed[dropId][requestID] = true;

        emit Claimed(dropId, msg.sender, signer, requestID, amount);
    }

    function claim(
        uint256 dropId,
        uint256 requestID,
        uint256 blockDeadline,
        uint256 amount,
        address signer,
        bytes memory signature
    ) public virtual diamondNonReentrant {
        _claim(dropId, requestID, blockDeadline, amount, signer, signature);
    }

    function batchClaim(
        uint256[] memory dropIDList,
        uint256[] memory requestIDList,
        uint256[] memory blockDeadlineList,
        uint256[] memory amountList,
        address[] memory signerList,
        bytes[] memory signatureList
    ) public virtual diamondNonReentrant {
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

        uint256 i = 0;
        for (i = 0; i < dropIDList.length; i++) {
            _claim(
                dropIDList[i],
                requestIDList[i],
                blockDeadlineList[i],
                amountList[i],
                signerList[i],
                signatureList[i]
            );
        }
    }

    function claimStatus(
        uint256 dropId,
        uint256 requestId
    ) external view returns (bool) {
        return
            LibDropper.dropperStorage().DropRequestClaimed[dropId][requestId];
    }

    function withdrawERC20(
        address tokenAddress,
        uint256 amount
    ) public onlyTerminusAdmin {
        IERC20 erc20Contract = IERC20(tokenAddress);
        erc20Contract.transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, TokenType.erc20_type(), tokenAddress, 0, amount);
    }

    function withdrawERC721(
        address tokenAddress,
        uint256 tokenId
    ) public onlyTerminusAdmin {
        IERC721 erc721Contract = IERC721(tokenAddress);
        erc721Contract.safeTransferFrom(address(this), msg.sender, tokenId, "");
        emit Withdrawal(msg.sender, TokenType.erc721_type(), tokenAddress, tokenId, 1);
    }

    function withdrawERC1155(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) public onlyTerminusAdmin {
        IERC1155 erc1155Contract = IERC1155(tokenAddress);
        erc1155Contract.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            amount,
            ""
        );
        emit Withdrawal(
            msg.sender,
            TokenType.erc1155_type(),
            tokenAddress,
            tokenId,
            amount
        );
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

    function setDropUri(
        uint256 dropId,
        string memory uri
    ) external onlyTerminusAdmin {
        LibDropper.DropperStorage storage ds = LibDropper.dropperStorage();
        ds.DropURI[dropId] = uri;
        emit DropURIChanged(dropId, uri);
    }
}
