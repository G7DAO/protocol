// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockLinkToken.sol";

import "@chainlink/contracts/src/v0.8/vrf/VRFRequestIDBase.sol";

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

/**
 * @title MockChainlinkCordinator contract, to use VRF it locally
 */
contract MockChainlinkCoordinator is VRFRequestIDBase {
    MockLinkToken internal LINK;

    constructor(address _link) {
        LINK = MockLinkToken(_link);
    }

    struct Callback {
        // Tracks an ongoing request
        address callbackContract; // Requesting contract, which will receive response
        // Amount of LINK paid at request time. Total LINK = 1e9 * 1e18 < 2^96, so
        // this representation is adequate, and saves a word of storage when this
        // field follows the 160-bit callbackContract address.
        uint96 randomnessFee;
        // Commitment to seed passed to oracle by this contract, and the number of
        // the block in which the request appeared. This is the keccak256 of the
        // concatenation of those values. Storing this commitment saves a word of
        // storage.
        bytes32 seedAndBlockNum;
    }

    struct ServiceAgreement {
        // Tracks oracle commitments to VRF service
        address vRFOracle; // Oracle committing to respond with VRF service
        uint96 fee; // Minimum payment for oracle response. Total LINK=1e9*1e18<2^96
        bytes32 jobID; // ID of corresponding chainlink job in oracle's DB
    }

    mapping(bytes32 => Callback) /* (provingKey, seed) */
        public callbacks;
    mapping(bytes32 => ServiceAgreement) /* provingKey */
        public serviceAgreements;
    mapping(address => uint256) /* oracle */ /* LINK balance */
        public withdrawableTokens;
    mapping(bytes32 => mapping(address => uint256)) /* provingKey */ /* consumer */
        private nonces;

    // The oracle only needs the jobID to look up the VRF, but specifying public
    // key as well prevents a malicious oracle from inducing VRF outputs from
    // another oracle by reusing the jobID.
    event RandomnessRequest(
        bytes32 keyHash,
        uint256 seed,
        bytes32 indexed jobID,
        address sender,
        uint256 fee,
        bytes32 requestID
    );

    event NewServiceAgreement(bytes32 keyHash, uint256 fee);

    event RandomnessRequestFulfilled(bytes32 requestId, uint256 output);

    /**
     * @notice Called by LINK.transferAndCall, on successful LINK transfer
     *
     * @dev To invoke this, use the requestRandomness method in VRFConsumerBase.
     *
     * @dev The VRFCoordinator will call back to the calling contract when the
     * @dev oracle responds, on the method fulfillRandomness. See
     * @dev VRFConsumerBase.fulfilRandomness for its signature. Your consuming
     * @dev contract should inherit from VRFConsumerBase, and implement
     * @dev fulfilRandomness.
     *
     * @param _sender address: who sent the LINK (must be a contract)
     * @param _fee amount of LINK sent
     * @param _data abi-encoded call to randomnessRequest
     */
    function onTokenTransfer(
        address _sender,
        uint256 _fee,
        bytes memory _data
    ) public onlyLINK {
        (bytes32 keyHash, uint256 seed) = abi.decode(_data, (bytes32, uint256));
        randomnessRequest(keyHash, seed, _fee, _sender);
    }

    /**
     * @notice creates the chainlink request for randomness
     *
     * @param _keyHash ID of the VRF public key against which to generate output
     * @param _consumerSeed Input to the VRF, from which randomness is generated
     * @param _feePaid Amount of LINK sent with request. Must exceed fee for key
     * @param _sender Requesting contract; to be called back with VRF output
     *
     * @dev _consumerSeed is mixed with key hash, sender address and nonce to
     * @dev obtain preSeed, which is passed to VRF oracle, which mixes it with the
     * @dev hash of the block containing this request, to compute the final seed.
     *
     * @dev The requestId used to store the request data is constructed from the
     * @dev preSeed and keyHash.
     */
    function randomnessRequest(
        bytes32 _keyHash,
        uint256 _consumerSeed,
        uint256 _feePaid,
        address _sender
    ) internal sufficientLINK(_feePaid, _keyHash) {
        uint256 nonce = nonces[_keyHash][_sender];
        uint256 preSeed = makeVRFInputSeed(
            _keyHash,
            _consumerSeed,
            _sender,
            nonce
        );
        bytes32 requestId = makeRequestId(_keyHash, preSeed);
        // Cryptographically guaranteed by preSeed including an increasing nonce
        assert(callbacks[requestId].callbackContract == address(0));
        callbacks[requestId].callbackContract = _sender;
        assert(_feePaid < 1e27); // Total LINK fits in uint96
        callbacks[requestId].randomnessFee = uint96(_feePaid);
        callbacks[requestId].seedAndBlockNum = keccak256(
            abi.encodePacked(preSeed, block.number)
        );
        emit RandomnessRequest(
            _keyHash,
            preSeed,
            serviceAgreements[_keyHash].jobID,
            _sender,
            _feePaid,
            requestId
        );
        nonces[_keyHash][_sender]++;
    }

    // Offsets into fulfillRandomnessRequest's _proof of various values
    //
    // Public key. Skips byte array's length prefix.
    uint256 public constant PUBLIC_KEY_OFFSET = 0x20;
    // Seed is 7th word in proof, plus word for length, (6+1)*0x20=0xe0
    uint256 public constant PRESEED_OFFSET = 0xe0;

    function mockFulfillRandomnessRequest(
        bytes32 requestId,
        uint256 randomness,
        address callbackContract
    ) public {
        // Forget request. Must precede callback (prevents reentrancy)
        delete callbacks[requestId];

        callBackWithRandomness(requestId, randomness, callbackContract);

        emit RandomnessRequestFulfilled(requestId, randomness);
    }

    function callBackWithRandomness(
        bytes32 requestId,
        uint256 randomness,
        address consumerContract
    ) internal {
        // Dummy variable; allows access to method selector in next line. See
        // https://github.com/ethereum/solidity/issues/3506#issuecomment-553727797
        VRFConsumerBase v;
        bytes memory resp = abi.encodeWithSelector(
            v.rawFulfillRandomness.selector,
            requestId,
            randomness
        );
        // The bound b here comes from https://eips.ethereum.org/EIPS/eip-150. The
        // actual gas available to the consuming contract will be b-floor(b/64).
        // This is chosen to leave the consuming contract ~200k gas, after the cost
        // of the call itself.
        uint256 b = 206000;
        require(gasleft() >= b, "not enough gas for consumer");
        // A low-level call is necessary, here, because we don't want the consuming
        // contract to be able to revert this execution, and thus deny the oracle
        // payment for a valid randomness response. This also necessitates the above
        // check on the gasleft, as otherwise there would be no indication if the
        // callback method ran out of gas.
        //
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = consumerContract.call(resp);
        // Avoid unused-local-variable warning. (success is only present to prevent
        // a warning that the return value of consumerContract.call is unused.)
        (success);
    }

    /**
     * @dev Reverts if amount is not at least what was agreed upon in the service agreement
     * @param _feePaid The payment for the request
     * @param _keyHash The key which the request is for
     */
    modifier sufficientLINK(uint256 _feePaid, bytes32 _keyHash) {
        require(
            _feePaid >= serviceAgreements[_keyHash].fee,
            "Below agreed payment"
        );
        _;
    }

    /**
     * @dev Reverts if not sent from the LINK token
     */
    modifier onlyLINK() {
        require(msg.sender == address(LINK), "Must use LINK token");
        _;
    }
}
