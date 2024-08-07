# ERC20
[Git Source](https://github.com/G7DAO/protocol/blob/f319967a9c724fe4c96f2e162afd527a52929919/contracts/token/ERC20.sol)

**Inherits:**
[IERC20](/contracts/interfaces/IERC20.sol/interface.IERC20.md)

**Author:**
Game7 Engineering Team - engineering@game7.io

*Adapted from WETH9: https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code*


## State Variables
### name

```solidity
string public name;
```


### symbol

```solidity
string public symbol;
```


### decimals

```solidity
uint8 public decimals;
```


### totalSupply

```solidity
uint256 public totalSupply;
```


### balanceOf

```solidity
mapping(address => uint256) public balanceOf;
```


### allowance

```solidity
mapping(address => mapping(address => uint256)) public allowance;
```


## Functions
### constructor


```solidity
constructor(string memory _tokenName, string memory _symbol, uint8 _decimals, uint256 _totalSupply);
```

### approve


```solidity
function approve(address spender, uint256 amount) external returns (bool);
```

### transfer


```solidity
function transfer(address to, uint256 amount) external returns (bool);
```

### transferFrom


```solidity
function transferFrom(address from, address to, uint256 amount) public returns (bool);
```

