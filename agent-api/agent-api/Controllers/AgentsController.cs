using agent_api.Agents;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace agent_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AgentsController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly Agents.Agents _agents;
        private readonly ToolsFactory _toolsFactory;
        private readonly SlapsureClient _slapsureClient;

        public AgentsController(IConfiguration config, Agents.Agents agents, ToolsFactory toolsFactory, SlapsureClient slapsureClient)
        {
            _config = config;
            _agents = agents;
            _toolsFactory = toolsFactory;
            _slapsureClient = slapsureClient;
        }

        [HttpPost("workflows/invoice/run")]
        [Consumes("multipart/form-data")]
        public async Task RunInvoiceWorkflow(IFormFile file, [FromForm] string? walletId)
        {
            if (file == null || file.Length == 0)
            {
                Response.StatusCode = 400;
                await Response.WriteAsJsonAsync(new { error = "No file uploaded" });
                return;
            }

            if (string.IsNullOrEmpty(walletId))
            {
                Response.StatusCode = 400;
                await Response.WriteAsJsonAsync(new { error = "No wallet ID provided. Please connect your wallet." });
                return;
            }

            var allowedTypes = new[] { "application/pdf", "image/png", "image/jpeg", "image/jpg" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                Response.StatusCode = 400;
                await Response.WriteAsJsonAsync(new { error = "Invalid file type. Only PDF, PNG, and JPG are allowed." });
                return;
            }

            // Set up SSE headers
            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers.Append("X-Accel-Buffering", "no"); // Disable nginx buffering

            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();
                var base64Content = Convert.ToBase64String(fileBytes);

                var orchestrator = new AgentOrchestrator(_config, _agents, _toolsFactory, _slapsureClient);
                var fullResponse = new StringBuilder();

                var workflowInstructions = $"""
                    Process this invoice document. The file is named '{file.FileName}' and is a {file.ContentType}.
                    
                    IMPORTANT: The user's wallet ID is '{walletId}'. This invoice MUST be created under this wallet ID.

                    You MUST complete the following workflow in order:

                    ### Step 1: Document Analysis (handoff to documentanalysis)
                    - Analyze the uploaded invoice document
                    - Extract ALL data from the invoice including:
                      * Invoice title/description
                      * Claimant/customer name
                      * Invoice type (Auto, Health, Property, or General)
                      * ALL line items with their descriptions and amounts
                      * Total amount
                      * Any dates (invoice date, due date, notification date)
                    - IMPORTANT: Use the provided wallet ID '{walletId}' - do NOT extract wallet ID from the document
                    - Present the extracted data clearly before proceeding

                    ### Step 2: Create Invoice in Cosmos DB (handoff to invoicemanager)
                    - Using the extracted data from Step 1, create a new invoice record in Cosmos DB
                    - CRITICAL: Use wallet ID '{walletId}' for the invoice (this is the signed-in user's wallet)
                    - Required fields: wallet ID, title, description, claimant name, type
                    - Confirm the invoice was created successfully and note the new invoice ID

                    ### Step 3: Find or Create Contact (handoff to contactmanager)
                    - Search for an existing contact using the wallet ID '{walletId}'
                    - If a contact with that wallet ID EXISTS: Note the contact details and proceed to Step 4
                    - If NO contact exists with that wallet ID: Create a new contact with:
                      * Name: The claimant/customer name from the invoice
                      * Wallet ID: '{walletId}'
                    - Confirm the contact exists (found or created) before proceeding

                    ### Step 4: Create Payments for Line Items (handoff to paymentcreator)
                    - For EACH line item on the invoice, create a separate payment record
                    - Each payment should include:
                      * The line item description
                      * The line item amount
                      * Reference to the invoice ID created in Step 2
                      * Wallet ID: '{walletId}'
                    - Create ALL payments for ALL line items - do not skip any
                    - Confirm each payment was created successfully

                    ### Workflow Completion
                    - After completing all 4 steps, provide a summary including:
                      * Invoice ID created
                      * Wallet ID used: '{walletId}'
                      * Contact found or created (with ID)
                      * Number of payments created and their total amount
                      * Any issues or notes from the process

                    IMPORTANT: You MUST complete ALL steps of this workflow. Do not stop after document analysis - continue through invoice creation, contact management, and payment creation for all line items.
                    """;

                var hasError = false;
                var errorMessages = new List<string>();

                await orchestrator.RunStreamingAsync(
                    input: workflowInstructions,
                    documentBase64: base64Content,
                    documentMediaType: file.ContentType,
                    userWalletId: walletId,
                    onTextUpdate: async (text, isThinking) =>
                    {
                        if (!isThinking && !string.IsNullOrEmpty(text))
                        {
                            fullResponse.Append(text);

                            // Send SSE event
                            var eventData = JsonSerializer.Serialize(new { type = "text", content = text });
                            await Response.WriteAsync($"data: {eventData}\n\n");
                            await Response.Body.FlushAsync();
                        }
                    },
                    onError: async (errorMessage, exception) =>
                    {
                        hasError = true;
                        errorMessages.Add(errorMessage);

                        // Send error event to client
                        var errorData = JsonSerializer.Serialize(new
                        {
                            type = "workflow_error",
                            error = errorMessage,
                            details = exception?.ToString()
                        });
                        await Response.WriteAsync($"data: {errorData}\n\n");
                        await Response.Body.FlushAsync();
                    });

                // Send completion event with full response
                var completeData = JsonSerializer.Serialize(new
                {
                    type = "complete",
                    success = !hasError,
                    response = fullResponse.ToString(),
                    fileName = file.FileName,
                    errors = hasError ? errorMessages : null
                });
                await Response.WriteAsync($"data: {completeData}\n\n");
                await Response.Body.FlushAsync();
            }
            catch (Exception ex)
            {
                // Send error event
                var errorData = JsonSerializer.Serialize(new
                {
                    type = "error",
                    error = "Failed to process invoice",
                    details = ex.Message
                });
                await Response.WriteAsync($"data: {errorData}\n\n");
                await Response.Body.FlushAsync();
            }
        }
    }
}