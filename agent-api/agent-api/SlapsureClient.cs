using System.ComponentModel;
using System.Net.Http.Json;
using System.Text.Json;

namespace agent_api
{
    /// <summary>
    /// Exception thrown when a tool call fails, allowing the orchestrator to catch and report it
    /// </summary>
    public class ToolCallException : Exception
    {
        public int? StatusCode { get; }
        public string OperationName { get; }
        
        public ToolCallException(string operationName, string message, int? statusCode = null) 
            : base(message)
        {
            OperationName = operationName;
            StatusCode = statusCode;
        }
        
        public ToolCallException(string operationName, string message, Exception innerException) 
            : base(message, innerException)
        {
            OperationName = operationName;
        }
    }

    [Description("Client for interacting with the Slapsure insurance claims management API. Provides methods for managing claims, contacts, and payments.")]
    public class SlapsureClient
    {
        private readonly HttpClient _httpClient;
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public SlapsureClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        private async Task<T> ExecuteAsync<T>(Func<Task<HttpResponseMessage>> request, string operationName)
        {
            HttpResponseMessage response;
            try
            {
                response = await request();
            }
            catch (HttpRequestException ex)
            {
                throw new ToolCallException(operationName, $"{operationName} failed - HTTP error: {ex.Message}", ex);
            }
            catch (TaskCanceledException ex)
            {
                throw new ToolCallException(operationName, $"{operationName} failed - Request timeout: {ex.Message}", ex);
            }
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                var errorMsg = $"{operationName} failed with status {(int)response.StatusCode} ({response.StatusCode}): {errorBody}";
                throw new ToolCallException(operationName, errorMsg, (int)response.StatusCode);
            }
            
            var data = await response.Content.ReadFromJsonAsync<T>(_jsonOptions);
            if (data == null)
            {
                throw new ToolCallException(operationName, $"{operationName} failed - Response was null or could not be deserialized");
            }
            return data;
        }

        [Description("Retrieves all insurance claims/invoices for a specific wallet. Returns a list of all claims with their status, total cost, payments, and creation date. Throws an exception if the operation fails.")]
        public async Task<List<Claim>> GetClaimsAsync(
            [Description("The wallet ID to retrieve invoices for.")] string walletId)
        {
            return await ExecuteAsync<List<Claim>>(
                () => _httpClient.GetAsync($"/api/invoices?walletId={Uri.EscapeDataString(walletId)}"),
                "GetClaims");
        }

        [Description("Retrieves a specific insurance claim/invoice by its unique identifier. Returns the claim details including status, total cost, and associated payments. Throws an exception if the operation fails.")]
        public async Task<Claim> GetClaimByIdAsync(
            [Description("The unique identifier of the claim/invoice to retrieve.")] string id,
            [Description("The wallet ID that owns this invoice.")] string walletId)
        {
            return await ExecuteAsync<Claim>(
                () => _httpClient.GetAsync($"/api/invoices/{Uri.EscapeDataString(id)}?walletId={Uri.EscapeDataString(walletId)}"),
                "GetClaimById");
        }

        [Description("Creates a new insurance claim/invoice in the system. Returns the newly created claim with its assigned ID and initial status. Throws an exception if the operation fails.")]
        public async Task<Claim> CreateClaimAsync(
            [Description("The claim creation request containing the details for the new claim.")] CreateClaimRequest request)
        {
            return await ExecuteAsync<Claim>(
                () => _httpClient.PostAsJsonAsync("/api/invoices", request, _jsonOptions),
                "CreateClaim");
        }

        [Description("Creates a new invoice in the Cosmos DB. Use this to create invoices with title, description, claimant name, type, and wallet ID. Throws an exception if the operation fails.")]
        public async Task<Claim> CreateInvoiceAsync(
            [Description("The title of the invoice (e.g., 'Medical Bill - Dr. Smith').")] string title,
            [Description("A detailed description of the invoice.")] string description,
            [Description("The name of the claimant or client.")] string claimantName,
            [Description("The type of invoice (e.g., 'Auto', 'Health', 'Property', 'General').")] string type,
            [Description("The wallet ID this invoice belongs to.")] string walletId,
            [Description("Optional date when the client was notified (YYYY-MM-DD format).")] string? dateNotified = null)
        {
            var request = new CreateClaimRequest
            {
                Title = title,
                Description = description,
                ClaimantName = claimantName,
                Type = type,
                WalletId = walletId,
                DateNotified = dateNotified
            };
            return await ExecuteAsync<Claim>(
                () => _httpClient.PostAsJsonAsync("/api/invoices", request, _jsonOptions),
                "CreateInvoice");
        }

