// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OZ imports
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// Internal imports
import { StakingPool, Position } from "./data.sol";
import "../utils/DateTime.sol";

contract PositionMetadata {
    using Strings for uint8;
    using Strings for uint16;
    using Strings for uint256;
    using Strings for address;

    string public displayNativeSymbol; // display symbol for native tokens

    constructor(string memory _displayNativeSymbol) {
        displayNativeSymbol = _displayNativeSymbol; // initialize the display symbol for native tokens
    }

    function metadataBytes(
        uint256 positionTokenID,
        Position memory position,
        StakingPool memory pool
    ) public view returns (bytes memory) {
        // encode the image
        string memory image = Base64.encode(bytes(generateSVG(position, pool)));
        bytes memory result = bytes(
            abi.encodePacked(
                '{"token_id":"',
                Strings.toString(positionTokenID),
                '","image": "data:image/svg+xml;base64,',
                image,
                '","result_version":1,"attributes": ['
            )
        );

        result = abi.encodePacked(result, '{"trait_type":"Pool ID","value":"', Strings.toString(position.poolID), '"}');

        result = abi.encodePacked(
            result,
            pool.tokenType == 721
                ? ',{"trait_type":"Staked token ID","value":"'
                : ',{"trait_type":"Staked amount","value":"',
            Strings.toString(position.amountOrTokenID),
            '"}'
        );

        result = abi.encodePacked(
            result,
            ',{"display_type":"number","trait_type":"Staked at","value":',
            Strings.toString(position.stakeTimestamp),
            "}"
        );

        result = abi.encodePacked(
            result,
            ',{"display_type":"number","trait_type":"Lockup expires at","value":',
            Strings.toString(position.stakeTimestamp + pool.lockupSeconds),
            "}"
        );

        result = abi.encodePacked(result, "]}");

        return result;
    }

    /// @notice Returns a JSON string representing a position's on-chain metadata.
    function metadataJSON(
        uint256 positionTokenID,
        Position memory position,
        StakingPool memory pool
    ) public view returns (string memory) {
        return string(metadataBytes(positionTokenID, position, pool));
    }

    function metadata(
        uint256 positionTokenID,
        Position memory position,
        StakingPool memory pool
    ) public view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(metadataBytes(positionTokenID, position, pool))
                )
            );
    }

    function formatDateTime(DateTime._DateTime memory dt) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    dt.year.toString(),
                    "-",
                    dt.month.toString(),
                    "-",
                    dt.day.toString(),
                    " ",
                    dt.hour.toString(),
                    ":",
                    dt.minute.toString(),
                    ":",
                    dt.second.toString()
                )
            );
    }

    // Add positionParams in the future
    function generateSVG(Position memory position, StakingPool memory pool) internal view returns (string memory svg) {
        svg = string(abi.encodePacked(generateSVGForeground(position, pool)));
    }

    function generateSVGForeground(
        Position memory position,
        StakingPool memory pool
    ) private view returns (string memory svg) {
        string memory tokenAmountOrIdLabel = pool.tokenType == 721 ? "Token ID" : "Amount staked";
        string memory amountOrTokenIdString = (position.amountOrTokenID).toString();

        // Timestamp string manipulations
        string memory stakeTimestampStr = formatDateTime(DateTime.parseTimestamp(position.stakeTimestamp));
        string memory unlockTimestampStr = formatDateTime(
            DateTime.parseTimestamp(position.stakeTimestamp + pool.lockupSeconds)
        );
        string memory cooldownStr = (pool.cooldownSeconds).toString();

        // Pool data strings
        string memory poolIdString = (position.poolID).toString();
        string memory tokenTypeString = pool.tokenType == 1 ? "Native" : pool.tokenType == 20
            ? "ERC20"
            : pool.tokenType == 721
            ? "ERC721"
            : "ERC1155";

        string memory tokenSymbolString = pool.tokenType == 1
            ? returnTokenSymbolNative()
            : returnTokenSymbol(pool.tokenType, pool.tokenAddress);

        string memory tokenAddressString = Strings.toHexString(uint256(uint160(pool.tokenAddress)), 20);

        svg = string(
            abi.encodePacked(
                '<svg width="1960" height="2000" viewBox="0 0 1960 2000" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<rect style="mix-blend-mode:overlay" x="120" y="80" width="1760" height="1840" rx="80" fill="url(#f1)" />',
                generateLogo(),
                generateTokenSymbol(tokenSymbolString),
                generateTokenIdOrAmountElement(tokenAmountOrIdLabel, amountOrTokenIdString),
                generateStakingPeriodElements(stakeTimestampStr, unlockTimestampStr, cooldownStr),
                generateTokenTypeElement(tokenTypeString, tokenAddressString, amountOrTokenIdString, poolIdString),
                generateDefs(),
                "</svg>"
            )
        );
    }

    function generateLogo() public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<rect x="1636.541" y="181" width="107.459" height="107.459" rx="53.7295" stroke="#CBCFCB" stroke-width="7.54098"/>',
                    '<path d="M1661.9905 220.5045L1673.4495 237.9445H1688.2895L1684.9200 232.8145H1695.6200L1682.8500 252.2645L1690.2700 264.5545L1718.5500 220.5045H1661.9905Z" fill="#CBCFCB"/>'
                )
            );
    }

    function generateTokenSymbol(string memory tokenSymbolString) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="220" font-weight="800" letter-spacing="-0.04em"><tspan x="350.124" y="583.682">',
                    tokenSymbolString,
                    "</tspan></text>",
                    '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="220" font-weight="bold" letter-spacing="-0.04em"><tspan x="220" y="583.682">$</tspan></text>'
                )
            );
    }

    function generateTokenIdOrAmountElement(
        string memory tokenIdOrAmountString,
        string memory amountOrTokenIDString
    ) public pure returns (string memory) {
        return (
            string(
                abi.encodePacked(
                    '<rect x="221" y="766" width="1558" height="122" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                    '<rect x="221" y="766" width="1558" height="122" rx="19" stroke="#737373" stroke-width="2"/>',
                    '<text x="220" y="737" fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New"  font-size="40" font-weight="bold" letter-spacing="0em">',
                    tokenIdOrAmountString,
                    "</text>",
                    '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="80" font-weight="bold" letter-spacing="0em"><tspan x="260" y="850">',
                    amountOrTokenIDString,
                    "</tspan></text>"
                )
            )
        );
    }

    function generateTokenTypeElement(
        string memory tokenTypeString,
        string memory tokenAddressString,
        string memory amountOrTokenIdString,
        string memory poolIdString
    ) public pure returns (string memory) {
        // All branches of this if-else statement return.
        // In each branch the following parameters differ:
        // - Token ID only present for ERC1155
        // - Rectangle width and span for token type and address.
        if (keccak256(abi.encodePacked(tokenTypeString)) == keccak256(abi.encodePacked("Native"))) {
            return
                string(
                    abi.encodePacked(
                        abi.encodePacked(
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1166">Token</tspan></text>',
                            '<rect x="241" y="1215" width="148" height="48" rx="21" stroke="#FFEFB8" stroke-width="0.4"/>',
                            '<text x="260" y="1250" fill="#FFEFB8" font-family="Courier New" font-size="32" font-weight="bold">',
                            tokenTypeString,
                            "</text>",
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="420" y="1250">',
                            tokenAddressString,
                            "</tspan></text>"
                        ),
                        abi.encodePacked(
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1360">Pool ID</tspan></text>',
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1444">',
                            poolIdString,
                            "</tspan></text>"
                        )
                    )
                );
        } else if (keccak256(abi.encodePacked(tokenTypeString)) == keccak256(abi.encodePacked("ERC20"))) {
            return
                string(
                    abi.encodePacked(
                        abi.encodePacked(
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1166">Token</tspan></text>',
                            '<rect x="241" y="1215" width="130" height="48" rx="21" stroke="#FFEFB8" stroke-width="0.4"/>',
                            '<text x="260" y="1250" fill="#FFEFB8" font-family="Courier New" font-size="32" font-weight="bold">',
                            tokenTypeString,
                            "</text>",
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="400" y="1250">',
                            tokenAddressString,
                            "</tspan></text>"
                        ),
                        abi.encodePacked(
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1360">Pool ID</tspan></text>',
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1444">',
                            poolIdString,
                            "</tspan></text>"
                        )
                    )
                );
        } else if (keccak256(abi.encodePacked(tokenTypeString)) == keccak256(abi.encodePacked("ERC721"))) {
            return
                string(
                    abi.encodePacked(
                        abi.encodePacked(
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1166">Token</tspan></text>',
                            '<rect x="241" y="1215" width="148" height="48" rx="21" stroke="#FFEFB8" stroke-width="0.4"/>',
                            '<text x="260" y="1250" fill="#FFEFB8" font-family="Courier New" font-size="32" font-weight="bold">',
                            tokenTypeString,
                            "</text>",
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="420" y="1250">',
                            tokenAddressString,
                            "</tspan></text>"
                        ),
                        abi.encodePacked(
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1360">Pool ID</tspan></text>',
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1444">',
                            poolIdString,
                            "</tspan></text>"
                        )
                    )
                );
        } else {
            return
                string(
                    abi.encodePacked(
                        abi.encodePacked(
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1389" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1360">Token ID</tspan></text>',
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1444">',
                            amountOrTokenIdString,
                            "</tspan></text>"
                        ),
                        abi.encodePacked(
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1195" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1166">Token</tspan></text>',
                            '<rect x="241" y="1215" width="166" height="48" rx="21" stroke="#FFEFB8" stroke-width="0.4"/>',
                            '<text x="260" y="1250" fill="#FFEFB8" font-family="Courier New" font-size="32" font-weight="bold">',
                            tokenTypeString,
                            "</text>",
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="430" y="1250">',
                            tokenAddressString,
                            "</tspan></text>"
                        ),
                        abi.encodePacked(
                            '<rect x="221" y="1583" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                            '<rect x="221" y="1583" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                            '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="221" y="1554">Pool ID</tspan></text>',
                            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1638">',
                            poolIdString,
                            "</tspan></text>"
                        )
                    )
                );
        }
    }

    function generateStakingPeriodElements(
        string memory stakeTimestampStr,
        string memory unlockTimestampStr,
        string memory cooldownStr
    ) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    abi.encodePacked(
                        '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="220" y="964">Staked at</tspan></text>',
                        '<rect x="221" y="993" width="522" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/><rect x="221" y="993" width="522" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                        '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1051">',
                        stakeTimestampStr,
                        "</tspan></text>"
                    ),
                    abi.encodePacked(
                        '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="768" y="964">Unlocks at</tspan></text>',
                        '<rect x="769" y="993" width="522" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/><rect x="769" y="993" width="522" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                        '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="808" y="1051">',
                        unlockTimestampStr,
                        "</tspan></text>"
                    ),
                    abi.encodePacked(
                        '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="0em"><tspan x="1316" y="964">Cooldown</tspan></text>',
                        '<rect x="1317" y="993" width="462" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/><rect x="1317" y="993" width="462" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                        '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="1356" y="1051">',
                        cooldownStr,
                        " seconds</tspan></text>"
                    )
                )
            );
    }

    function generateDefs() public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "<defs>",
                    '<linearGradient id="f1" x1="0" y1="920" x2="1960" y2="920" gradientUnits="userSpaceOnUse">',
                    '<stop stop-color="#1B1B1B" stop-opacity=".85"/>',
                    '<stop offset="1" stop-color="#1B1B1B"/>'
                    "</linearGradient>",
                    "</defs>"
                )
            );
    }

    function returnTokenSymbolNative() public view returns (string memory) {
        return displayNativeSymbol;
    }

    function returnTokenSymbol(uint256 tokenType, address tokenAddress) public view returns (string memory) {
        if (tokenType == 20) return ERC20(tokenAddress).symbol();
        else if (tokenType == 721) return ERC721(tokenAddress).symbol();
        else if (tokenType == 1155) {
            string memory addressSlice = getAddressSlice(tokenAddress);
            return addressSlice;
        } else return "N/A";
    }

    function getAddressSlice(address tokenAddress) public pure returns (string memory) {
        // Convert address to a hex string
        string memory hexAddress = Strings.toHexString(uint256(uint160(tokenAddress)), 20);

        // Get the first 5 characters after "0x"
        bytes memory slice = new bytes(6);
        for (uint i = 0; i < 6; i++) {
            slice[i] = bytes(hexAddress)[i]; // Skip the "0x" prefix
        }

        return string(slice);
    }
}
