// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import "@flarenetwork/flare-periphery-contracts/coston2/FtsoV2Interface.sol";

contract ClaimsManager {
    FtsoV2Interface internal ftsoV2;

    struct Claim {
        uint256 id;
        address beneficiary;
        uint256 payoutAmount;
        bytes21 feedId;
        uint256 triggerPrice;
        bool isPriceAbove;
        uint256 createdAt;
        bool executed;
    }

    mapping(uint256 => Claim) public claims;
    uint256 public claimCounter;

    event ClaimCreated(
        uint256 indexed claimId,
        address indexed beneficiary,
        uint256 payoutAmount,
        bytes21 feedId,
        uint256 triggerPrice,
        bool isPriceAbove
    );

    event ClaimExecuted(
        uint256 indexed claimId,
        uint256 currentPrice,
        uint256 timestamp
    );

    constructor() {
        ftsoV2 = ContractRegistry.getFtsoV2();
    }

    function createClaim(
        bytes21 _feedId,
        uint256 _triggerPrice,
        bool _isPriceAbove
    ) external payable {
        require(msg.value > 0, "Must fund claim");
        require(_triggerPrice > 0, "Invalid trigger price");

        uint256 claimId = claimCounter++;

        claims[claimId] = Claim({
            id: claimId,
            beneficiary: msg.sender,
            payoutAmount: msg.value,
            feedId: _feedId,
            triggerPrice: _triggerPrice,
            isPriceAbove: _isPriceAbove,
            createdAt: block.timestamp,
            executed: false
        });

        emit ClaimCreated(
            claimId,
            msg.sender,
            msg.value,
            _feedId,
            _triggerPrice,
            _isPriceAbove
        );
    }

    function executeClaim(uint256 _claimId) external {
        Claim storage claim = claims[_claimId];
        require(!claim.executed, "Already executed");
        require(claim.payoutAmount > 0, "Claim does not exist");

        // Skip decimals with ,
        (uint256 feedValue, , uint64 timestamp) = ftsoV2.getFeedById(
            claim.feedId
        );

        bool conditionMet = claim.isPriceAbove
            ? feedValue >= claim.triggerPrice
            : feedValue <= claim.triggerPrice;

        require(conditionMet, "Price condition not met");

        claim.executed = true;

        (bool success, ) = payable(claim.beneficiary).call{
            value: claim.payoutAmount
        }("");
        require(success, "Transfer failed");

        emit ClaimExecuted(_claimId, feedValue, timestamp);
    }

    function getClaim(uint256 _claimId) external view returns (Claim memory) {
        return claims[_claimId];
    }

    // Removed 'view' keyword
    function getCurrentPrice(
        bytes21 _feedId
    ) external returns (uint256 price, int8 decimals, uint64 timestamp) {
        return ftsoV2.getFeedById(_feedId);
    }
}