        [Description("Retrieves all invoices for a specific wallet from the system. Throws an exception if the operation fails.")]
        public async Task<List<Claim>> GetInvoicesAsync(
            [Description("The wallet ID to retrieve invoices for.")] string walletId)
        {
            return await GetClaimsAsync(walletId);
        }

        [Description("Retrieves a specific invoice by its unique identifier. Throws an exception if the operation fails.")]
        public async Task<Claim> GetInvoiceByIdAsync(
            [Description("The unique identifier of the invoice to retrieve.")] string id,
            [Description("The wallet ID that owns this invoice.")] string walletId)
        {
            return await GetClaimByIdAsync(id, walletId);
        }

        [Description("Retrieves all contacts from the system. Contacts represent individuals or organizations associated with insurance claims. Throws an exception if the operation fails.")]
        public async Task<List<Contact>> GetContactsAsync()
        {
            return await ExecuteAsync<List<Contact>>(
                () => _httpClient.GetAsync("/api/contacts"),
                "GetContacts");
        }

        [Description("Retrieves a specific contact by its unique identifier. Returns contact details including creation and update timestamps. Throws an exception if the operation fails.")]
        public async Task<Contact> GetContactByIdAsync(
            [Description("The unique identifier of the contact to retrieve.")] string id)
        {
            return await ExecuteAsync<Contact>(
                () => _httpClient.GetAsync($"/api/contacts/{id}"),
                "GetContactById");
        }

        [Description("Creates a new contact in the system. Contacts can be policyholders, claimants, or other parties involved in insurance claims. Throws an exception if the operation fails.")]
        public async Task<Contact> CreateContactAsync(
            [Description("The contact creation request containing the details for the new contact.")] CreateContactRequest request)
        {
            return await ExecuteAsync<Contact>(
                () => _httpClient.PostAsJsonAsync("/api/contacts", request, _jsonOptions),
                "CreateContact");
        }

        [Description("Retrieves all payments from the system. Payments represent financial transactions associated with insurance claims. Throws an exception if the operation fails.")]
        public async Task<List<Payment>> GetPaymentsAsync()
        {
            return await ExecuteAsync<List<Payment>>(
                () => _httpClient.GetAsync("/api/payments"),
                "GetPayments");
        }

        [Description("Creates a new payment in the system. Payments are blockchain-based financial transactions that can be trigger-based (execute when price conditions are met) or instant. Throws an exception if the operation fails.")]
        public async Task<Payment> CreatePaymentAsync(
            [Description("The wallet address of the payment receiver (e.g., '0x...').")] string receiver,
            [Description("The USD amount to pay (e.g., 100.50 for $100.50).")] decimal usdAmount,
            [Description("The wallet ID of the payer creating this payment.")] string walletId,
            [Description("Optional description of the payment purpose.")] string? description = null,
            [Description("The price feed to use for crypto conversion (e.g., 'ETH/USD', 'BTC/USD', 'FLR/USD'). Defaults to 'ETH/USD'.")] string? cryptoFeedId = null,
            [Description("The payment type: 'trigger' for price-triggered payments or 'instant' for immediate execution. Defaults to 'instant'.")] string? paymentType = null,
            [Description("For trigger payments: the stop loss price in USD. Payment executes if price drops to this level.")] decimal? stopLossPrice = null,
            [Description("For trigger payments: the take profit price in USD. Payment executes if price reaches this level.")] decimal? takeProfitPrice = null,
            [Description("For trigger payments: number of days until the payment expires. Defaults to 30.")] int? expiryDays = null,
            [Description("Optional claim/invoice ID to associate this payment with.")] string? claimId = null)
        {
            var request = new CreatePaymentRequest
            {
                Receiver = receiver,
                UsdAmount = usdAmount,
                WalletId = walletId,
                Description = description,
                CryptoFeedId = cryptoFeedId ?? "ETH/USD",
                PaymentType = paymentType ?? "instant",
                StopLossPrice = stopLossPrice,
                TakeProfitPrice = takeProfitPrice,
                ExpiryDays = expiryDays ?? 30,
                ClaimId = claimId
            };
            return await ExecuteAsync<Payment>(
                () => _httpClient.PostAsJsonAsync("/api/payments", request, _jsonOptions),
                "CreatePayment");
        }

