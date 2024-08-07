// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

struct Slot {
    string SlotURI;
    bool SlotIsPersistent;
}

// EquippedItem represents an item equipped in a specific inventory slot for a specific ERC721 token.
struct EquippedItem {
    uint256 ItemType;
    address ItemAddress;
    uint256 ItemTokenId;
    uint256 Amount;
}

// Interface ID: c8a97a5b
//
// Calculated by solface: https://github.com/moonstream-to/solface
//
// To recalculate from root directory of this repo:
// $ jq .abi build/contracts/IInventory.json  | solface -name IInventory -annotations | grep "Interface ID:"
//
// Note: Change path to build/contracts/IInventory.json depending on where you are relative to the repo root.
interface IInventory {
    // This event should be emitted when the subject ERC721 contract address is set (or changes) on the
    // Inventory contract.
    event NewSubjectAddress(address indexed contractAddress);

    event SlotCreated(address indexed creator, uint256 slot);

    event ItemMarkedAsEquippableInSlot(
        uint256 indexed slot,
        uint256 indexed itemType,
        address indexed itemAddress,
        uint256 itemPoolId,
        uint256 maxAmount
    );

    event NewSlotURI(uint256 indexed slotId);

    event NewSlotPersistence(uint256 indexed slotId, bool persistent);

    event ItemEquipped(
        uint256 indexed subjectTokenId,
        uint256 indexed slot,
        uint256 itemType,
        address indexed itemAddress,
        uint256 itemTokenId,
        uint256 amount,
        address equippedBy
    );

    event ItemUnequipped(
        uint256 indexed subjectTokenId,
        uint256 indexed slot,
        uint256 itemType,
        address indexed itemAddress,
        uint256 itemTokenId,
        uint256 amount,
        address unequippedBy
    );

    function subject() external view returns (address);

    // Constraint: Admin
    // Emits: SlotCreated, NewSlotURI, NewSlotPersistence
    function createSlot(
        bool persistent,
        string memory slotURI
    ) external returns (uint256);

    function numSlots() external view returns (uint256);

    function getSlotById(
        uint256 slotId
    ) external view returns (Slot memory slots);

    function getSlotURI(uint256 slotId) external view returns (string memory);

    function slotIsPersistent(uint256 slotId) external view returns (bool);

    // Constraint: Admin
    // Emits: NewSlotURI
    function setSlotURI(string memory newSlotURI, uint slotId) external;

    // Constraint: Admin
    // Emits: NewSlotPersistence
    function setSlotPersistent(uint256 slotId, bool persistent) external;

    // Constraint: Admin
    // Emits: ItemMarkedAsEquippableInSlot
    function markItemAsEquippableInSlot(
        uint256 slot,
        uint256 itemType,
        address itemAddress,
        uint256 itemPoolId,
        uint256 maxAmount
    ) external;

    function maxAmountOfItemInSlot(
        uint256 slot,
        uint256 itemType,
        address itemAddress,
        uint256 itemPoolId
    ) external view returns (uint256);

    // Constraint: Non-reentrant.
    // Emits: ItemEquipped
    // Optionally emits: ItemUnequipped (if the current item in that slot is being replaced)
    function equip(
        uint256 subjectTokenId,
        uint256 slot,
        uint256 itemType,
        address itemAddress,
        uint256 itemTokenId,
        uint256 amount
    ) external;

    // Constraint: Non-reentrant.
    // Emits: ItemUnequipped
    function unequip(
        uint256 subjectTokenId,
        uint256 slot,
        bool unequipAll,
        uint256 amount
    ) external;

    function getEquippedItem(
        uint256 subjectTokenId,
        uint256 slot
    ) external view returns (EquippedItem memory item);
}
