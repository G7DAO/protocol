// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Game7 Nontransferable Staking Tokens
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract NontransferableStakingTokens is ERC721Enumerable, ReentrancyGuard {

    struct Deposit {
        address tokenAddress;
        uint256 amount;
        uint64 start;
        uint64 end;
    }

    uint256 public nextDeposit;
    mapping(uint256 => Deposit) private _allDeposits;

    event Deposited(address indexed tokenAddress, address indexed receiver, address indexed from, uint256 duration, uint256 amount);
    event Withdrawn(uint256 indexed depositId, address indexed from, address indexed receiver);

    constructor() ERC721("Staking Deposit Tokens", "SDT") {
    }

    function getDeposit(uint256 _tokenID) external view returns (Deposit memory) {
        return _allDeposits[_tokenID];
    }

    function _depositERC20(address _tokenAddress, uint256 _amount, uint256 _duration, address _receiver) internal {
        require(_amount > 0, "Staking.deposit: cannot deposit 0");

        uint256 tokenID = nextDeposit;
        _mint(_receiver, tokenID);

        IERC20 depositToken = IERC20(_tokenAddress);
        depositToken.transferFrom(msg.sender, address(this), _amount);

        _allDeposits[tokenID] = Deposit({
                                        tokenAddress: _tokenAddress,
                                        amount: _amount,
                                        start: uint64(block.timestamp),
                                        end: uint64(block.timestamp) + uint64(_duration)
                                    });


        nextDeposit += 1;

        emit Deposited(_tokenAddress, _receiver, msg.sender, _duration, _amount);
    }

    function _depositNative(uint256 _duration, address _receiver) internal {
        uint256 _amount = msg.value;
        require(_amount > 0, "Staking.deposit: cannot deposit 0");

        uint256 tokenID = nextDeposit;
        _mint(_receiver, tokenID);

        _allDeposits[tokenID] = Deposit({
                                        tokenAddress: address(0),
                                        amount: _amount,
                                        start: uint64(block.timestamp),
                                        end: uint64(block.timestamp) + uint64(_duration)
                                    });

        nextDeposit += 1;

        emit Deposited(address(0), _receiver, msg.sender, _duration, _amount);
    }

    function deposit(address _tokenAddress, uint256 _amount, uint256 _duration) external nonReentrant {
        _depositERC20(_tokenAddress, _amount, _duration, msg.sender);
    }

    function deposit(address _tokenAddress, uint256 _amount, uint256 _duration, address _receiver) external nonReentrant {
        require(_receiver != address(0), "Staking.deposit: receiver cannot be zero address");
        _depositERC20(_tokenAddress, _amount, _duration, _receiver);
    }

    function deposit(uint256 _duration) external payable nonReentrant {
        _depositNative(_duration, msg.sender);
    }

    function deposit(uint256 _duration, address _receiver) external payable nonReentrant {
        _depositNative(_duration, _receiver);
    }
    
    function _withdraw(uint256 _tokenID, address _receiver) internal {
        require(ownerOf(_tokenID) == msg.sender, "Staking.withdraw: deposit does not exist");

        Deposit memory userDeposit = _allDeposits[_tokenID];
        require(block.timestamp >= userDeposit.end, "Staking.withdraw: TOO SOON! YOU HAVE AWAKENED ME TOO SOON, EXECUTUS!");

        // remove Deposit
        _burn(_tokenID);

        // return deposit
        if (userDeposit.tokenAddress == address(0)) {
            (bool success, ) = _receiver.call{value: userDeposit.amount}("");
            require(success, "Staking.withdraw: Native token transfer failed");
        } else {
            IERC20 depositToken = IERC20(userDeposit.tokenAddress);
            depositToken.transferFrom(address(this), _receiver, userDeposit.amount);
        }

        emit Withdrawn(_tokenID, msg.sender, _receiver);
    }

    function withdraw(uint256 _tokenID) external nonReentrant {
        _withdraw(_tokenID, msg.sender);
    }

    function withdraw(uint256 _tokenID, address _receiver) external nonReentrant {
        require(_receiver != address(0), "Staking.withdraw: receiver cannot be zero address");
        _withdraw(_tokenID, _receiver);
    }
  
    function _metadata(uint256 _tokenID) internal view returns (bytes memory) {
        Deposit memory userDeposit = _allDeposits[_tokenID];

        // Creating json in chunked to avoid stack depth issue.
        bytes memory json = abi.encodePacked(
            '{"token_id":"',
            Strings.toString(_tokenID),
            '","image": "https://badges.moonstream.to/test/staking_logo.png"',
            ',"external_url":"https://www.example.com"',
            ',"metadata_version":1'
        );


        json = abi.encodePacked(
            json,
            ',"attributes":[',
            '{"display_type":"address", "trait_type":"Deposit Token","value":"',
            Strings.toHexString(userDeposit.tokenAddress),
            '"}',
            ',{"display_type":"string", "trait_type":"Deposit Amount","value":"',
            Strings.toString(userDeposit.amount),
            '"}',
            ',{"display_type":"date", "trait_type":"Deposit Start","value":',
            Strings.toString(userDeposit.start),
            '}',
            ',{"display_type":"date", "trait_type":"Deposit End","value":',
            Strings.toString(userDeposit.end),
            '}',
            "]}"
        );

        return json;
    }

    function metadataJSON(uint256 tokenId) public view returns (string memory) {
        return string(_metadata(tokenId));
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(_metadata(tokenId))));
    }


    // Disabling transfers
    function transferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/) public virtual override(ERC721, IERC721) {
        revert("Transfer from disabled");
    }

    function safeTransferFrom(address /*from*/, address /*to*/, uint256 /*tokenId*/, bytes memory /*_data*/) public virtual override(ERC721, IERC721) {
        revert("Safe transfer from disabled");
    }

    function approve(address /*to*/, uint256 /*tokenId*/) public virtual override(ERC721, IERC721) {
        revert("Approve disabled");
    }

    function setApprovalForAll(address /*operator*/, bool /*approved*/) public virtual override(ERC721, IERC721) {
        revert("Set approval for all disabled");
    }
}