        [Description("Adds a pending payment to an invoice that requires user signing. This is the preferred method for agents to create payments - the payment will be added to the invoice with 'pending_signature' status, and the user must manually sign the transaction through the UI to execute it. This ensures user control over all blockchain transactions.")]
        public async Task<AddPaymentToInvoiceResponse> AddPaymentToInvoiceAsync(
            [Description("The invoice ID to add the payment to.")] string invoiceId,
            [Description("The USD amount to pay in cents (e.g., 10000 for $100.00).")] decimal usdAmount,
            [Description("The wallet ID of the payer (must match the invoice's wallet ID).")] string walletId,
            [Description("Description of the payment (e.g., 'Lab Work - Blood Test').")] string? description = null,
            [Description("The wallet address of the payment receiver. Defaults to a placeholder if not provided.")] string? receiver = null,
            [Description("The price feed to use (e.g., 'ETH/USD'). Defaults to 'ETH/USD'.")] string? cryptoFeedId = null,
            [Description("Number of days until the payment expires. Defaults to 30.")] int? expiryDays = null)
        {
            var request = new AddPaymentToInvoiceRequest
            {
                UsdAmount = usdAmount,
                WalletId = walletId,
                Description = description,
                Receiver = receiver,
                CryptoFeedId = cryptoFeedId ?? "ETH/USD",
                ExpiryDays = expiryDays ?? 30
            };
            return await ExecuteAsync<AddPaymentToInvoiceResponse>(
                () => _httpClient.PostAsJsonAsync($"/api/invoices/{Uri.EscapeDataString(invoiceId)}/payments", request, _jsonOptions),
                "AddPaymentToInvoice");
        }

        [Description("Checks if the Slapsure API is healthy and responsive. Returns true if the API is available, false otherwise.")]
        public async Task<bool> CheckHealthAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/health");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }

    [Description("Represents an insurance claim/invoice in the Slapsure system.")]
    public class Claim
    {
        [Description("The unique identifier for the claim/invoice.")]
        public string Id { get; set; } = string.Empty;

        [Description("The title or name of the claim/invoice.")]
        public string Title { get; set; } = string.Empty;

        [Description("A detailed description of the claim/invoice.")]
        public string Description { get; set; } = string.Empty;

        [Description("The name of the claimant or client associated with this claim.")]
        public string ClaimantName { get; set; } = string.Empty;

        [Description("The type of claim (e.g., 'Auto', 'Health', 'Property', 'General').")]
        public string Type { get; set; } = string.Empty;

        [Description("The wallet ID this invoice belongs to.")]
        public string WalletId { get; set; } = string.Empty;

        [Description("The current status of the claim (e.g., 'pending', 'approved', 'rejected', 'processing', 'settled').")]
        public string Status { get; set; } = string.Empty;

        [Description("The total cost amount of the claim in USD.")]
        public decimal TotalCost { get; set; }

        [Description("The list of payments associated with this claim.")]
        public List<Payment> Payments { get; set; } = new();

        [Description("The date when the claim was created, in YYYY-MM-DD format.")]
        public string DateCreated { get; set; } = string.Empty;

        [Description("The date when the client was notified about this invoice.")]
        public string? DateNotified { get; set; }

        [Description("The date when the invoice was settled.")]
        public string? DateSettled { get; set; }
    }

    [Description("Request object for creating a new insurance claim.")]
    public class CreateClaimRequest
    {
        [Description("The title or name of the claim/invoice.")]
        public string Title { get; set; } = string.Empty;

        [Description("A detailed description of the claim/invoice.")]
        public string Description { get; set; } = string.Empty;

        [Description("The name of the claimant or client associated with this claim.")]
        public string ClaimantName { get; set; } = string.Empty;

        [Description("The type of claim (e.g., 'Auto', 'Health', 'Property', 'General').")]
        public string Type { get; set; } = "General";

        [Description("The wallet ID this invoice belongs to.")]
        public string WalletId { get; set; } = string.Empty;

        [Description("Optional date when the client was notified about this invoice.")]
        public string? DateNotified { get; set; }
    }

    [Description("Represents a contact (individual or organization) in the Slapsure system. Contacts can be policyholders, claimants, or other parties involved in claims.")]
    public class Contact
    {
        [Description("The unique identifier for the contact.")]
        public string Id { get; set; } = string.Empty;

        [Description("The name of the contact (individual or organization).")]
        public string Name { get; set; } = string.Empty;

        [Description("The wallet address where payments should be sent for this contact.")]
        public string ReceiverAddress { get; set; } = string.Empty;

        [Description("The date and time when the contact was created, in ISO 8601 format.")]
        public string CreatedAt { get; set; } = string.Empty;

        [Description("The date and time when the contact was last updated, in ISO 8601 format.")]
        public string UpdatedAt { get; set; } = string.Empty;
    }

    [Description("Request object for creating a new contact.")]
    public class CreateContactRequest
    {
    }

