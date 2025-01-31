# DateTime
[Git Source](https://github.com/G7DAO/protocol/blob/874893f46ced0a2b968b4e0f586d9ae4b81435ce/contracts/utils/DateTime.sol)

**Author:**
@pipermerriam on GitHub

This Solidity library is not written by Game7. It is written by @pipermerriam.
You can find the full code here: https://github.com/pipermerriam/ethereum-datetime/blob/master/contracts/DateTime.sol
Modifications made:
- Changed into a library
- Solidity version changed to fit our compiler


## State Variables
### DAY_IN_SECONDS

```solidity
uint256 constant DAY_IN_SECONDS = 86400;
```


### YEAR_IN_SECONDS

```solidity
uint256 constant YEAR_IN_SECONDS = 31536000;
```


### LEAP_YEAR_IN_SECONDS

```solidity
uint256 constant LEAP_YEAR_IN_SECONDS = 31622400;
```


### HOUR_IN_SECONDS

```solidity
uint256 constant HOUR_IN_SECONDS = 3600;
```


### MINUTE_IN_SECONDS

```solidity
uint256 constant MINUTE_IN_SECONDS = 60;
```


### ORIGIN_YEAR

```solidity
uint16 constant ORIGIN_YEAR = 1970;
```


## Functions
### isLeapYear


```solidity
function isLeapYear(uint16 year) internal pure returns (bool);
```

### leapYearsBefore


```solidity
function leapYearsBefore(uint256 year) internal pure returns (uint256);
```

### getDaysInMonth


```solidity
function getDaysInMonth(uint8 month, uint16 year) internal pure returns (uint8);
```

### parseTimestamp


```solidity
function parseTimestamp(uint256 timestamp) internal pure returns (_DateTime memory dt);
```

### getYear


```solidity
function getYear(uint256 timestamp) internal pure returns (uint16);
```

### getMonth


```solidity
function getMonth(uint256 timestamp) internal pure returns (uint8);
```

### getDay


```solidity
function getDay(uint256 timestamp) internal pure returns (uint8);
```

### getHour


```solidity
function getHour(uint256 timestamp) internal pure returns (uint8);
```

### getMinute


```solidity
function getMinute(uint256 timestamp) internal pure returns (uint8);
```

### getSecond


```solidity
function getSecond(uint256 timestamp) internal pure returns (uint8);
```

### getWeekday


```solidity
function getWeekday(uint256 timestamp) internal pure returns (uint8);
```

### toTimestamp


```solidity
function toTimestamp(uint16 year, uint8 month, uint8 day) internal pure returns (uint256 timestamp);
```

### toTimestamp


```solidity
function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour) internal pure returns (uint256 timestamp);
```

### toTimestamp


```solidity
function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute)
    internal
    pure
    returns (uint256 timestamp);
```

### toTimestamp


```solidity
function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute, uint8 second)
    internal
    pure
    returns (uint256 timestamp);
```

## Structs
### _DateTime

```solidity
struct _DateTime {
    uint16 year;
    uint8 month;
    uint8 day;
    uint8 hour;
    uint8 minute;
    uint8 second;
    uint8 weekday;
}
```

