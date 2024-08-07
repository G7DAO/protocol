// SPDX-License-Identifier: Apache-2.0

/**
 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/engine
 */

pragma solidity ^0.8.0;

import "@openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin-contracts/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {LibDiamondMoonstream as LibDiamond} from "../../diamond/libraries/LibDiamondMoonstream.sol";
import "../../diamond/security/DiamondReentrancyGuard.sol";

import {InventoryFacet} from "../../inventory/InventoryFacet.sol";
import {TerminusFacet} from "../../terminus/TerminusFacet.sol";
import {TerminusPermissions} from "../../terminus/TerminusPermissions.sol";

uint256 constant ERC20_TYPE = 20;
uint256 constant ERC721_TYPE = 721;
uint256 constant ERC1155_TYPE = 1155;
uint256 constant TERMINUS_MINTABLE_TYPE = 1;

struct Session {
    address playerTokenAddress;
    address paymentTokenAddress;
    uint256 paymentAmount;
    bool isActive; // active -> stake if ok,  cannot unstake
    bool isChoosingActive; // if active -> players can choose path in current stage
    string uri;
    uint256[] stages;
    // In forgiving sessions, making the wrong path choice at the previous stage doesn't prevent a
    // player from choosing a path in the next stage. It *does* prevent them from collecting the reward
    // for the next stage, though.
    bool isForgiving;
}

/**
Reward represents the reward an NFT owner can collect by making a choice with their NFT on the
corresponding stage in a given Garden of Forking Paths session.

The reward must be a Terminus token and the Garden of Forking Paths contract must have minting privileges
on the token pool.
 */
struct Reward {
    uint256 rewardType; // 1, 1155, 20, 721 - 1 means mint Terminus, 1155 means transfer 1155
    address rewardAddress;
    uint256 rewardTokenID;
    uint256 rewardAmount;
    address inventoryAddress; // if 0, reward goes to player/staker, else to NFT
    uint256 inventorySlot;
}

struct Predicate {
    address predicateAddress;
    bytes4 functionSelector;
    // initialArguments is intended to be ABI encoded partial arguments to the predicate function.
    bytes initialArguments;
}

struct PathDetails {
    uint256 sessionId;
    uint256 stageNumber;
    uint256 pathNumber;
}

library LibGOFP {
    bytes32 constant STORAGE_POSITION =
        keccak256("moonstreamdao.eth.storage.mechanics.GardenOfForkingPaths");

    /**
    All implicit arrays (implemented with maps) are 1-indexed. This applies to:
    - sessions
    - stages
    - paths

    This helps us avoid any confusion that stems from 0 being the default value for uint256.
    Applying this condition uniformly to all mappings avoids confusion from having to remember which
    implicit arrays are 0-indexed and which are 1-indexed.
     */
    struct GOFPStorage {
        address AdminTerminusAddress;
        uint256 AdminTerminusPoolID;
        uint256 numSessions;
        mapping(uint256 => Session) sessionById;
        // session => stage => stageReward
        mapping(uint256 => mapping(uint256 => Reward)) sessionStageReward;
        // session => stage => correct path for that stage
        mapping(uint256 => mapping(uint256 => uint256)) sessionStagePath;
        // nftAddress => tokenId => sessionId
        mapping(address => mapping(uint256 => uint256)) stakedTokenSession;
        // nftAddress => tokenId => owner
        mapping(address => mapping(uint256 => address)) stakedTokenOwner;
        // session => owner => numTokensStaked
        mapping(uint256 => mapping(address => uint256)) numTokensStakedByOwnerInSession;
        // sessionId => tokenId => index in tokensStakedByOwnerInSession
        mapping(uint256 => mapping(uint256 => uint256)) stakedTokenIndex;
        // session => owner => index => tokenId
        // The index refers to the tokens that the given owner has staked into the given sessions.
        // The index starts from 1.
        mapping(uint256 => mapping(address => mapping(uint256 => uint256))) tokensStakedByOwnerInSession;
        // session => tokenId => stage => chosenPath
        // This mapping tracks the path chosen by each eligible NFT in a session at each stage
        mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) pathChoices;
        // session => tokenId => was token ever staked into session?
        // This guards against a token being staked into a session multiple times.
        mapping(uint256 => mapping(uint256 => bool)) sessionTokenStakeGuard;
        // GOFP v0.2: session => stage => path => reward
        mapping(uint256 => mapping(uint256 => mapping(uint256 => Reward))) sessionPathReward;
        // Predicate to check prior to staking into session
        mapping(uint256 => Predicate) sessionStakingPredicate;
        // Predicate to check prior to choosing path
        mapping(uint256 => mapping(uint256 => mapping(uint256 => Predicate))) pathChoicePredicate;
    }

    function gofpStorage() internal pure returns (GOFPStorage storage gs) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            gs.slot := position
        }
    }
}

