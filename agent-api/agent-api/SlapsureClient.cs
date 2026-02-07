using System.ComponentModel;
using System.Net.Http.Json;

namespace agent_api
{
    [Description("Client for interacting with the Slapsure insurance claims management API. Provides methods for managing claims, contacts, and payments.")]
    public class SlapsureClient
    {
        private readonly HttpClient _httpClient;

        public SlapsureClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        [Description("Retrieves all insurance claims from the system. Returns a list of all claims with their status, total cost, payments, and creation date.")]
        public async Task<List<Claim>> GetClaimsAsync()
        {
            var response = await _httpClient.GetAsync("/api/invoices");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<Claim>>() ?? new List<Claim>();
        }

        [Description("Retrieves a specific insurance claim by its unique identifier. Returns the claim details including status, total cost, and associated payments.")]
        public async Task<Claim?> GetClaimByIdAsync(
            [Description("The unique identifier of the claim to retrieve.")] string id)
        {
            var response = await _httpClient.GetAsync($"/api/invoices/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Claim>();
        }

        [Description("Creates a new insurance claim in the system. Returns the newly created claim with its assigned ID and initial status.")]
        public async Task<Claim?> CreateClaimAsync(
            [Description("The claim creation request containing the details for the new claim.")] CreateClaimRequest request)
        {
            var response = await _httpClient.PostAsJsonAsync("/api/invoices", request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Claim>();
        }

        [Description("Retrieves all contacts from the system. Contacts represent individuals or organizations associated with insurance claims, such as policyholders or claimants.")]
        public async Task<List<Contact>> GetContactsAsync()
        {
            var response = await _httpClient.GetAsync("/api/contacts");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<Contact>>() ?? new List<Contact>();
        }

        [Description("Retrieves a specific contact by its unique identifier. Returns contact details including creation and update timestamps.")]
        public async Task<Contact?> GetContactByIdAsync(
            [Description("The unique identifier of the contact to retrieve.")] string id)
        {
            var response = await _httpClient.GetAsync($"/api/contacts/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Contact>();
        }

        [Description("Creates a new contact in the system. Contacts can be policyholders, claimants, or other parties involved in insurance claims.")]
        public async Task<Contact?> CreateContactAsync(
            [Description("The contact creation request containing the details for the new contact.")] CreateContactRequest request)
        {
            var response = await _httpClient.PostAsJsonAsync("/api/contacts", request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Contact>();
        }

        [Description("Retrieves all payments from the system. Payments represent financial transactions associated with insurance claims.")]
        public async Task<List<Payment>> GetPaymentsAsync()
        {
            var response = await _httpClient.GetAsync("/api/payments");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<Payment>>() ?? new List<Payment>();
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

    [Description("Represents an insurance claim in the Slapsure system.")]
    public class Claim
    {
        [Description("The unique identifier for the claim.")]
        public string Id { get; set; } = string.Empty;

        [Description("The current status of the claim (e.g., 'Pending', 'Approved', 'Denied', 'Paid').")]
        public string Status { get; set; } = string.Empty;

        [Description("The total cost amount of the claim in the system's default currency.")]
        public decimal TotalCost { get; set; }

        [Description("The list of payments associated with this claim.")]
        public List<Payment> Payments { get; set; } = new();

        [Description("The date and time when the claim was created, in ISO 8601 format.")]
        public string DateCreated { get; set; } = string.Empty;
    }

    [Description("Request object for creating a new insurance claim.")]
    public class CreateClaimRequest
    {
    }

    [Description("Represents a contact (individual or organization) in the Slapsure system. Contacts can be policyholders, claimants, or other parties involved in claims.")]
    public class Contact
    {
        [Description("The unique identifier for the contact.")]
        public string Id { get; set; } = string.Empty;

        [Description("The date and time when the contact was created, in ISO 8601 format.")]
        public string CreatedAt { get; set; } = string.Empty;

        [Description("The date and time when the contact was last updated, in ISO 8601 format.")]
        public string UpdatedAt { get; set; } = string.Empty;
    }

    [Description("Request object for creating a new contact.")]
    public class CreateContactRequest
    {
    }

    [Description("Represents a payment transaction in the Slapsure system. Payments are financial transactions associated with claims.")]
    public class Payment
    {
        [Description("The unique identifier for the payment.")]
        public string Id { get; set; } = string.Empty;
    }
}
