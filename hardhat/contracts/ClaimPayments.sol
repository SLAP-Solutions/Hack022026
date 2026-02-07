// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import "@flarenetwork/flare-periphery-contracts/coston2/FtsoV2Interface.sol";

/**
 * @title ClaimPayments
 * @author Insurance dApp Team - ETH Oxford 2026 Hackathon
 * @notice Manages insurance claim payments with dynamic crypto amounts based on real-time oracle prices
 * @dev Uses Flare's FTSO v2 for decentralized price feeds
 * 
 * CONCEPT:
 * Insurance companies hold crypto reserves and need to pay claims in USD value.
 * To optimize costs, they want to pay when crypto prices are favorable.
 * 
 * Example: Company owes $1,000 USD claim, holds BTC reserves
 * - If BTC = $50,000: Must pay 0.02 BTC ($1,000 / $50k)
 * - If BTC = $70,000: Only pay 0.0143 BTC ($1,000 / $70k) ← BETTER!
 * 
 * EXECUTION LOGIC (Take Profit / Stop Loss):
 * - Stop Loss (Lower Limit): If price drops to or below this, execute to prevent paying even MORE crypto
 * - Take Profit (Upper Limit): When price reaches or exceeds this HIGH, execute to pay MINIMAL crypto
 * - Payment executes when: currentPrice ≤ stopLossPrice OR currentPrice ≥ takeProfitPrice
 * - Payment is PENDING when: stopLossPrice < currentPrice < takeProfitPrice
 */