/**
The GOFPFacet is a smart contract that can either be used standalone or as part of an EIP2535 Diamond
proxy contract.

It implements the Garden of Forking Paths, a multiplayer choose your own adventure game mechanic.

Garden of Forking Paths is run in sessions. Each session consists of a given number of stages. Each
stage consists of a given number of paths.

Everything on the Garden of Forking Paths is 1-indexed.

There are two kinds of accounts that can interact with the Garden of Forking Paths:
1. Game Masters
2. Players

Game Masters are accounts which hold an admin badge as defined by LibGOFP.AdminTerminusAddress and
LibGOFP.AdminTerminusPoolID. The badge is expected to be a Terminus badge (non-transferable token).

Game Masters can:
- [x] Create sessions
- [x] Mark sessions as active or inactive
- [x] Mark sessions as active or inactive for the purposes of NFTs choosing a path in a the current stage
- [x] Register the correct path for the current stage
- [x] Update the metadata for a session
- [x] Set a reward (Terminus token mint) for NFT holders who make a choice with an NFT in each stage

Players can:
- [x] Stake their NFTs into a sesssion if the correct first stage path has not been chosen
- [x] Pay to stake their NFTs
- [x] Unstake their NFTs from a session at any time
- [x] Have one of their NFTs choose a path in the current stage PROVIDED THAT the current stage is the first
stage OR that the NFT chose the correct path in the previous stage
- [x] Collect their reward (Terminus token mint) for making a choice with an NFT in the current stage of a session

Anybody can:
- [x] View details of a session
- [x] View the correct path for a given stage
- [x] View how many tokens a given owner has staked into a given session
- [x] View the token ID of the <n>th token that a given owner has staked into a given session for any valid
    value of n
 */
