# Metronome
[Git Source](https://github.com/G7DAO/protocol/blob/1e1f8f95881a2f3fd7dca8655f2c3270ce027c4e/contracts/metronome/Metronome.sol)

**Inherits:**
ReentrancyGuard


## State Variables
### Schedules

```solidity
mapping(uint256 => Schedule) public Schedules;
```


### ScheduleBalances

```solidity
mapping(uint256 => uint256) public ScheduleBalances;
```


### ClaimedBounties

```solidity
mapping(uint256 => mapping(uint256 => bool)) public ClaimedBounties;
```


### NumSchedules

```solidity
uint256 public NumSchedules;
```


## Functions
### createSchedule


```solidity
function createSchedule(uint256 remainder, uint256 divisor, uint256 bounty)
    external
    payable
    returns (uint256 scheduleID);
```

### increaseBalance


```solidity
function increaseBalance(uint256 scheduleID) external payable;
```

### _claim


```solidity
function _claim(uint256 scheduleID, address forAddress) internal;
```

### claim


```solidity
function claim(uint256 scheduleID, address forAddress) external nonReentrant;
```

### claimBatch


```solidity
function claimBatch(uint256[] memory scheduleIDs, address forAddress) external nonReentrant;
```

## Events
### ScheduleCreated

```solidity
event ScheduleCreated(uint256 indexed scheduleID, uint256 indexed remainder, uint256 indexed divisor, uint256 bounty);
```

### BalanceIncreased

```solidity
event BalanceIncreased(uint256 indexed scheduleID, uint256 amount);
```

### BountyClaimed

```solidity
event BountyClaimed(uint256 indexed scheduleID, address indexed forAddress, uint256 payment);
```

## Errors
### InvalidSchedule

```solidity
error InvalidSchedule();
```

