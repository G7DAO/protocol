// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from '../interfaces/IERC20.sol';
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Game7 Staking
 * @author Game7 Engineering Team - engineering@game7.io
 */
contract StakingTokens is ERC721Enumerable, ReentrancyGuard {

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

    function deposit(address _tokenAddress, uint256 _amount, uint256 _duration, address _receiver) external nonReentrant {
        require(_receiver != address(0), "Staking.deposit: receiver cannot be zero address");
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

    function withdraw(uint256 _tokenID, address _receiver) external nonReentrant {
        require(_receiver != address(0), "Staking.withdraw: receiver cannot be zero address");
        require(ownerOf(_tokenID) == msg.sender, "Staking.withdraw: deposit does not exist");

        Deposit memory userDeposit = _allDeposits[_tokenID];
        require(block.timestamp >= userDeposit.end, "Staking.withdraw: TOO SOON! YOU HAVE AWAKENED ME TOO SOON, EXECUTUS!");

        // remove Deposit
        _burn(_tokenID);

        // return tokens
        IERC20 depositToken = IERC20(userDeposit.tokenAddress);
        depositToken.transferFrom(address(this), _receiver, userDeposit.amount);
        emit Withdrawn(_tokenID, msg.sender, _receiver);
    }
  
}