contract GOFPFacet is
    ERC721Holder,
    ERC1155Holder,
    TerminusPermissions,
    DiamondReentrancyGuard
{
    modifier onlyGameMaster() {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            _holdsPoolToken(gs.AdminTerminusAddress, gs.AdminTerminusPoolID, 1),
            "GOFPFacet.onlyGameMaster: The address is not an authorized game master"
        );
        _;
    }

    event SessionCreated(
        uint256 sessionId,
        address indexed playerTokenAddress,
        address indexed paymentTokenAddress,
        uint256 paymentAmount,
        string uri,
        bool active,
        bool isForgiving
    );
    event SessionActivated(uint256 indexed sessionId, bool isActive);
    event SessionChoosingActivated(
        uint256 indexed sessionId,
        bool isChoosingActive
    );
    event StageRewardChanged(
        uint256 indexed sessionId,
        uint256 indexed stage,
        uint256 rewardType,
        address rewardAddress,
        uint256 rewardTokenID,
        uint256 rewardAmount,
        address inventoryAddress,
        uint256 inventorySlot
    );
    event PathRewardChanged(
        uint256 indexed sessionId,
        uint256 indexed stage,
        uint256 indexed path,
        uint256 rewardType,
        address rewardAddress,
        uint256 rewardTokenID,
        uint256 rewardAmount,
        address inventoryAddress,
        uint256 inventorySlot
    );
    event SessionUriChanged(uint256 indexed sessionId, string uri);
    event PathRegistered(
        uint256 indexed sessionId,
        uint256 stage,
        uint256 path
    );
    event PathChosen(
        uint256 indexed sessionId,
        uint256 indexed tokenId,
        uint256 indexed stage,
        uint256 path
    );
    event StakingPredicateSet(
        uint256 indexed sessionId,
        address predicateAddress,
        bytes4 functionSelector,
        bytes initialArguments
    );
    event PathChoicePredicateSet(
        uint256 indexed sessionId,
        uint256 indexed stage,
        uint256 indexed path,
        address predicateAddress,
        bytes4 functionSelector,
        bytes initialArguments
    );
    event InventoryEquipError(string error);

    function init(
        address adminTerminusAddress,
        uint256 adminTerminusPoolID
    ) external {
        LibDiamond.enforceIsContractOwner();

        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        gs.AdminTerminusAddress = adminTerminusAddress;
        gs.AdminTerminusPoolID = adminTerminusPoolID;
    }

    function gofpVersion() public pure returns (string memory, string memory) {
        return ("Moonstream Garden of Forking Paths", "0.2.1");
    }

    function getSession(
        uint256 sessionId
    ) external view returns (Session memory) {
        return LibGOFP.gofpStorage().sessionById[sessionId];
    }

    function adminTerminusInfo() external view returns (address, uint256) {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        return (gs.AdminTerminusAddress, gs.AdminTerminusPoolID);
    }

    function numSessions() external view returns (uint256) {
        return LibGOFP.gofpStorage().numSessions;
    }

    /**
    Creates a Garden of Forking Paths session. The session is configured with:
    - playerTokenAddress - this is the address of ERC721 tokens that can participate in the session
    - paymentTokenAddress - this is the address of the ERC20 token that each NFT must pay to enter the session
    - paymentAmount - this is the amount of the payment token that each NFT must pay to enter the session
    - isActive - this determines if the session is active as soon as it is created or not
    - isChoosingActive - this determines if NFTs can choose a path in the current stage or not, and is true
      by default when the session is created
    - uri - metadata uri describing the session
    - stages - an array describing the number of path choices at each stage of the session
     */
    function createSession(
        address playerTokenAddress,
        address paymentTokenAddress,
        uint256 paymentAmount,
        bool isActive,
        string memory uri,
        uint256[] memory stages,
        bool isForgiving
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        gs.numSessions++;

        require(
            gs.sessionById[gs.numSessions].playerTokenAddress == address(0),
            "GOFPFacet.createSession: Session already registered"
        );

        require(
            playerTokenAddress != address(0),
            "GOFPFacet.createSession: playerTokenAddress can't be zero address"
        );

        require(
            paymentTokenAddress != address(0) || paymentAmount == 0,
            "GOFPFacet.createSession: If paymentTokenAddress is the 0 address, paymentAmount should also be 0"
        );

        gs.sessionById[gs.numSessions] = Session({
            playerTokenAddress: playerTokenAddress,
            paymentTokenAddress: paymentTokenAddress,
            paymentAmount: paymentAmount,
            isActive: isActive,
            isChoosingActive: true,
            uri: uri,
            stages: stages,
            isForgiving: isForgiving
        });
        emit SessionCreated(
            gs.numSessions,
            playerTokenAddress,
            paymentTokenAddress,
            paymentAmount,
            uri,
            isActive,
            isForgiving
        );
        emit SessionActivated(gs.numSessions, isActive);
        emit SessionChoosingActivated(gs.numSessions, true);
        emit SessionUriChanged(gs.numSessions, uri);
    }

    function getStageReward(
        uint256 sessionId,
        uint256 stage
    ) external view returns (Reward memory) {
        return LibGOFP.gofpStorage().sessionStageReward[sessionId][stage];
    }

    function setStageRewards(
        uint256 sessionId,
        uint256[] calldata stages,
        Reward[] calldata rewards
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            stages.length == rewards.length,
            "GOFPFacet.setStageRewards: rewards must have same length as stages"
        );

        Session storage session = gs.sessionById[sessionId];
        require(
            !session.isActive,
            "GOFPFacet.setStageRewards: Cannot set stage rewards on active session"
        );

        for (uint256 i = 0; i < stages.length; i++) {
            require(
                (1 <= stages[i]) && (stages[i] <= session.stages.length),
                "GOFPFacet.setStageRewards: Invalid stage"
            );
            gs.sessionStageReward[sessionId][stages[i]] = Reward({
                rewardType: rewards[i].rewardType,
                rewardAddress: rewards[i].rewardAddress,
                rewardTokenID: rewards[i].rewardTokenID,
                rewardAmount: rewards[i].rewardAmount,
                inventoryAddress: rewards[i].inventoryAddress,
                inventorySlot: rewards[i].inventorySlot
            });
            emit StageRewardChanged(
                sessionId,
                stages[i],
                rewards[i].rewardType,
                rewards[i].rewardAddress,
                rewards[i].rewardTokenID,
                rewards[i].rewardAmount,
                rewards[i].inventoryAddress,
                rewards[i].inventorySlot
            );
        }
    }

    function getPathReward(
        uint256 sessionId,
        uint256 stage,
        uint256 path
    ) external view returns (Reward memory) {
        return LibGOFP.gofpStorage().sessionPathReward[sessionId][stage][path];
    }

    function setPathRewards(
        uint256 sessionId,
        uint256[] memory stages,
        uint256[] memory paths,
        Reward[] calldata rewards
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            stages.length == paths.length,
            "GOFPFacet.setPathRewards: paths must have same length as stages"
        );
        require(
            stages.length == rewards.length,
            "GOFPFacet.setPathRewards: rewards must have same length as stages"
        );

        Session storage session = gs.sessionById[sessionId];
        require(
            !session.isActive,
            "GOFPFacet.setPathRewards: Cannot set path rewards on active session"
        );

        for (uint256 i = 0; i < stages.length; i++) {
            require(
                (1 <= stages[i]) && (stages[i] <= session.stages.length),
                "GOFPFacet.setPathRewards: Invalid stage"
            );
            require(
                (1 <= paths[i]) && (paths[i] <= session.stages[stages[i] - 1]),
                "GOFPFacet.setPathRewards: Invalid path"
            );
            gs.sessionPathReward[sessionId][stages[i]][paths[i]] = Reward({
                rewardType: rewards[i].rewardType,
                rewardAddress: rewards[i].rewardAddress,
                rewardTokenID: rewards[i].rewardTokenID,
                rewardAmount: rewards[i].rewardAmount,
                inventoryAddress: rewards[i].inventoryAddress,
                inventorySlot: rewards[i].inventorySlot
            });
            emit PathRewardChanged(
                sessionId,
                stages[i],
                paths[i],
                rewards[i].rewardType,
                rewards[i].rewardAddress,
                rewards[i].rewardTokenID,
                rewards[i].rewardAmount,
                rewards[i].inventoryAddress,
                rewards[i].inventorySlot
            );
        }
    }

    function setSessionActive(
        uint256 sessionId,
        bool isActive
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.setSessionActive: Invalid session ID"
        );
        gs.sessionById[sessionId].isActive = isActive;
        emit SessionActivated(sessionId, isActive);
    }

    function getCorrectPathForStage(
        uint256 sessionId,
        uint256 stage
    ) external view returns (uint256) {
        require(
            stage > 0,
            "GOFPFacet.getCorrectPathForStage: Stages are 1-indexed, 0 is not a valid stage"
        );
        return LibGOFP.gofpStorage().sessionStagePath[sessionId][stage];
    }

    function setCorrectPathForStage(
        uint256 sessionId,
        uint256 stage,
        uint256 path,
        bool setIsChoosingActive
    ) external onlyGameMaster {
        require(
            stage > 0,
            "GOFPFacet.setCorrectPathForStage: Stages are 1-indexed, 0 is not a valid stage"
        );
        uint256 stageIndex = stage - 1;
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.setCorrectPathForStage: Invalid session"
        );
        require(
            stageIndex < gs.sessionById[sessionId].stages.length,
            "GOFPFacet.setCorrectPathForStage: Invalid stage"
        );
        require(
            !gs.sessionById[sessionId].isChoosingActive,
            "GOFPFacet.setCorrectPathForStage: Deactivate isChoosingActive before setting the correct path"
        );
        // Paths are 1-indexed to avoid possible confusion involving default value of 0
        require(
            path >= 1 && path <= gs.sessionById[sessionId].stages[stageIndex],
            "GOFPFacet.setCorrectPathForStage: Invalid path"
        );
        // We use the default value of 0 as a guard to check that path has not already been set for that
        // stage. No changes allowed for a given stage after the path was already chosen.
        require(
            gs.sessionStagePath[sessionId][stage] == 0,
            "GOFPFacet.setCorrectPathForStage: Path has already been chosen for that stage"
        );
        // You cannot set the path for a stage if the path for its previous stage has not been previously
        // set.
        // We use the stageIndex to access the path because stageIndex = stage - 1. This is just a
        // convenience. It would be more correct to access the "stage - 1" key in the mapping.
        require(
            stage <= 1 || gs.sessionStagePath[sessionId][stageIndex] != 0,
            "GOFPFacet.setCorrectPathForStage: Path not set for previous stage"
        );
        gs.sessionStagePath[sessionId][stage] = path;
        gs.sessionById[sessionId].isChoosingActive = setIsChoosingActive;

        emit PathRegistered(sessionId, stage, path);
        emit SessionChoosingActivated(sessionId, setIsChoosingActive);
    }

    function setSessionChoosingActive(
        uint256 sessionId,
        bool isChoosingActive
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.setSessionChoosingActive: Invalid session ID"
        );
        gs.sessionById[sessionId].isChoosingActive = isChoosingActive;
        emit SessionChoosingActivated(sessionId, isChoosingActive);
    }

    function setSessionUri(
        uint256 sessionId,
        string memory uri
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.setSessionChoosingActive: Invalid session ID"
        );
        gs.sessionById[sessionId].uri = uri;
        emit SessionUriChanged(sessionId, uri);
    }

    /**
    For a given NFT, specified by the `nftAddress` and `tokenId`, this view function returns:
    1. The sessionId of the session into which the NFT is staked
    2. The address of the staker

    If the token is not currently staked in the Garden of Forking Paths contract, this method returns
    0 for the sessionId and the 0 address as the staker.
     */
    function getStakedTokenInfo(
        address nftAddress,
        uint256 tokenId
    ) external view returns (uint256, address) {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        return (
            gs.stakedTokenSession[nftAddress][tokenId],
            gs.stakedTokenOwner[nftAddress][tokenId]
        );
    }

    function getSessionTokenStakeGuard(
        uint256 sessionId,
        uint256 tokenId
    ) external view returns (bool) {
        return LibGOFP.gofpStorage().sessionTokenStakeGuard[sessionId][tokenId];
    }

    function numTokensStakedIntoSession(
        uint256 sessionId,
        address staker
    ) external view returns (uint256) {
        return
            LibGOFP.gofpStorage().numTokensStakedByOwnerInSession[sessionId][
                staker
            ];
    }

    function tokenOfStakerInSessionByIndex(
        uint256 sessionId,
        address staker,
        uint256 index
    ) external view returns (uint256) {
        return
            LibGOFP.gofpStorage().tokensStakedByOwnerInSession[sessionId][
                staker
            ][index];
    }

    /**
    Returns the path chosen by the given tokenId in the given session and stage.

    Recall: sessions and stages are 1-indexed.
     */
    function getPathChoice(
        uint256 sessionId,
        uint256 tokenId,
        uint256 stage
    ) external view returns (uint256) {
        return LibGOFP.gofpStorage().pathChoices[sessionId][tokenId][stage];
    }

    function _addTokenToEnumeration(
        uint256 sessionId,
        address owner,
        address nftAddress,
        uint256 tokenId
    ) internal {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();

        require(
            gs.stakedTokenSession[nftAddress][tokenId] == 0,
            "GOFPFacet._addTokenToEnumeration: Token is already associated with a session on this contract"
        );
        require(
            gs.stakedTokenOwner[nftAddress][tokenId] == address(0),
            "GOFPFacet._addTokenToEnumeration: Token is already associated with an owner on this contract"
        );
        require(
            gs.stakedTokenIndex[sessionId][tokenId] == 0,
            "GOFPFacet._addTokenToEnumeration: Token was already added to enumeration"
        );

        gs.stakedTokenSession[nftAddress][tokenId] = sessionId;
        gs.stakedTokenOwner[nftAddress][tokenId] = owner;

        uint256 currStaked = gs.numTokensStakedByOwnerInSession[sessionId][
            owner
        ];
        gs.tokensStakedByOwnerInSession[sessionId][owner][
            currStaked + 1
        ] = tokenId;
        gs.stakedTokenIndex[sessionId][tokenId] = currStaked + 1;
        gs.numTokensStakedByOwnerInSession[sessionId][owner]++;
    }

    function _removeTokenFromEnumeration(
        uint256 sessionId,
        address owner,
        address nftAddress,
        uint256 tokenId
    ) internal {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            gs.stakedTokenSession[nftAddress][tokenId] == sessionId,
            "GOFPFacet._removeTokenFromEnumeration: Token is not associated with the given session"
        );
        require(
            gs.stakedTokenOwner[nftAddress][tokenId] == owner,
            "GOFPFacet._removeTokenFromEnumeration: Token is not associated with the given owner"
        );
        require(
            gs.stakedTokenIndex[sessionId][tokenId] != 0,
            "GOFPFacet._removeTokenFromEnumeration: Token wasn't added to enumeration"
        );

        delete gs.stakedTokenSession[nftAddress][tokenId];
        delete gs.stakedTokenOwner[nftAddress][tokenId];

        uint256 currStaked = gs.numTokensStakedByOwnerInSession[sessionId][
            owner
        ];
        uint256 currIndex = gs.stakedTokenIndex[sessionId][tokenId];
        uint256 lastToken = gs.tokensStakedByOwnerInSession[sessionId][owner][
            currStaked
        ];
        require(
            currIndex <= currStaked &&
                gs.tokensStakedByOwnerInSession[sessionId][owner][currIndex] ==
                tokenId,
            "GOFPFacet._removeTokenFromEnumeration: Token wasn't staked by the given owner"
        );
        //swapping last element with element at given index
        gs.tokensStakedByOwnerInSession[sessionId][owner][
            currIndex
        ] = lastToken;
        //updating last token's index
        gs.stakedTokenIndex[sessionId][lastToken] = currIndex;
        //deleting old lastToken
        // TODO(zomglings): Test stake -> unstake -> restake
        delete gs.stakedTokenIndex[sessionId][tokenId];
        delete gs.tokensStakedByOwnerInSession[sessionId][owner][currStaked];
        //updating staked count
        gs.numTokensStakedByOwnerInSession[sessionId][owner]--;
    }

    function getSessionStakingPredicate(
        uint256 sessionId
    ) external view returns (Predicate memory) {
        return LibGOFP.gofpStorage().sessionStakingPredicate[sessionId];
    }

    function setSessionStakingPredicate(
        uint256 sessionId,
        bytes4 functionSelector,
        address predicateAddress,
        bytes calldata initialArguments
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        gs.sessionStakingPredicate[sessionId] = Predicate({
            predicateAddress: predicateAddress,
            functionSelector: functionSelector,
            initialArguments: initialArguments
        });
        emit StakingPredicateSet(
            sessionId,
            predicateAddress,
            functionSelector,
            initialArguments
        );
    }

    function getPathChoicePredicate(
        PathDetails calldata path
    ) external view returns (Predicate memory) {
        return
            LibGOFP.gofpStorage().pathChoicePredicate[path.sessionId][
                path.stageNumber
            ][path.pathNumber];
    }

    function setPathChoicePredicate(
        PathDetails calldata path,
        bytes4 functionSelector,
        address predicateAddress,
        bytes calldata initialArguments
    ) external onlyGameMaster {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        gs.pathChoicePredicate[path.sessionId][path.stageNumber][
            path.pathNumber
        ] = Predicate({
            predicateAddress: predicateAddress,
            functionSelector: functionSelector,
            initialArguments: initialArguments
        });
        emit PathChoicePredicateSet(
            path.sessionId,
            path.stageNumber,
            path.pathNumber,
            predicateAddress,
            functionSelector,
            initialArguments
        );
    }

    function _callPredicate(
        Predicate memory predicate,
        address player,
        address tokenAddress,
        uint256 tokenId
    ) internal view returns (bool valid) {
        // If there is no predicate registered, simply return true.
        if (predicate.predicateAddress == address(0)) {
            return true;
        }

        // require(predicate.predicateAddress != address(0), "Empty predicate.");

        assembly {
            let starting_position := mload(0x40)

            // Layout of predicate in memory:
            // predicate + 0x0 : predicate + 0x20 -- predicateAddress
            // predicate + 0x20 : predicate + 0x40 -- functionSelector
            // predicate + 0x40 : predicate + 0x60 -- memory position of initialArguments array
            //
            // We store the memory position as initial_arguments_position.
            // initial_arguments_position + 0x0 : initial_arguments_position + 0x20 -- length of initialArguments
            //
            // We use this to iterate over the initial arguments and add them to the calldata we are
            // constructing.
            let initial_arguments_position := mload(add(predicate, 0x40))
            let initial_arguments_length := mload(initial_arguments_position)
            let initial_arguments_start := add(initial_arguments_position, 0x20)

            let i := 0

            mstore(starting_position, mload(add(predicate, 0x20)))
            let post_selector := add(starting_position, 0x4)

            for {
                i := 0
            } lt(i, initial_arguments_length) {
                i := add(i, 0x20)
            } {
                mstore(
                    add(post_selector, i),
                    mload(add(initial_arguments_start, i))
                )
            }

            i := add(post_selector, initial_arguments_length)
            mstore(i, player)
            i := add(i, 0x20)
            mstore(i, tokenAddress)
            i := add(i, 0x20)
            mstore(i, tokenId)

            let calldata_length := add(initial_arguments_length, 0x64)
            let success := staticcall(
                gas(),
                mload(predicate),
                starting_position,
                calldata_length,
                add(starting_position, calldata_length),
                0x20
            )

            if eq(success, 0) {
                revert(0, returndatasize())
            }

            valid := mload(add(starting_position, calldata_length))
        }
    }

    function callSessionStakingPredicate(
        uint256 sessionId,
        address player,
        uint256 tokenId
    ) public view returns (bool valid) {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        address tokenAddress = gs.sessionById[sessionId].playerTokenAddress;

        Predicate memory predicate = gs.sessionStakingPredicate[sessionId];

        return _callPredicate(predicate, player, tokenAddress, tokenId);
    }

    function callPathChoicePredicate(
        PathDetails memory path,
        address player,
        uint256 tokenId
    ) public view returns (bool valid) {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        address tokenAddress = gs
            .sessionById[path.sessionId]
            .playerTokenAddress;

        Predicate memory predicate = gs.pathChoicePredicate[path.sessionId][
            path.stageNumber
        ][path.pathNumber];

        return _callPredicate(predicate, player, tokenAddress, tokenId);
    }

    function stakeTokensIntoSession(
        uint256 sessionId,
        uint256[] calldata tokenIds
    ) external diamondNonReentrant {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.stakeTokensIntoSession: Invalid session ID"
        );

        address paymentTokenAddress = gs
            .sessionById[sessionId]
            .paymentTokenAddress;
        if (paymentTokenAddress != address(0)) {
            IERC20 paymentToken = IERC20(paymentTokenAddress);
            uint256 paymentAmount = gs.sessionById[sessionId].paymentAmount *
                tokenIds.length;
            bool paymentSuccessful = paymentToken.transferFrom(
                msg.sender,
                address(this),
                paymentAmount
            );
            require(
                paymentSuccessful,
                "GOFPFacet.stakeTokensIntoSession: Session requires payment but payment was unsuccessful"
            );
        }

        require(
            gs.sessionById[sessionId].isActive,
            "GOFPFacet.stakeTokensIntoSession: Cannot stake tokens into inactive session"
        );

        require(
            gs.sessionStagePath[sessionId][1] == 0,
            "GOFPFacet.stakeTokensIntoSession: The first stage for this session has already been resolved"
        );

        address nftAddress = gs.sessionById[sessionId].playerTokenAddress;
        IERC721 token = IERC721(nftAddress);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            // TODO(zomglings): Currently, Garden of Forking Paths does not allow even someone who is *approved* to transfer
            // NFTs on behalf of their owners to stake those NFTs into a session.
            // We may want to change this in the future. Perhaps the more correct thing would be to check if the msg.sender
            // was approved by the NFT owner on the ERC721 contract.
            // We should check if approvals are intended to compose transitively on ERC721.
            // Just because person A gives person B approval to transfer ERC721 tokens, doesn't mean they want them to
            // have permission to instigate *another* address with transfer approval to make a transfer.
            require(
                token.ownerOf(tokenIds[i]) == msg.sender,
                "GOFPFacet.stakeTokensIntoSession: Cannot stake a token into session which is not owned by message sender"
            );
            require(
                !gs.sessionTokenStakeGuard[sessionId][tokenIds[i]],
                "GOFPFacet.stakeTokensIntoSession: Token was previously staked into session"
            );

            require(
                callSessionStakingPredicate(sessionId, msg.sender, tokenIds[i]),
                "GOFPFacet.stakeTokensIntoSession: Session staking predicate not satisfied"
            );

            token.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            gs.sessionTokenStakeGuard[sessionId][tokenIds[i]] = true;
            _addTokenToEnumeration(
                sessionId,
                msg.sender,
                nftAddress,
                tokenIds[i]
            );
        }
    }

    function unstakeTokensFromSession(
        uint256 sessionId,
        uint256[] calldata tokenIds
    ) external diamondNonReentrant {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.unstakeTokensFromSession: Invalid session ID"
        );

        Session storage session = gs.sessionById[sessionId];
        address nftAddress = session.playerTokenAddress;
        IERC721 token = IERC721(nftAddress);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _removeTokenFromEnumeration(
                sessionId,
                msg.sender,
                nftAddress,
                tokenIds[i]
            );
            token.safeTransferFrom(address(this), msg.sender, tokenIds[i]);
        }
    }

    /**
    Returns the number of the current stage.
     */
    function getCurrentStage(
        uint256 sessionId
    ) external view returns (uint256) {
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();
        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.getCurrentStage: Invalid session ID"
        );

        Session storage session = gs.sessionById[sessionId];

        uint256 lastStage = 0;

        for (uint256 i = 1; i <= session.stages.length; i++) {
            if (gs.sessionStagePath[sessionId][i] > 0) {
                lastStage = i;
            } else {
                break;
            }
        }

        return lastStage + 1;
    }

    /**
    For the current stage of the session with the given sessionId, a player may make a choice of paths
    for each of their tokenIds.

    The tokenIds array is expected to be the same length as the paths array.

    A choice may only be made if choosing is currently active for the given session.

    If the current stage is not the first stage, it is expected that each of the tokens specified by
    tokenIds made the correct choice in the previous stage.
     */
    function chooseCurrentStagePaths(
        uint256 sessionId,
        uint256[] memory tokenIds,
        uint256[] memory paths
    ) external diamondNonReentrant {
        require(
            tokenIds.length == paths.length,
            "GOFPFacet.chooseCurrentStagePaths: tokenIds and paths arrays must be of the same length"
        );
        LibGOFP.GOFPStorage storage gs = LibGOFP.gofpStorage();

        require(
            sessionId <= gs.numSessions,
            "GOFPFacet.chooseCurrentStagePaths: Invalid session ID"
        );

        Session storage session = gs.sessionById[sessionId];
        // This prevents players from claiming rewards for path choice in inactive sessions.
        // It is a form of protection for game masters - they can shut down all reward claims from the
        // Garden of Forking Paths session my marking that session as inactive.
        require(
            session.isActive,
            "GOFPFacet.chooseCurrentStagePaths: Cannot choose paths in inactive session"
        );
        require(
            session.isChoosingActive,
            "GOFPFacet.chooseCurrentStagePaths: Cannot choose paths in a session for which choosing is not active"
        );

        uint256 i = 0;

        uint256 lastStage = 0;
        uint256 lastStageCorrectPath = 0;

        for (i = 1; i <= session.stages.length; i++) {
            if (gs.sessionStagePath[sessionId][i] > 0) {
                lastStage = i;
                lastStageCorrectPath = gs.sessionStagePath[sessionId][i];
            } else {
                break;
            }
        }

        require(
            lastStage < session.stages.length,
            "GOFPFacet.chooseCurrentStagePaths: This session has ended"
        );

        uint256 currentStage = lastStage + 1;
        // lastStage has no semantic meaning below. It would be more correct to say currentStage - 1.
        // This is just for convenience, saving one subtraction.

        uint256 stageRewardAmount = 0;
        Reward memory stageReward = gs.sessionStageReward[sessionId][
            currentStage
        ];

        for (i = 0; i < tokenIds.length; i++) {
            // BEWARE: Setting tokenId and path variables resuls in a "Stack too deep" error message
            // when compiling this contract. Using calldata array arguments restricts the amount of
            // stack variables available to us inside the function body.
            require(
                gs.stakedTokenIndex[sessionId][tokenIds[i]] > 0,
                "GOFPFacet.chooseCurrentStagePaths: Token not currently staked into session"
            );
            require(
                gs.stakedTokenOwner[session.playerTokenAddress][tokenIds[i]] ==
                    msg.sender,
                "GOFPFacet.chooseCurrentStagePaths: Message not sent by token owner"
            );
            require(
                (lastStage == 0) ||
                    (session.isForgiving) ||
                    (gs.pathChoices[sessionId][tokenIds[i]][lastStage] ==
                        lastStageCorrectPath),
                "GOFPFacet.chooseCurrentStagePaths: Session is not forgiving and token did not choose correct path in last stage"
            );
            require(
                gs.pathChoices[sessionId][tokenIds[i]][currentStage] == 0,
                "GOFPFacet.chooseCurrentStagePaths: Token has already chosen a path in the current stage"
            );
            require(
                (paths[i] >= 1) && (paths[i] <= session.stages[lastStage]),
                "GOFPFacet.chooseCurrentStagePaths: Invalid path"
            );
            require(
                callPathChoicePredicate(
                    PathDetails({
                        sessionId: sessionId,
                        stageNumber: currentStage,
                        pathNumber: paths[i]
                    }),
                    msg.sender,
                    tokenIds[i]
                ),
                "GOFPFacet.chooseCurrentStagePaths: Path choice predicate not satisfied"
            );
            gs.pathChoices[sessionId][tokenIds[i]][currentStage] = paths[i];
            emit PathChosen(sessionId, tokenIds[i], currentStage, paths[i]);

            // Calculate number of correct choices on last stage for reward distribution, but only if
            // there is a stage reward.
            if (stageReward.rewardAddress != address(0)) {
                if (
                    lastStage == 0 ||
                    gs.pathChoices[sessionId][tokenIds[i]][lastStage] ==
                    lastStageCorrectPath
                ) {
                    if (stageReward.inventoryAddress == address(0)) {
                        stageRewardAmount += stageReward.rewardAmount;
                    } else {
                        _distributeReward(stageReward, tokenIds[i]);
                    }
                }
            }

            // Distribute path reward.
            Reward memory pathReward = gs.sessionPathReward[sessionId][
                currentStage
            ][paths[i]];
            _distributeReward(pathReward, tokenIds[i]);
        }

        if (stageReward.inventoryAddress == address(0)) {
            stageReward.rewardAmount = stageRewardAmount;
            _distributeReward(stageReward, 0);
        }
    }

    function _distributeReward(Reward memory reward, uint256 tokenId) internal {
        if (reward.rewardAddress != address(0)) {
            if (reward.rewardType == TERMINUS_MINTABLE_TYPE) {
                TerminusFacet rewardTerminus = TerminusFacet(
                    reward.rewardAddress
                );
                if (reward.inventoryAddress != address(0)) {
                    rewardTerminus.mint(
                        address(this),
                        reward.rewardTokenID,
                        reward.rewardAmount,
                        ""
                    );
                    _equipInventoryReward(reward, tokenId);
                } else {
                    rewardTerminus.mint(
                        msg.sender,
                        reward.rewardTokenID,
                        reward.rewardAmount,
                        ""
                    );
                }
            } else {
                revert("Non-terminus rewards are not yet implemented");
            }
        }
    }

    function _equipInventoryReward(
        Reward memory reward,
        uint256 tokenId
    ) internal {
        InventoryFacet inventoryFacet = InventoryFacet(reward.inventoryAddress);
        uint256 slotId = reward.inventorySlot;
        bool persistent = inventoryFacet.slotIsPersistent(slotId);
        if (persistent) {
            inventoryFacet.setSlotPersistent(slotId, false);
        }
        try
            inventoryFacet.equip(
                tokenId,
                slotId,
                1155,
                reward.rewardAddress,
                reward.rewardTokenID,
                reward.rewardAmount
            )
        {} catch Error(string memory reason) {
            emit InventoryEquipError(reason);
        }
        if (persistent) {
            inventoryFacet.setSlotPersistent(slotId, true);
        }
    }
}