contract ClaimPayments {
    /// @notice Flare Time Series Oracle v2 interface
    FtsoV2Interface internal ftsoV2;

    /// @notice Represents a single claim payment with price-based execution triggers
    struct ClaimPayment {
        uint256 id;                 // Unique payment identifier
        address payer;              // Insurance company creating the payment
        address receiver;           // Beneficiary receiving the payment
        uint256 usdAmount;          // USD value to pay (stored in cents: $1000 = 100000)
        bytes21 cryptoFeedId;       // FTSO feed ID for payment crypto (e.g., BTC/USD)
        uint256 stopLossPrice;      // Lower limit: execute if price drops to this (pay more crypto before worse)
        uint256 takeProfitPrice;    // Upper limit: execute when price reaches this (pay minimal crypto)
        uint256 collateralAmount;   // Native FLR locked as collateral & gas reserve
        uint256 createdAt;          // Block timestamp when payment was created
        uint256 expiresAt;          // Deadline timestamp - payment cannot execute after this
        bool executed;              // Whether payment has been completed
        uint256 executedAt;         // Block timestamp when payment was executed (0 if not executed)
        uint256 executedPrice;      // Crypto price at execution time (0 if not executed)
        uint256 paidAmount;         // Actual crypto amount paid to receiver (0 if not executed)
    }

    /// @notice Mapping of payment ID to ClaimPayment struct
    mapping(uint256 => ClaimPayment) public claimPayments;
    
    /// @notice Counter for generating unique payment IDs
    uint256 public paymentCounter;

    /// @notice Emitted when a new claim payment is created
    event ClaimPaymentCreated(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed receiver,
        uint256 usdAmount,
        bytes21 cryptoFeedId,
        uint256 stopLossPrice,
        uint256 takeProfitPrice,
        uint256 expiresAt
    );

    /// @notice Emitted when a claim payment is successfully executed
    event ClaimPaymentExecuted(
        uint256 indexed paymentId,
        address indexed executor,
        uint256 executedPrice,
        uint256 paidAmount,
        uint256 refundedAmount,
        uint256 timestamp
    );

    /// @notice Emitted when a claim payment is cancelled by the payer
    event ClaimPaymentCancelled(
        uint256 indexed paymentId,
        address indexed payer,
        uint256 refundedAmount
    );

    /**
     * @notice Initializes the contract and connects to Flare's FTSO v2
     * @dev Uses ContractRegistry to get the canonical FtsoV2 address on Coston2
     */
    constructor() {
        ftsoV2 = ContractRegistry.getFtsoV2();
    }

    /**
     * @notice Creates a new claim payment with price-based execution triggers
     * @dev Payment will execute when oracle price is within [stopLossPrice, takeProfitPrice] range
     * 
     * @param _receiver Address that will receive the payment
     * @param _usdAmount USD value to pay in cents (e.g., $1000 = 100000)
     * @param _cryptoFeedId FTSO feed ID for payment crypto (see https://dev.flare.network/ftso/feeds)
     * @param _stopLossPrice Lower price limit - execute if price drops here (in feed decimals)
     * @param _takeProfitPrice Upper price limit - execute when price reaches here (in feed decimals)
     * @param _expiryDays Number of days until payment expires and can be cancelled
     * 
     * @return paymentId The unique identifier for the created payment
     * 
     * Requirements:
     * - Receiver address must be valid (non-zero)
     * - USD amount must be greater than zero
     * - Take profit price must be greater than stop loss price
     * - Must send collateral (msg.value) to cover potential payment amount
     * - Expiry days must be greater than zero
     */
    function createClaimPayment(
        address _receiver,
        uint256 _usdAmount,
        bytes21 _cryptoFeedId,
        uint256 _stopLossPrice,
        uint256 _takeProfitPrice,
        uint256 _expiryDays
    ) external payable returns (uint256 paymentId) {
        require(_receiver != address(0), "ClaimPayments: Invalid receiver address");
        require(_usdAmount > 0, "ClaimPayments: USD amount must be positive");
        require(_takeProfitPrice > _stopLossPrice, "ClaimPayments: Take profit must be > stop loss");
        require(msg.value > 0, "ClaimPayments: Must provide collateral");
        require(_expiryDays > 0, "ClaimPayments: Expiry days must be positive");

        paymentId = paymentCounter++;
        uint256 expiryTimestamp = block.timestamp + (_expiryDays * 1 days);

        claimPayments[paymentId] = ClaimPayment({
            id: paymentId,
            payer: msg.sender,
            receiver: _receiver,
            usdAmount: _usdAmount,
            cryptoFeedId: _cryptoFeedId,
            stopLossPrice: _stopLossPrice,
            takeProfitPrice: _takeProfitPrice,
            collateralAmount: msg.value,
            createdAt: block.timestamp,
            expiresAt: expiryTimestamp,
            executed: false,
            executedAt: 0,
            executedPrice: 0,
            paidAmount: 0
        });

        emit ClaimPaymentCreated(
            paymentId,
            msg.sender,
            _receiver,
            _usdAmount,
            _cryptoFeedId,
            _stopLossPrice,
            _takeProfitPrice,
            expiryTimestamp
        );
    }

    /**
     * @notice Executes a claim payment if price conditions are met
     * @dev Anyone can call this function - execution is permissionless once conditions are satisfied
     * 
     * Price Execution Logic:
     * - Queries Flare FTSO v2 for current crypto price
     * - Executes if price hits stop loss (≤ lower limit) OR take profit (≥ upper limit)
     * - Calculates crypto amount needed: (usdAmount * 10^decimals) / currentPrice
     * - Pays receiver the calculated crypto amount
     * - Refunds excess collateral to payer
     * 
     * @param _paymentId The ID of the payment to execute
     * 
     * Requirements:
     * - Payment must exist and not be executed
     * - Current time must be before expiry deadline
     * - Current FTSO price must be at or beyond one of the trigger points
     * - Collateral must be sufficient to cover calculated payment amount
     * 
     * Emits ClaimPaymentExecuted event with execution details
     */
    function executeClaimPayment(uint256 _paymentId) external {
        ClaimPayment storage payment = claimPayments[_paymentId];
        
        require(!payment.executed, "ClaimPayments: Already executed");
        require(payment.collateralAmount > 0, "ClaimPayments: Payment does not exist");
        require(block.timestamp <= payment.expiresAt, "ClaimPayments: Payment expired");

        // Query current price from Flare FTSO v2
        (uint256 currentPrice, int8 decimals, uint64 timestamp) = 
            ftsoV2.getFeedById(payment.cryptoFeedId);

        // Verify price has hit a trigger point
        // Execute if: price dropped to/below stop loss OR price reached/exceeded take profit
        require(
            currentPrice <= payment.stopLossPrice || 
            currentPrice >= payment.takeProfitPrice,
            "ClaimPayments: Price not at trigger point (still pending)"
        );

        // Calculate crypto amount based on current oracle price
        // Formula: cryptoAmount = (usdAmountInCents * 10^18 Wei * 10^decimals) / (currentPrice * 100)
        // Example with $0.32 @ $2058.44 ETH: (32 * 10^18 * 10^3) / (2058440 * 100) = 0.000155494 ETH
        uint256 paymentAmount = (payment.usdAmount * 1e18 * (10 ** uint256(int256(decimals)))) / (currentPrice * 100);

        require(paymentAmount <= payment.collateralAmount, "ClaimPayments: Insufficient collateral");

        // Update payment state before transfers (checks-effects-interactions pattern)
        payment.executed = true;
        payment.executedAt = block.timestamp;
        payment.executedPrice = currentPrice;
        payment.paidAmount = paymentAmount;

        // Transfer calculated amount to receiver
        (bool paymentSuccess, ) = payable(payment.receiver).call{value: paymentAmount}("");
        require(paymentSuccess, "ClaimPayments: Payment transfer failed");

        // Refund excess collateral to payer
        uint256 excessCollateral = payment.collateralAmount - paymentAmount;
        if (excessCollateral > 0) {
            (bool refundSuccess, ) = payable(payment.payer).call{value: excessCollateral}("");
            require(refundSuccess, "ClaimPayments: Refund transfer failed");
        }

        emit ClaimPaymentExecuted(
            _paymentId,
            msg.sender,
            currentPrice,
            paymentAmount,
            excessCollateral,
            timestamp
        );
    }

    /**
     * @notice Creates and immediately executes a payment in a single transaction
     * @dev Combines createClaimPayment + executeClaimPayment for instant payments
     * 
     * This function is useful when:
     * - You want instant payment without waiting for price triggers
     * - Current price is acceptable for immediate execution
     * - You want to minimize transactions and gas costs
     * 
     * @param _receiver Address that will receive the payment
     * @param _usdAmount USD value to pay in cents (e.g., $1000 = 100000)
     * @param _cryptoFeedId FTSO feed ID for payment crypto
     * 
     * @return paymentId The unique identifier for the created and executed payment
     * 
     * Requirements:
     * - Receiver address must be valid (non-zero)
     * - USD amount must be greater than zero
     * - Must send sufficient collateral (msg.value) to cover payment amount
     * 
     * Emits ClaimPaymentCreated and ClaimPaymentExecuted events
     */
    function createAndExecutePayment(
        address _receiver,
        uint256 _usdAmount,
        bytes21 _cryptoFeedId
    ) external payable returns (uint256 paymentId) {
        require(_receiver != address(0), "ClaimPayments: Invalid receiver address");
        require(_usdAmount > 0, "ClaimPayments: USD amount must be positive");
        require(msg.value > 0, "ClaimPayments: Must provide collateral");

        // Query current price from FTSO
        (uint256 currentPrice, int8 decimals, uint64 timestamp) = 
            ftsoV2.getFeedById(_cryptoFeedId);

        // Calculate payment amount needed at current price
        uint256 paymentAmount = (_usdAmount * 1e18 * (10 ** uint256(int256(decimals)))) / (currentPrice * 100);

        require(paymentAmount <= msg.value, "ClaimPayments: Insufficient collateral");

        // Create payment record with instant execution
        paymentId = paymentCounter++;
        uint256 expiryTimestamp = block.timestamp + 1 days; // Expires in 1 day (already executed)

        claimPayments[paymentId] = ClaimPayment({
            id: paymentId,
            payer: msg.sender,
            receiver: _receiver,
            usdAmount: _usdAmount,
            cryptoFeedId: _cryptoFeedId,
            stopLossPrice: currentPrice, // Set to current price (already executed)
            takeProfitPrice: currentPrice, // Set to current price (already executed)
            collateralAmount: msg.value,
            createdAt: block.timestamp,
            expiresAt: expiryTimestamp,
            executed: true, // Mark as executed immediately
            executedAt: block.timestamp,
            executedPrice: currentPrice,
            paidAmount: paymentAmount
        });

        // Transfer payment to receiver
        (bool paymentSuccess, ) = payable(_receiver).call{value: paymentAmount}("");
        require(paymentSuccess, "ClaimPayments: Payment transfer failed");

        // Refund excess collateral to payer
        uint256 excessCollateral = msg.value - paymentAmount;
        if (excessCollateral > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excessCollateral}("");
            require(refundSuccess, "ClaimPayments: Refund transfer failed");
        }

        emit ClaimPaymentCreated(
            paymentId,
            msg.sender,
            _receiver,
            _usdAmount,
            _cryptoFeedId,
            currentPrice, // stopLossPrice = currentPrice
            currentPrice, // takeProfitPrice = currentPrice
            expiryTimestamp
        );

        emit ClaimPaymentExecuted(
            paymentId,
            msg.sender,
            currentPrice,
            paymentAmount,
            excessCollateral,
            timestamp
        );
    }

    /**
     * @notice Cancels a claim payment and refunds collateral to payer
     * @dev Can only be called by the original payer before execution
     * 
     * @param _paymentId The ID of the payment to cancel
     * 
     * Requirements:
     * - Payment must exist and not be executed
     * - Caller must be the original payer
     * 
     * Emits ClaimPaymentCancelled event with refund details
     */
    function cancelClaimPayment(uint256 _paymentId) external {
        ClaimPayment storage payment = claimPayments[_paymentId];
        
        require(!payment.executed, "ClaimPayments: Already executed");
        require(msg.sender == payment.payer, "ClaimPayments: Only payer can cancel");
        require(payment.collateralAmount > 0, "ClaimPayments: Payment does not exist");

        uint256 refundAmount = payment.collateralAmount;
        
        // Clear collateral before transfer (checks-effects-interactions pattern)
        payment.collateralAmount = 0;

        (bool success, ) = payable(payment.payer).call{value: refundAmount}("");
        require(success, "ClaimPayments: Refund transfer failed");

        emit ClaimPaymentCancelled(_paymentId, msg.sender, refundAmount);
    }

    /**
     * @notice Retrieves complete details of a claim payment
     * @param _paymentId The ID of the payment to query
     * @return The full ClaimPayment struct
     */
    function getClaimPayment(uint256 _paymentId) external view returns (ClaimPayment memory) {
        return claimPayments[_paymentId];
    }

    /**
     * @notice Gets current price for a given crypto feed from FTSO v2
     * @dev This is a state-changing call (not view) as FTSO may charge fees during volatility
     * @param _feedId The FTSO feed ID to query (e.g., BTC/USD, ETH/USD)
     * @return price Current feed value
     * @return decimals Number of decimal places in the price
     * @return timestamp Unix timestamp of the price update
     */
    function getCurrentPrice(bytes21 _feedId) external returns (uint256 price, int8 decimals, uint64 timestamp) {
        return ftsoV2.getFeedById(_feedId);
    }

    /**
     * @notice Checks if a payment is eligible for execution (view-only estimate)
     * @dev Note: This is an estimate. Actual price check happens during execution.
     * @param _paymentId The ID of the payment to check
     * @return executable True if payment is not executed and not expired
     */
    function isPaymentExecutable(uint256 _paymentId) external view returns (bool executable) {
        ClaimPayment memory payment = claimPayments[_paymentId];
        
        if (payment.executed) return false;
        if (block.timestamp > payment.expiresAt) return false;
        if (payment.collateralAmount == 0) return false;
        
        return true;
    }

    /**
     * @notice Returns the total number of payments created
     * @return Total count of claim payments
     */
    function getTotalPayments() external view returns (uint256) {
        return paymentCounter;
    }

    /**
     * @notice Calculates potential crypto amount for a payment at a given price
     * @dev Useful for UI to show estimated payout amounts
     * @param _paymentId The payment ID to calculate for
     * @param _estimatedPrice The price to use for calculation (in feed decimals)
     * @param _decimals The number of decimals for the price
     * @return estimatedAmount The calculated crypto amount
     */
    function estimatePayoutAmount(
        uint256 _paymentId,
        uint256 _estimatedPrice,
        int8 _decimals
    ) external view returns (uint256 estimatedAmount) {
        ClaimPayment memory payment = claimPayments[_paymentId];
        require(payment.collateralAmount > 0, "ClaimPayments: Payment does not exist");
        
        estimatedAmount = (payment.usdAmount * 1e18 * (10 ** uint256(int256(_decimals)))) / (_estimatedPrice * 100);
    }
}
