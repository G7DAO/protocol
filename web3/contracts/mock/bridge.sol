// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockStandardGateway {
    bytes[] public calls;

    fallback() external payable {
        calls.push(msg.data);
    }

    receive() external payable {}

    function getCalls() external view returns (bytes[] memory) {
        return calls;
    }
}


contract MockRouter {
    bytes[] public calls;
    receive() external payable {}

    function getOutboundCalldata(address _token, address _from, address _to, uint256 _amount, bytes memory _data) external pure returns (bytes memory) {
        return abi.encodeWithSelector(bytes4(keccak256("outboundTransfer(address,address,address,uint256,bytes)")), _token, _from, _to, _amount, _data);
    }

    function outboundTransfer(
        address _token,
        address _to,
        uint256 _amount,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        bytes calldata _data
    ) external payable returns (bytes memory) {
        bytes memory call = abi.encodeWithSelector(bytes4(keccak256("outboundTransfer(address,address,uint256,uint256,uint256,bytes)")), _token, _to, _amount, _maxGas, _gasPriceBid, _data);
        calls.push(call);
        return call;
    }

    function getCalls() external view returns (bytes[] memory) {
        return calls;
    }
}
