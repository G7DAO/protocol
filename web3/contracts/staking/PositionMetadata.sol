// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// OZ imports
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// Internal imports
import { StakingPool, Position } from "./data.sol";
import "../utils/DateTime.sol";

contract PositionMetadata {
    using Strings for uint8;
    using Strings for uint16;
    using Strings for uint256;
    using Strings for address;

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
                '","image": "',
                "data:image/svg+xml;base64,",
                image,
                ',"result_version":1,"attributes": ['
            )
        );

        result = abi.encodePacked(result, '{"trait_type":"Pool ID","value":"', Strings.toString(position.poolID), '"}');

        result = abi.encodePacked(
            result,
            ",",
            pool.tokenType == 721
                ? '{"trait_type":"Staked token ID","value":"'
                : '{"trait_type":"Staked amount","value":"',
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

    // Add positionParams in the future
    function generateSVG(Position memory position, StakingPool memory pool) internal view returns (string memory svg) {
        svg = string(abi.encodePacked(generateSVGForeground(position, pool)));
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

    function generateSVGForeground(
        Position memory position,
        StakingPool memory pool
    ) private view returns (string memory svg) {
        string memory tokenAmountOrIdString = pool.tokenType == 721 ? "Token ID" : "Amount staked";
        string memory amountOrTokenIDString = (position.amountOrTokenID).toString();
        
        // Timestamp string manipulations
        // string memory stakeTimestampStr = formatDateTime(DateTime.parseTimestamp(position.stakeTimestamp));
        string memory stakeTimestampStr = "2024-12-21 11:29:19";
        // string memory unlockTimestampStr = formatDateTime(DateTime.parseTimestamp(position.stakeTimestamp + pool.lockupSeconds));
        string memory unlockTimestampStr = "2024-12-31 11:29:19";
        string memory cooldownStr = (pool.cooldownSeconds).toString();

        // Pool data strings
        string memory poolIdString = (position.poolID).toString();
        string memory tokenTypeString = pool.tokenType == 1
            ? "Native"
            : pool.tokenType == 20
                ? "ERC20"
                : pool.tokenType == 721
                    ? "ERC721"
                    : "ERC1155";
        string memory tokenSymbol = pool.tokenType == 1
            ? returnTokenSymbolNative()
            : returnTokenSymbol(pool.tokenType, pool.tokenAddress);

        string memory tokenAddressString = Strings.toHexString(uint256(uint160(pool.tokenAddress)), 20);

        svg = string(
            abi.encodePacked(
                '<svg width="1840" height="1920" viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<g filter="url(#filter0_d_1689_1102)">',
                '<g clip-path="url(#clip1_1689_1102)">',
                '<rect x="120" y="80" width="1760" height="1840" rx="80" fill="#292929"/>',
                '<rect x="120" y="80" width="1760" height="1840" rx="80" fill="url(#pattern0_1689_1102)" fill-opacity="0.8"/>',
                '<rect x="120" y="80" width="1756" height="1840" fill="url(#paint1_linear_1689_1102)"/>',
                '<g style="mix-blend-mode:overlay">',
                '<rect x="120" y="1920" width="1840" height="1756" transform="rotate(-90 120 1920)" fill="url(#paint2_linear_1689_1102)" fill-opacity="0.8"/>',
                "</g>",
                '<g filter="url(#filter1_d_1689_1102)">',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="220" font-weight="800" letter-spacing="-0.04em"><tspan x="350.124" y="583.682">',
                tokenSymbol,
                "</tspan></text>",
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="220" letter-spacing="-0.04em"><tspan x="220" y="583.682">$</tspan></text>',
                "</g>",
                '<rect x="1636.541" y="181" width="107.459" height="107.459" rx="53.7295" stroke="#CBCFCB" stroke-width="7.54098"/>',
                '<path d="M1661.9905 220.5045L1673.4495 237.9445H1688.2895L1684.9200 232.8145H1695.6200L1682.8500 252.2645L1690.2700 264.5545L1718.5500 220.5045H1661.9905Z" fill="#CBCFCB"/>',
                '<path d="M1661.9905 220.5045L1673.4495 237.9445H1688.2895L1684.9200 232.8145H1695.6200L1682.8500 252.2645L1690.2700 264.5545L1718.5500 220.5045H1661.9905Z" fill="#CBCFCB"/>',
                '<rect x="221" y="873" width="1558" height="122" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="873" width="1558" height="122" rx="19" stroke="#737373" stroke-width="2"/>',
                generateTokenIdOrAmountElement(tokenAmountOrIdString, amountOrTokenIDString),
                generateStakingPeriodElements('1100', '1071.14', stakeTimestampStr, unlockTimestampStr, cooldownStr),
                '<rect x="221" y="1302" width="1033" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="1302" width="1033" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="32" letter-spacing="0em"><tspan x="221" y="1273.14">Token</tspan></text>',
                generateTokenTypeElement(tokenTypeString, tokenAddressString),
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="32" letter-spacing="0em"><tspan x="1316" y="1273.14">Token ID</tspan></text>',
                '<rect x="1317" y="1302" width="462" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="1317" y="1302" width="462" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="1355" y="1357">',amountOrTokenIDString,'</tspan></text>',
                // Pool ID
                '<rect x="221" y="1532.6" width="1558" height="90" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="1532.6" width="1558" height="90" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="32" letter-spacing="0em"><tspan x="221" y="1503.74">Pool ID</tspan></text>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1587.6">',poolIdString,'</tspan></text>',
                "</g>",
                '<rect x="122" y="82" width="1756" height="1836" rx="78" stroke="url(#paint3_linear_1689_1102)" stroke-width="4"/>',
                "</g>",
                "</svg>"
            )
        );
    }

    function generateAdminElement(string memory poolAdminString) public pure returns (string memory) {
        uint256 averageCharWidth = 17;
        uint256 horizontalPadding = 20;
        uint256 borderPadding = 96;

        // calculate correct rect width from text width and find center of text
        uint256 textWidth = bytes(poolAdminString).length * averageCharWidth;
        uint256 rectWidth = textWidth + (horizontalPadding * 2);
        uint256 xPos = 1840 - rectWidth - borderPadding;
        uint256 textY = 181 + (48 / 2) + (28 / 2) - 4;

        // Build SVG string with minimal variables
        return
            string(
                abi.encodePacked(
                    '<rect x="',
                    xPos.toString(),
                    '" y="181" width="',
                    rectWidth.toString(),
                    '" height="48" rx="21" fill="#FFEFB8" fill-opacity="0.4"/>',
                    '<rect x="',
                    xPos.toString(),
                    '" y="181" width="',
                    rectWidth.toString(),
                    '" height="48" rx="21" stroke="#737373" stroke-width="2"/>',
                    '<text x="',
                    (xPos + horizontalPadding).toString(),
                    '" y="',
                    textY.toString(),
                    '" fill="#FFEFB8" font-family="Courier New" font-size="28" font-weight="bold">',
                    poolAdminString,
                    "</text>"
                )
            );
    }

    function generateTokenIdOrAmountElement(string memory tokenIdOrAmountString, string memory amountOrTokenIDString) public pure returns (string memory) {
        string memory fontFamily = "Courier New";
        return (
            string(
                abi.encodePacked(
                    '<text x="220" y="844.14" fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="',
                    fontFamily,
                    '"  font-size="32" font-weight="bold" letter-spacing="0em">',
                    tokenIdOrAmountString,
                    "</text>",
                    '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="80" font-weight="bold" letter-spacing="0em"><tspan x="260" y="957">',                
                    amountOrTokenIDString,
                    "</tspan></text>"
                )
            )
        );
    }

    function generateTokenTypeElement(
        string memory tokenTypeString,
        string memory tokenAddressString
    ) public pure returns (string memory) {
        string memory fontFamily = "Courier New";
        uint256 averageCharWidth = 16;
        uint256 horizontalPadding = 20;
        // calculate correct rect width from text width and find center of text
        uint256 textWidth = bytes(tokenTypeString).length * averageCharWidth;
        uint256 rectWidth = textWidth + (horizontalPadding * 2);
        return
            string(
                abi.encodePacked(
                    '<rect x="241" y="1322" width="',
                    rectWidth.toString(),
                    '" height="48" rx="21" stroke="#FFEFB8" stroke-width="0.4"/>',
                    '<text x="260" y="1357" fill="#FFEFB8" font-family="',
                    fontFamily,
                    '" font-size="28" font-weight="bold">',
                    tokenTypeString,
                    "</text>",
                    '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="',
                    fontFamily,
                    '" font-size="32" letter-spacing="0em"><tspan x="388" y="1357">',
                    tokenAddressString,
                    "</tspan></text>"
                )
            );
    }

    function generateStakingPeriodElements(
        string memory yPos,
        string memory titleYPos,        
        string memory stakeTimestampStr,
        string memory unlockTimestampStr,
        string memory cooldownStr
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="32" letter-spacing="0em"><tspan x="220" y="', titleYPos ,'">Staked at</tspan></text>',
                '<rect x="221" y="', yPos, '" width="522" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="', yPos, '" width="522" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="260" y="1157.55">',
                stakeTimestampStr,
                "</tspan></text>",
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="32" letter-spacing="0em"><tspan x="768" y="', titleYPos ,'">Unlocks at</tspan></text>',
                '<rect x="769" y="', yPos, '" width="522" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="769" y="', yPos, '" width="522" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="808" y="1157.55">',
                unlockTimestampStr,
                "</tspan></text>",
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="32" letter-spacing="0em"><tspan x="1316" y="', titleYPos ,'">Cooldown</tspan></text>',
                '<rect x="1317" y="', yPos, '" width="462" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="1317" y="', yPos, '" width="462" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="Courier New" font-size="40" letter-spacing="0em"><tspan x="1356" y="1157.55">',
                cooldownStr, ' seconds', 
                "</tspan></text>"
            )
        );
    }


    function returnTokenSymbolNative() public view returns (string memory) {
        uint256 chainId = block.chainid;
        // Ethereum mainnet or arbitrum sepolia
        if (chainId == 1 || chainId == 421614) return "ETH";
        else if (chainId == 13746) return "G7";
        else return "N/A";
    }

    function returnTokenSymbol(uint256 tokenType, address tokenAddress) public view returns (string memory) {
        if (tokenType == 20) return ERC20(tokenAddress).symbol();
        else if (tokenType == 721) return ERC721(tokenAddress).symbol();
        else return "N/A";
    }
}