    [Description("Represents a payment transaction in the Slapsure system. Payments are blockchain-based financial transactions.")]
    public class Payment
    {
        [Description("The unique identifier for the payment.")]
        public string Id { get; set; } = string.Empty;

        [Description("The wallet address of the payer.")]
        public string Payer { get; set; } = string.Empty;

        [Description("The wallet address of the payment receiver.")]
        public string Receiver { get; set; } = string.Empty;

        [Description("The USD amount of the payment.")]
        public decimal UsdAmount { get; set; }

        [Description("The price feed used for crypto conversion (e.g., 'ETH/USD').")]
        public string CryptoFeedId { get; set; } = string.Empty;

        [Description("The stop loss price in USD for trigger-based payments.")]
        public decimal StopLossPrice { get; set; }

        [Description("The take profit price in USD for trigger-based payments.")]
        public decimal TakeProfitPrice { get; set; }

        [Description("The collateral amount locked for the payment.")]
        public string CollateralAmount { get; set; } = string.Empty;

        [Description("Number of days until the payment expires.")]
        public int ExpiryDays { get; set; }

        [Description("The wallet ID of the payer.")]
        public string WalletId { get; set; } = string.Empty;

        [Description("The claim/invoice ID associated with this payment.")]
        public string ClaimId { get; set; } = string.Empty;

        [Description("The current status of the payment (e.g., 'pending', 'executed', 'expired').")]
        public string Status { get; set; } = string.Empty;

        [Description("Whether the payment has been executed.")]
        public bool Executed { get; set; }

        [Description("The timestamp when the payment was created.")]
        public string CreatedAt { get; set; } = string.Empty;

        [Description("The timestamp when the payment was executed (null if not executed).")]
        public string? ExecutedAt { get; set; }

        [Description("The crypto price at execution time (null if not executed).")]
        public decimal? ExecutedPrice { get; set; }

        [Description("The actual crypto amount paid to receiver (null if not executed).")]
        public string? PaidAmount { get; set; }

        [Description("Description of the payment purpose.")]
        public string Description { get; set; } = string.Empty;

        [Description("The payment type: 'trigger' or 'instant'.")]
        public string PaymentType { get; set; } = string.Empty;
    }

    [Description("Request object for creating a new payment.")]
    public class CreatePaymentRequest
    {
        [Description("The wallet address of the payment receiver.")]
        public string Receiver { get; set; } = string.Empty;

        [Description("The USD amount to pay.")]
        public decimal UsdAmount { get; set; }

        [Description("The wallet ID of the payer.")]
        public string WalletId { get; set; } = string.Empty;

        [Description("Description of the payment purpose.")]
        public string? Description { get; set; }

        [Description("The price feed to use for crypto conversion.")]
        public string CryptoFeedId { get; set; } = "ETH/USD";

        [Description("The payment type: 'trigger' or 'instant'.")]
        public string PaymentType { get; set; } = "instant";

        [Description("The stop loss price in USD for trigger-based payments.")]
        public decimal? StopLossPrice { get; set; }

        [Description("The take profit price in USD for trigger-based payments.")]
        public decimal? TakeProfitPrice { get; set; }

        [Description("Number of days until the payment expires.")]
        public int ExpiryDays { get; set; } = 30;

        [Description("The claim/invoice ID to associate this payment with.")]
        public string? ClaimId { get; set; }
    }

    [Description("Request object for adding a pending payment to an invoice.")]
    public class AddPaymentToInvoiceRequest
    {
        [Description("The USD amount to pay in cents (e.g., 10000 for $100.00).")]
        public decimal UsdAmount { get; set; }

        [Description("The wallet ID of the payer (must match the invoice's wallet ID).")]
        public string WalletId { get; set; } = string.Empty;

        [Description("Description of the payment purpose.")]
        public string? Description { get; set; }

        [Description("The wallet address of the payment receiver.")]
        public string? Receiver { get; set; }

        [Description("The price feed to use for crypto conversion.")]
        public string CryptoFeedId { get; set; } = "ETH/USD";

        [Description("Number of days until the payment expires.")]
        public int ExpiryDays { get; set; } = 30;
    }

    [Description("Response object when adding a payment to an invoice.")]
    public class AddPaymentToInvoiceResponse
    {
        [Description("Whether the operation was successful.")]
        public bool Success { get; set; }

        [Description("The created payment details.")]
        public Payment? Payment { get; set; }

        [Description("The invoice ID the payment was added to.")]
        public string InvoiceId { get; set; } = string.Empty;

        [Description("A message describing the result.")]
        public string Message { get; set; } = string.Empty;
    }
}
