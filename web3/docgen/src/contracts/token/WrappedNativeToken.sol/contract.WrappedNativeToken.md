# WrappedNativeToken
[Git Source](https://github.com/G7DAO/protocol/blob/f319967a9c724fe4c96f2e162afd527a52929919/contracts/token/WrappedNativeToken.sol)

**Inherits:**
[IERC20](/contracts/interfaces/IERC20.sol/interface.IERC20.md)

**Author:**
Game7 Engineering Team - worldbuilder@game7.io

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
uint8 public constant decimals = 18;
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
constructor(string memory _tokenName, string memory _symbol);
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

### receive


```solidity
receive() external payable;
```

### deposit


```solidity
function deposit() public payable;
```

### withdraw


```solidity
function withdraw(uint256 _amount) public;
```

### totalSupply


```solidity
function totalSupply() public view returns (uint256);
```

## Events
### Deposit

```solidity
event Deposit(address indexed _to, uint256 _amount);
```

### Withdrawal

```solidity
event Withdrawal(address indexed from, uint256 _amount);
```

