// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IDEXW1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DEXW1155 is IDEXW1155, ERC20, ERC1155Holder,ReentrancyGuard{

    address _erc1155;
    uint256 _tokenId;
    string private _name;
    string private _symbol;

    address _creator;
    modifier creatorOnly{
        require(msg.sender == _creator, "Not Creator");
        _;
    }

    constructor()ERC20("Wrapper1155", "Wrapper1155"){

        _creator = msg.sender;
    }
    //used to initialize the important stuff
    function initialize(address _contract, uint256 _tokenid, string memory __name, string memory __symbol) external creatorOnly {
        _erc1155 = _contract;
        _tokenId =_tokenid;
        _name = __name;
        _symbol = __symbol;
        _creator = address(0);
    }

    function name()override public view returns(string memory){
        return _name;
    }

    function symbol() override public view returns(string memory){
        return _symbol;
    }

    //remove forgotten erc1155
    function skim1155(address to) external nonReentrant returns(uint256 amount){
        uint256 balance = IERC1155(_erc1155).balanceOf(address(this), _tokenId);
        if(balance > totalSupply()){
            amount = balance - totalSupply();
            IERC1155(_erc1155).safeTransferFrom(address(this), to, _tokenId, amount, "0x0");
        }
    }

    //Remove forgotten erc20 tokens
    function skim20(address to) external nonReentrant returns(uint256 amount){
        amount = balanceOf(address(this));
        _transfer(address(this), to, amount);

    }

    /// @notice Deposit ERC1155 tokenId to get wrapped ERC1155 as ERC20
    function deposit1155(address from, address to, uint256 amount) override external returns(uint256 _amount){
        IERC1155(_erc1155).safeTransferFrom(from, address(this), _tokenId, amount, "0x0");
        _amount = amount * 1 ether;
        _mint(to, _amount);

    }

    /// @notice Withdraw ERC1155 tokenId by sending in ERC20
    function withdraw1155(address from, address to, uint256 amount) override external nonReentrant returns(uint256 _amount){
        _amount = (amount / 1 ether);
        require (_amount > 0, "DEXW1155: 0 amount");
        transferFrom(from, address(this), _amount * 1 ether);
        _burn(address(this), _amount);
        IERC1155(_erc1155).safeTransferFrom(address(this), to, _tokenId, _amount, "0x0");
    }
}
