// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Strings.sol";
import { StakingPool, Position } from "./data.sol";

/// @title SVGGenerate
/// @notice Contains a function to generate the G7 Position NFT.
/// @notice Function `generateSVG()` will be consumed by the `PositionMetadata` contract.
library SVGGenerate {
    using Strings for uint256;
    using Strings for address;

    // todo: add proper SVG position params here. Below is just a placeholder
    struct PositionParams {
        string poolId;
        address owner;
    }

    // Add positionParams in the future
    function generateSVG(
            uint256 positionTokenID,
            Position memory position,
            StakingPool memory pool
        ) internal pure returns (string memory svg) {
        svg = string(
            abi.encodePacked(
                // generateSVGBackground(),
                generateSVGForeground(positionTokenID, position, pool)
            )
        );
    }

    function generateSVGForeground(
            uint256 positionTokenID,
            Position memory position,
            StakingPool memory pool
    ) private pure returns (string memory svg) {
        string memory tokenAmountOrIdString = pool.tokenType == 721 ? "Token ID" : "Amount staked";
        string memory poolAdminString = Strings.toHexString(uint256(uint160(pool.administrator)), 20);
        string memory amountOrTokenIDString = position.amountOrTokenID.toString();
        string memory stakeTimestampStr = position.stakeTimestamp.toString();
        string memory unlockTimestampStr = (position.unstakeInitiatedAt + pool.lockupSeconds).toString();
        string memory cooldownStr = pool.cooldownSeconds.toString();
        string memory poolIdString = position.poolID.toString();
        string memory tokenTypeString = pool.tokenType == 1
            ? "Native"
            : pool.tokenType == 20
            ? "ERC20"
            : pool.tokenType == 721
            ? "ERC721"
            : "ERC1155";

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
                '</g>',
                '<g filter="url(#filter1_d_1689_1102)">',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="380" font-weight="800" letter-spacing="-0.04em"><tspan x="447.124" y="583.682">G7</tspan></text>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="380" letter-spacing="-0.04em"><tspan x="220" y="583.682">$</tspan></text>',
                '<rect x="1655" y="181" width="127" height="48" rx="21" fill="#FFEFB8" fill-opacity="0.4"/>',
                '<rect x="1655" y="181" width="127" height="48" rx="21" stroke="#737373" stroke-width="2"/>',
                '<text fill="#FFEFB8" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="28" font-weight="bold" letter-spacing="0em"><tspan x="1674" y="215.182">',poolAdminString,'</tspan></text>',
                '</g>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="58.7383" font-weight="900" letter-spacing="0.01em"><tspan x="220" y="1756.22">FORK THE WORLD.</tspan></text>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="58.7383" font-weight="900" letter-spacing="0.01em"><tspan x="220" y="1811.22">OWN THE FUTURE.</tspan></text>',
                '<rect x="1668.77" y="1705.77" width="107.459" height="107.459" rx="53.7295" stroke="#CBCFCB" stroke-width="7.54098"/>',
                '<path d="M1693.75 1741.59L1705.21 1759.03H1720.05L1716.68 1753.9H1727.38L1714.61 1773.35L1722.03 1784.64L1750.31 1741.59H1693.75Z" fill="#CBCFCB"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="58.7383" font-weight="900" letter-spacing="0.01em"><tspan x="220" y="1756.22">FORK THE WORLD.</tspan></text>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="58.7383" font-weight="900" letter-spacing="0.01em"><tspan x="220" y="1811.22">OWN THE FUTURE.</tspan></text>',
                '<rect x="1668.77" y="1705.77" width="107.459" height="107.459" rx="53.7295" stroke="#CBCFCB" stroke-width="7.54098"/>',
                '<path d="M1693.75 1741.59L1705.21 1759.03H1720.05L1716.68 1753.9H1727.38L1714.61 1773.35L1722.03 1784.64L1750.31 1741.59H1693.75Z" fill="#CBCFCB"/>',
                '<rect x="221" y="873" width="1558" height="77" rx="19" fill="#CBCFCB" fill-opacity="0.2"/>',
                '<rect x="221" y="873" width="1558" height="77" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="32" font-weight="500" letter-spacing="0em"><tspan x="240" y="923.136">Token Address</tspan></text>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="32" letter-spacing="0em"><tspan x="959.125" y="923.136">0x9ed191DB1829371F116Deb9748c26B49467a592A</tspan></text>',
                '<rect x="221" y="998" width="1558" height="190" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="998" width="1558" height="190" rx="19" stroke="#737373" stroke-width="2"/>',
                '<rect x="241" y="1018" width="248" height="48" rx="21" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="241" y="1018" width="248" height="48" rx="21" stroke="#737373" stroke-width="2"/>',
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="28" font-weight="bold" letter-spacing="0em"><tspan x="260" y="1052.18">', tokenAmountOrIdString, '</tspan></text>',
            '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="80" font-weight="bold" letter-spacing="0em"><tspan x="240" y="1157.18">',amountOrTokenIDString,'</tspan></text>',
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="32" letter-spacing="0em"><tspan x="220" y="1266.14">Staked at</tspan></text>',
                '<rect x="221" y="1295" width="502" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="1295" width="502" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="40" letter-spacing="0em"><tspan x="260" y="1352.55">', stakeTimestampStr ,'</tspan></text>',
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="32" letter-spacing="0em"><tspan x="748" y="1266.14">Unlocks at</tspan></text>',
                '<rect x="749" y="1295" width="502" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="749" y="1295" width="502" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="40" letter-spacing="0em"><tspan x="788" y="1352.55">',unlockTimestampStr,'</tspan></text>',
                '<text fill="#7E807E" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="32" letter-spacing="0em"><tspan x="1276" y="1266.14">Cooldown</tspan></text>',
                '<rect x="1277" y="1295" width="502" height="86" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="1277" y="1295" width="502" height="86" rx="19" stroke="#737373" stroke-width="2"/>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Courier New\'" font-size="40" letter-spacing="0em"><tspan x="1316" y="1352.55">Initiated at ', cooldownStr,'</tspan></text>',
                '<rect x="221" y="1429" width="1558" height="113" rx="19" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="221" y="1429" width="1558" height="113" rx="19" stroke="#737373" stroke-width="2"/>',
                '<rect x="241" y="1461.5" width="126" height="48" rx="21" fill="#18181B" fill-opacity="0.8"/>',
                '<rect x="241" y="1461.5" width="126" height="48" rx="21" stroke="#737373" stroke-width="2"/>',
                '<text fill="#FFEFB8" xml:space="preserve" style="white-space: pre" font-family="\'Inter\'" font-size="28" font-weight="bold" letter-spacing="0em"><tspan x="260" y="1495.68">',tokenTypeString,'</tspan></text>',
                '<text fill="#CBCFCB" xml:space="preserve" style="white-space: pre" font-family="\'Inter\'" font-size="32" letter-spacing="0em"><tspan x="388" y="1477.77">', poolIdString, '</tspan></text>',
                '</g>',
                '<rect x="122" y="82" width="1756" height="1836" rx="78" stroke="url(#paint3_linear_1689_1102)" stroke-width="4"/>',
                '</g>',
                '</svg>'
            )
        );
    }
}