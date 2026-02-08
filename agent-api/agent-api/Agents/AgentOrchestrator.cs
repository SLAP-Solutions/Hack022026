using System.Text.Json;
using Anthropic;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Workflows;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;

namespace agent_api.Agents
{
    /// <summary>
    /// Shared state passed between workflow steps to maintain context
    /// </summary>
    public class InvoiceWorkflowState
    {
        public string? ExtractedData { get; set; }
        public string? InvoiceId { get; set; }
        public string? WalletId { get; set; }
        public string? ContactId { get; set; }
        public List<string> PaymentIds { get; set; } = new();
        public List<string> Errors { get; set; } = new();
        public int CurrentStep { get; set; } = 1;
    }

    /// <summary>
    /// Parsed invoice data extracted from document analysis
    /// </summary>
    public class ParsedInvoiceData
    {
        public string Title { get; set; } = string.Empty;
        public string ClaimantName { get; set; } = string.Empty;
        public string Type { get; set; } = "General";
        public string WalletId { get; set; } = "default-wallet";
        public string Description { get; set; } = string.Empty;
        public List<LineItem> LineItems { get; set; } = new();
        public decimal Total { get; set; }
    }

    public class LineItem
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class AgentOrchestrator
    {
        private readonly IConfiguration _config;
        private readonly List<ChatMessage> _messages = [];
        private readonly Agents _agents;
        private readonly ToolsFactory _toolsFactory;
        private readonly SlapsureClient _slapsureClient;
        private readonly ILogger<AgentOrchestrator>? _logger;

        public AgentOrchestrator(IConfiguration config, Agents agents, ToolsFactory toolsFactory, SlapsureClient slapsureClient, ILogger<AgentOrchestrator>? logger = null)
        {
            _config = config;
            _agents = agents;
            _toolsFactory = toolsFactory;
            _slapsureClient = slapsureClient;
            _logger = logger;
        }

        /// <summary>
        /// Runs a deterministic 4-step sequential workflow for invoice processing:
        /// Step 1: Document Analysis → Step 2: Invoice Creation → Step 3: Contact Management → Step 4: Payment Creation
        /// </summary>
        public async Task RunStreamingAsync(
            string? input = null, 
            string? documentBase64 = null, 
            string? documentMediaType = null,
            string? userWalletId = null,
            Func<string, bool, Task>? onTextUpdate = null,
            Func<string, Exception?, Task>? onError = null)
        {
            try
            {
                // Build message content
                var messageContents = new List<AIContent>();
                
                // Add document if provided
                if (!string.IsNullOrEmpty(documentBase64) && !string.IsNullOrEmpty(documentMediaType))
                {
                    var imageBytes = Convert.FromBase64String(documentBase64);
                    messageContents.Add(new DataContent(imageBytes, documentMediaType));
                }
                
                // Add text input
                if (!string.IsNullOrEmpty(input))
                {
                    messageContents.Add(new TextContent(input));
                }
                
                _messages.Add(new ChatMessage(ChatRole.User, messageContents));

                // Determine if this is a document processing request that needs the full workflow
                var hasDocument = !string.IsNullOrEmpty(documentBase64);
                
                if (hasDocument)
                {
                    // Run the deterministic 4-step sequential workflow
                    await RunSequentialInvoiceWorkflowAsync(userWalletId, onTextUpdate, onError);
                }
                else
                {
                    // For non-document requests, use the handoff-based workflow
                    await RunHandoffWorkflowAsync(onTextUpdate, onError);
                }
            }
            catch (Exception ex) when (onError != null)
            {
                _logger?.LogError(ex, "Unhandled exception in RunStreamingAsync");
                await onError($"Unhandled error: {ex.Message}", ex);
                throw;
            }
        }

        /// <summary>
        /// Runs a deterministic sequential workflow where each step MUST complete before the next begins.
        /// This ensures all 4 steps execute in order regardless of agent behavior.
        /// </summary>
        private async Task RunSequentialInvoiceWorkflowAsync(
            string? userWalletId = null,
            Func<string, bool, Task>? onTextUpdate = null,
            Func<string, Exception?, Task>? onError = null)
        {
            var state = new InvoiceWorkflowState();
            // Use the provided user wallet ID if available
            if (!string.IsNullOrEmpty(userWalletId))
            {
                state.WalletId = userWalletId;
            }
            var client = CreateChatClient();
            
            // Step 1: Document Analysis
            _logger?.LogInformation("Starting Step 1: Document Analysis");
            if (onTextUpdate != null)
            {
                await onTextUpdate("\n\n## Step 1/4: Document Analysis\n\n", false);
            }
            
            var (step1Result, step1Success, step1Error) = await RunWorkflowStepAsync(
                client,
                "documentanalysis",
                _messages,
                """
                Analyze the uploaded document and extract data for invoice creation.
                
                You MUST output a JSON object with these exact fields:
                
                ```json
                {
                    "title": "A descriptive title (e.g., 'Medical Bill - City Hospital')",
                    "claimantName": "The customer/client name from the document",
                    "type": "Health or Auto or Property or General",
                    "walletId": "Extract from document or use 'default-wallet'",
                    "description": "Summary of line items and total",
                    "lineItems": [
                        {"description": "Item 1", "amount": 100.00},
                        {"description": "Item 2", "amount": 50.00}
                    ],
                    "total": 150.00
                }
                ```
                
                Type selection:
                - "Health" = medical bills, healthcare, hospital
                - "Auto" = vehicle repairs, car insurance
                - "Property" = home repairs, property damage
                - "General" = everything else
                
                IMPORTANT: Output ONLY the JSON object. No other text before or after.
                """,
                onTextUpdate,
                onError);
            
            if (!step1Success || string.IsNullOrEmpty(step1Result))
            {
                var errorMsg = step1Error ?? "No data extracted from document";
                state.Errors.Add($"Step 1 failed: {errorMsg}");
                if (onTextUpdate != null) await onTextUpdate($"\n\n**WORKFLOW STOPPED**: Step 1 failed - {errorMsg}\n\n", false);
                if (onError != null) await onError($"Document analysis failed - {errorMsg}", null);
                return;
            }
            state.ExtractedData = step1Result;
            state.CurrentStep = 2;
            
            // Step 2: Invoice Creation - Direct API call
            _logger?.LogInformation("Starting Step 2: Invoice Creation (Direct API Call)");
            if (onTextUpdate != null)
            {
                await onTextUpdate("\n\n## Step 2/4: Creating Invoice in Database\n\n", false);
            }
            
            // Parse the extracted JSON data
            var invoiceData = ParseExtractedInvoiceData(state.ExtractedData);
            if (invoiceData == null)
            {
                var errorMsg = "Could not parse extracted data into invoice format";
                state.Errors.Add($"Step 2 failed: {errorMsg}");
                if (onTextUpdate != null) await onTextUpdate($"\n\n**WORKFLOW STOPPED**: Step 2 failed - {errorMsg}\n\n", false);
                if (onError != null) await onError($"Invoice creation failed - {errorMsg}", null);
                return;
            }
            
            // CRITICAL: Always use the user's wallet ID from state - never use extracted wallet ID from document
            // The user's wallet ID was set at the start of the workflow from the authenticated user
            var walletIdToUse = state.WalletId;
            if (string.IsNullOrEmpty(walletIdToUse))
            {
                var errorMsg = "No wallet ID provided. User must be authenticated with a connected wallet.";
                state.Errors.Add($"Step 2 failed: {errorMsg}");
                if (onTextUpdate != null) await onTextUpdate($"\n\n**WORKFLOW STOPPED**: Step 2 failed - {errorMsg}\n\n", false);
                if (onError != null) await onError($"Invoice creation failed - {errorMsg}", null);
                return;
            }
            
            _logger?.LogInformation("Creating invoice with user's wallet ID: {WalletId} (extracted from document was: {ExtractedWalletId})", 
                walletIdToUse, invoiceData.WalletId);
            _logger?.LogInformation("Parsed invoice data: Title={Title}, Claimant={Claimant}, Type={Type}", 
                invoiceData.Title, invoiceData.ClaimantName, invoiceData.Type);
            
            if (onTextUpdate != null)
            {
                await onTextUpdate($"Creating invoice: **{invoiceData.Title}** for {invoiceData.ClaimantName} (Wallet: {walletIdToUse})...\n", false);
            }
            
            // Directly call the SlapsureClient to create the invoice
            Claim? createdInvoice = null;
            try
            {
                createdInvoice = await _slapsureClient.CreateInvoiceAsync(
                    title: invoiceData.Title,
                    description: invoiceData.Description,
                    claimantName: invoiceData.ClaimantName,
                    type: invoiceData.Type,
                    walletId: walletIdToUse);
                
                state.InvoiceId = createdInvoice.Id;
                state.WalletId = createdInvoice.WalletId;
                
                _logger?.LogInformation("Invoice created successfully with ID: {InvoiceId}", createdInvoice.Id);
                if (onTextUpdate != null)
                {
                    await onTextUpdate($"\n**Invoice created successfully!**\n- Invoice ID: `{createdInvoice.Id}`\n- Status: {createdInvoice.Status}\n", false);
                }
            }
            catch (Exception ex)
            {
                var errorMsg = $"Failed to create invoice: {ex.Message}";
                _logger?.LogError(ex, "Failed to create invoice");
                state.Errors.Add($"Step 2 failed: {errorMsg}");
                if (onTextUpdate != null) await onTextUpdate($"\n\n**WORKFLOW STOPPED**: {errorMsg}\n\n", false);
                if (onError != null) await onError(errorMsg, ex);
                return;
            }
            
            state.CurrentStep = 3;
            
            if (string.IsNullOrEmpty(state.InvoiceId))
            {
                _logger?.LogWarning("Could not extract invoice ID from step 2 result, continuing anyway");
            }
            
            // Step 3: Contact Management
            _logger?.LogInformation("Starting Step 3: Contact Management");
            if (onTextUpdate != null)
            {
                await onTextUpdate("\n\n## Step 3/4: Managing Contacts\n\n", false);
            }
            
            var contactDefinition = _agents.GetByName("contactmanager");
            var (step3Result, step3Success, step3Error) = await RunWorkflowStepAsync(
                client,
                "contactmanager",
                CreateStepMessages(state.ExtractedData, $"""
                    Using the extracted document data, check if the client/vendor contacts exist and create them if needed.
                    
                    Invoice ID: {state.InvoiceId ?? "unknown"}
                    
                    1. First, call GetContactsAsync to see existing contacts
                    2. Check if the client from the document already exists
                    3. If not, create a new contact using CreateContactAsync
                    4. Report the contact ID(s) created or found
                    """),
                null,
                onTextUpdate,
                onError,
                contactDefinition?.GetTools(_toolsFactory));
            
            if (!step3Success)
            {
                var errorMsg = step3Error ?? "Contact management failed";
                state.Errors.Add($"Step 3 failed: {errorMsg}");
                if (onTextUpdate != null) await onTextUpdate($"\n\n**WORKFLOW STOPPED**: Step 3 failed - {errorMsg}\n\n", false);
                if (onError != null) await onError($"Contact management failed - {errorMsg}", null);
                return;
            }
            
            state.ContactId = ExtractIdFromResult(step3Result, "contact");
            state.CurrentStep = 4;
            
            // Step 4: Payment Creation - Direct API call to add payments to invoice
            _logger?.LogInformation("Starting Step 4: Payment Creation (Direct API Call)");
            if (onTextUpdate != null)
            {
                await onTextUpdate("\n\n## Step 4/4: Adding Payments to Invoice\n\n", false);
            }
            
            // First, we need to find the receiver wallet address from the invoice data
            // The receiver should come from the contact associated with the claimant
            string? receiverAddress = null;
            
            // Try to find the receiver address from the contacts
            try
            {
                if (onTextUpdate != null)
                {
                    await onTextUpdate($"Looking up receiver wallet address for: **{invoiceData.ClaimantName}**...\n", false);
                }
                
                var contacts = await _slapsureClient.GetContactsAsync();
                var matchingContact = contacts.FirstOrDefault(c => 
                    c.Name?.Equals(invoiceData.ClaimantName, StringComparison.OrdinalIgnoreCase) == true ||
                    c.Name?.Contains(invoiceData.ClaimantName, StringComparison.OrdinalIgnoreCase) == true);
                
                if (matchingContact != null && !string.IsNullOrEmpty(matchingContact.ReceiverAddress))
                {
                    receiverAddress = matchingContact.ReceiverAddress;
                    _logger?.LogInformation("Found receiver address {ReceiverAddress} for contact {ContactName}", 
                        receiverAddress, matchingContact.Name);
                    if (onTextUpdate != null)
                    {
                        await onTextUpdate($"  ✓ Found receiver: `{receiverAddress}` (Contact: {matchingContact.Name})\n", false);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Failed to look up contacts for receiver address");
            }
            
            // If no receiver address found, we cannot create payments - end the workflow
            if (string.IsNullOrEmpty(receiverAddress))
            {
                var errorMsg = $"Cannot create payments: No receiver wallet address found for claimant '{invoiceData.ClaimantName}'. Please add a contact with a receiver address for this claimant first.";
                _logger?.LogError("No receiver address found for claimant: {ClaimantName}", invoiceData.ClaimantName);
                state.Errors.Add($"Step 4 failed: {errorMsg}");
                if (onTextUpdate != null) 
                {
                    await onTextUpdate($"\n\n**WORKFLOW STOPPED**: {errorMsg}\n\n", false);
                    await onTextUpdate($"""
                        
                        **To resolve this issue:**
                        1. Go to the Contacts page
                        2. Add a new contact for "{invoiceData.ClaimantName}"
                        3. Include their wallet receiver address
                        4. Then try processing this invoice again
                        
                        The invoice has been created (ID: `{state.InvoiceId}`), but payments could not be added without a valid receiver address.
                        """, false);
                }
                if (onError != null) await onError(errorMsg, null);
                return;
            }
            
            // Create payments directly using the AddPaymentToInvoiceAsync method
            // This adds payments with "pending_signature" status that require user signing
            var paymentsCreated = 0;
            var paymentErrors = new List<string>();
            
            if (invoiceData.LineItems?.Any() == true)
            {
                foreach (var lineItem in invoiceData.LineItems)
                {
                    try
                    {
                        if (onTextUpdate != null)
                        {
                            await onTextUpdate($"Adding payment for: {lineItem.Description} (${lineItem.Amount:F2})...\n", false);
                        }
                        
                        // Convert amount to cents for the API
                        var amountInCents = lineItem.Amount * 100;
                        
                        var paymentResult = await _slapsureClient.AddPaymentToInvoiceAsync(
                            invoiceId: state.InvoiceId!,
                            usdAmount: amountInCents,
                            walletId: state.WalletId!,
                            description: lineItem.Description,
                            receiver: receiverAddress,
                            cryptoFeedId: "ETH/USD",
                            expiryDays: 30);
                        
                        if (paymentResult.Success)
                        {
                            paymentsCreated++;
                            state.PaymentIds.Add(paymentResult.Payment?.Id ?? "unknown");
                            _logger?.LogInformation("Payment added: {PaymentId} for {Description}", 
                                paymentResult.Payment?.Id, lineItem.Description);
                            
                            if (onTextUpdate != null)
                            {
                                await onTextUpdate($"  ✓ Payment added (ID: `{paymentResult.Payment?.Id}`) - **Requires user signing**\n", false);
                            }
                        }
                        else
                        {
                            paymentErrors.Add($"Failed to add payment for {lineItem.Description}: {paymentResult.Message}");
                        }
                    }
                    catch (Exception ex)
                    {
                        var errorMsg = $"Failed to add payment for {lineItem.Description}: {ex.Message}";
                        _logger?.LogError(ex, "Failed to add payment for line item: {Description}", lineItem.Description);
                        paymentErrors.Add(errorMsg);
                    }
                }
            }
            else
            {
                // No line items - create a single payment for the total
                try
                {
                    if (onTextUpdate != null)
                    {
                        await onTextUpdate($"Adding payment for total: ${invoiceData.Total:F2}...\n", false);
                    }
                    
                    var amountInCents = invoiceData.Total * 100;
                    
                    var paymentResult = await _slapsureClient.AddPaymentToInvoiceAsync(
                        invoiceId: state.InvoiceId!,
                        usdAmount: amountInCents,
                        walletId: state.WalletId!,
                        description: $"Total for {invoiceData.Title}",
                        receiver: receiverAddress,
                        cryptoFeedId: "ETH/USD",
                        expiryDays: 30);
                    
                    if (paymentResult.Success)
                    {
                        paymentsCreated++;
                        state.PaymentIds.Add(paymentResult.Payment?.Id ?? "unknown");
                        
                        if (onTextUpdate != null)
                        {
                            await onTextUpdate($"  ✓ Payment added (ID: `{paymentResult.Payment?.Id}`) - **Requires user signing**\n", false);
                        }
                    }
                }
                catch (Exception ex)
                {
                    paymentErrors.Add($"Failed to add total payment: {ex.Message}");
                    _logger?.LogError(ex, "Failed to add total payment");
                }
            }
            
            // Check if we created any payments
            var step4Success = paymentsCreated > 0;
            if (!step4Success && paymentErrors.Any())
            {
                var errorMsg = string.Join("; ", paymentErrors);
                state.Errors.Add($"Step 4 failed: {errorMsg}");
                if (onTextUpdate != null) await onTextUpdate($"\n\n**WORKFLOW STOPPED**: Step 4 failed - {errorMsg}\n\n", false);
                if (onError != null) await onError($"Payment creation failed - {errorMsg}", null);
                return;
            }
            
            if (paymentErrors.Any())
            {
                state.Errors.AddRange(paymentErrors);
            }
            
            // Final Summary
            _logger?.LogInformation("Workflow completed - generating summary");
            if (onTextUpdate != null)
            {
                var paymentSummary = paymentsCreated > 0 
                    ? $"- **{paymentsCreated} payment(s) added** - awaiting your signature in the invoice details page"
                    : "- No payments created";
                    
                await onTextUpdate($"""
                    
                    
                    ## Workflow Complete
                    
                    **Summary:**
                    - Document analyzed and data extracted
                    - Invoice created: `{state.InvoiceId ?? "See above"}`
                    - Contacts processed
                    {paymentSummary}
                    
                    **Next Steps:**
                    1. Go to the invoice details page
                    2. Review the pending payments
                    3. Sign each payment transaction to execute them
                    
                    {(state.Errors.Any() ? $"**Warnings/Errors:**\n{string.Join("\n", state.Errors.Select(e => $"- {e}"))}" : "")}
                    """, false);
            }
        }

        /// <summary>
        /// Runs a single workflow step with a specific agent
        /// </summary>
        private async Task<(string result, bool success, string? errorMessage)> RunWorkflowStepAsync(
            IChatClient client,
            string agentName,
            List<ChatMessage> messages,
            string? additionalInstructions,
            Func<string, bool, Task>? onTextUpdate,
            Func<string, Exception?, Task>? onError,
            IEnumerable<AITool>? tools = null)
        {
            var agentDef = _agents.GetByName(agentName);
            if (agentDef == null)
            {
                _logger?.LogError("Agent {AgentName} not found", agentName);
                return ("", false, $"Agent '{agentName}' not found");
            }

            var instructions = agentDef.Instructions;
            if (!string.IsNullOrEmpty(additionalInstructions))
            {
                instructions += $"\n\nCURRENT TASK:\n{additionalInstructions}";
            }

            var actualTools = tools?.ToList() ?? agentDef.GetTools(_toolsFactory);
            _logger?.LogInformation("RunWorkflowStepAsync for {AgentName}: Using {ToolCount} tools", agentName, actualTools?.Count ?? 0);
            if (actualTools != null)
            {
                foreach (var tool in actualTools)
                {
                    if (tool is AIFunction func)
                    {
                        _logger?.LogInformation("  Tool: {ToolName} - {Description}", func.Name, func.Description?.Substring(0, Math.Min(50, func.Description?.Length ?? 0)));
                    }
                }
            }
            
            var agent = new ChatClientAgent(
                client,
                instructions: instructions,
                name: agentName,
                description: agentDef.Description,
                tools: actualTools);

            // Build a simple single-agent workflow
            var workflow = new WorkflowBuilder(agent)
                .WithOutputFrom(agent)
                .Build();

            var resultBuilder = new System.Text.StringBuilder();
            string? toolError = null;
            
            try
            {
                await using var run = await InProcessExecution.StreamAsync(workflow, messages);
                await run.TrySendMessageAsync(new TurnToken(emitEvents: true));

                var maxIterations = 50;
                var iterations = 0;

                await foreach (var evt in run.WatchStreamAsync())
                {
                    iterations++;
                    
                    if (evt is AgentResponseUpdateEvent e)
                    {
                        foreach (var content in e.Update.Contents)
                        {
                            if (content is FunctionResultContent functionResult && functionResult.Exception != null)
                            {
                                toolError = functionResult.Exception.Message;
                                var errorMsg = $"\n\n**TOOL CALL FAILED**: {toolError}\n\n";
                                _logger?.LogError(functionResult.Exception, "Tool call failed in {AgentName}: {Error}", agentName, toolError);
                                if (onTextUpdate != null) await onTextUpdate(errorMsg, false);
                                if (onError != null) await onError($"Tool call failed in {agentName}: {toolError}", functionResult.Exception);
                                
                                // Return immediately on tool failure
                                return (resultBuilder.ToString(), false, toolError);
                            }
                            else if (content is FunctionCallContent functionCall)
                            {
                                _logger?.LogInformation("[{AgentName}] Tool call: {FunctionName}", agentName, functionCall.Name);
                                if (onTextUpdate != null) await onTextUpdate($"\n*Calling {functionCall.Name}...*\n", false);
                            }
                        }
                        
                        var text = e.Data?.ToString() ?? "";
                        resultBuilder.Append(text);
                        if (onTextUpdate != null) await onTextUpdate(text, false);
                    }
                    else if (evt is WorkflowOutputEvent)
                    {
                        _logger?.LogInformation("Step {AgentName} completed", agentName);
                        break;
                    }

                    if (iterations >= maxIterations)
                    {
                        _logger?.LogWarning("Step {AgentName} reached max iterations", agentName);
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error in workflow step {AgentName}", agentName);
                if (onError != null) await onError($"Step {agentName} failed: {ex.Message}", ex);
                return (resultBuilder.ToString(), false, ex.Message);
            }

            return (resultBuilder.ToString(), true, null);
        }

        /// <summary>
        /// Creates messages for a workflow step, including context from previous steps
        /// </summary>
        private List<ChatMessage> CreateStepMessages(string previousContext, string currentTask)
        {
            return new List<ChatMessage>
            {
                new ChatMessage(ChatRole.User, $"""
                    Previous step extracted the following data:
                    
                    {previousContext}
                    
                    ---
                    
                    {currentTask}
                    """)
            };
        }

        /// <summary>
        /// Extracts an ID from agent response text
        /// </summary>
        private string? ExtractIdFromResult(string result, string idType)
        {
            // Look for common patterns like "ID: xxx", "invoice ID: xxx", "created with ID xxx"
            var patterns = new[]
            {
                $@"{idType}\s*[Ii][Dd][\s:]+([a-zA-Z0-9\-_]+)",
                $@"[Ii][Dd][\s:]+([a-zA-Z0-9\-_]+)",
                @"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})" // UUID pattern
            };

            foreach (var pattern in patterns)
            {
                var match = System.Text.RegularExpressions.Regex.Match(result, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success && match.Groups.Count > 1)
                {
                    return match.Groups[1].Value;
                }
            }
            return null;
        }

        /// <summary>
        /// Extracts wallet ID from agent response
        /// </summary>
        private string? ExtractWalletIdFromResult(string result)
        {
            var match = System.Text.RegularExpressions.Regex.Match(result, @"[Ww]allet\s*[Ii][Dd][\s:]+([a-zA-Z0-9\-_]+)");
            return match.Success ? match.Groups[1].Value : null;
        }

        /// <summary>
        /// Parses extracted document data into a structured invoice format
        /// </summary>
        private ParsedInvoiceData? ParseExtractedInvoiceData(string? extractedData)
        {
            if (string.IsNullOrEmpty(extractedData))
                return null;

            try
            {
                // Try to find JSON in the response (it might be wrapped in markdown code blocks)
                var jsonMatch = System.Text.RegularExpressions.Regex.Match(
                    extractedData, 
                    @"```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*\})",
                    System.Text.RegularExpressions.RegexOptions.Singleline);

                string jsonStr;
                if (jsonMatch.Success)
                {
                    jsonStr = jsonMatch.Groups[1].Success ? jsonMatch.Groups[1].Value : jsonMatch.Groups[2].Value;
                }
                else
                {
                    // Try to parse the whole thing as JSON
                    jsonStr = extractedData;
                }

                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                
                var parsed = System.Text.Json.JsonSerializer.Deserialize<ParsedInvoiceData>(jsonStr, options);
                
                if (parsed != null)
                {
                    // Ensure we have required fields with defaults
                    if (string.IsNullOrEmpty(parsed.Title))
                        parsed.Title = "Invoice";
                    if (string.IsNullOrEmpty(parsed.ClaimantName))
                        parsed.ClaimantName = "Unknown";
                    if (string.IsNullOrEmpty(parsed.Type) || !new[] { "Auto", "Health", "Property", "General" }.Contains(parsed.Type))
                        parsed.Type = "General";
                    if (string.IsNullOrEmpty(parsed.WalletId))
                        parsed.WalletId = "default-wallet";
                    if (string.IsNullOrEmpty(parsed.Description))
                    {
                        // Build description from line items if available
                        if (parsed.LineItems?.Any() == true)
                        {
                            var items = string.Join(", ", parsed.LineItems.Select(li => $"{li.Description} - ${li.Amount:F2}"));
                            parsed.Description = $"Line items: {items}. Total: ${parsed.Total:F2}";
                        }
                        else
                        {
                            parsed.Description = $"Invoice total: ${parsed.Total:F2}";
                        }
                    }
                }
                
                return parsed;
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Failed to parse JSON from extracted data, attempting fallback parsing");
                
                // Fallback: try to extract fields using regex
                return ParseExtractedDataFallback(extractedData);
            }
        }

        /// <summary>
        /// Fallback parser that extracts fields using regex patterns
        /// </summary>
        private ParsedInvoiceData? ParseExtractedDataFallback(string extractedData)
        {
            var result = new ParsedInvoiceData();
            
            // Try to extract title
            var titleMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"[""']?title[""']?\s*[:=]\s*[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (titleMatch.Success)
                result.Title = titleMatch.Groups[1].Value;
            else
                result.Title = "Invoice from Document";
            
            // Try to extract claimant name
            var claimantMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"[""']?claimant(?:Name)?[""']?\s*[:=]\s*[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (claimantMatch.Success)
                result.ClaimantName = claimantMatch.Groups[1].Value;
            else
            {
                // Try other patterns
                var customerMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"(?:customer|client|patient|bill\s*to)\s*[:=]?\s*[""']?([A-Za-z\s]+)[""']?", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                result.ClaimantName = customerMatch.Success ? customerMatch.Groups[1].Value.Trim() : "Unknown";
            }
            
            // Try to extract type
            var typeMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"[""']?type[""']?\s*[:=]\s*[""']?(Auto|Health|Property|General)[""']?", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            result.Type = typeMatch.Success ? typeMatch.Groups[1].Value : "General";
            
            // Try to extract wallet ID
            var walletMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"[""']?wallet(?:Id)?[""']?\s*[:=]\s*[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            result.WalletId = walletMatch.Success ? walletMatch.Groups[1].Value : "default-wallet";
            
            // Try to extract description or build from content
            var descMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"[""']?description[""']?\s*[:=]\s*[""']([^""']+)[""']", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (descMatch.Success)
                result.Description = descMatch.Groups[1].Value;
            else
            {
                // Try to extract total and build a basic description
                var totalMatch = System.Text.RegularExpressions.Regex.Match(extractedData, @"total\s*[:=]?\s*\$?([\d,]+\.?\d*)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (totalMatch.Success && decimal.TryParse(totalMatch.Groups[1].Value.Replace(",", ""), out var total))
                {
                    result.Total = total;
                    result.Description = $"Invoice total: ${total:F2}";
                }
                else
                {
                    result.Description = "Invoice from uploaded document";
                }
            }
            
            return result;
        }

        /// <summary>
        /// Runs the original handoff-based workflow for non-document requests
        /// </summary>
        private async Task RunHandoffWorkflowAsync(
            Func<string, bool, Task>? onTextUpdate = null,
            Func<string, Exception?, Task>? onError = null)
        {
            var workflow = BuildHandoffWorkflow();
            StreamingRun? run = null;
            
            try
            {
                run = await InProcessExecution.StreamAsync(workflow, _messages);
                await run.TrySendMessageAsync(new TurnToken(emitEvents: true));
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to start workflow execution");
                if (onError != null)
                {
                    await onError($"Failed to start workflow: {ex.Message}", ex);
                }
                throw;
            }

            var maxIterations = 100;
            var iterations = 0;
            var workflowCompleted = false;
            Exception? workflowError = null;

            try
            {
                await foreach (var evt in run.WatchStreamAsync())
                {
                    iterations++;
                    _logger?.LogDebug("Workflow event {Iteration}: {EventType}", iterations, evt.GetType().Name);
                    
                    if (evt is AgentResponseUpdateEvent e)
                    {
                        foreach (var content in e.Update.Contents)
                        {
                            if (content is FunctionResultContent functionResult && functionResult.Exception != null)
                            {
                                var errorMsg = $"\n\n**Tool Error ({functionResult.CallId})**: {functionResult.Exception.Message}\n\n";
                                _logger?.LogError(functionResult.Exception, "Tool call {CallId} failed", functionResult.CallId);
                                if (onTextUpdate != null) await onTextUpdate(errorMsg, false);
                                if (onError != null) await onError($"Tool call failed: {functionResult.Exception.Message}", functionResult.Exception);
                            }
                            else if (content is FunctionCallContent functionCall)
                            {
                                _logger?.LogInformation("Tool call: {FunctionName}", functionCall.Name);
                            }
                        }
                        
                        if (onTextUpdate != null)
                        {
                            await onTextUpdate(e.Data?.ToString() ?? "", false);
                        }
                    }
                    else if (evt is WorkflowOutputEvent outputEvt)
                    {
                        workflowCompleted = true;
                        _logger?.LogInformation("Workflow completed successfully");
                        
                        if (outputEvt.Data is List<ChatMessage> newMessages)
                        {
                            foreach (var msg in newMessages.Skip(_messages.Count))
                            {
                                _messages.Add(msg);
                            }
                        }
                        break;
                    }
                    else if (evt.GetType().Name.Contains("Error", StringComparison.OrdinalIgnoreCase))
                    {
                        var errorMsg = $"Workflow error event: {evt.GetType().Name}";
                        _logger?.LogError("Workflow error event received: {EventType}", evt.GetType().Name);
                        if (onError != null) await onError(errorMsg, null);
                        if (onTextUpdate != null) await onTextUpdate($"\n\n**Workflow Error**: {errorMsg}\n\n", false);
                    }

                    if (iterations >= maxIterations)
                    {
                        _logger?.LogWarning("Workflow reached max iterations ({MaxIterations})", maxIterations);
                        if (onTextUpdate != null)
                        {
                            await onTextUpdate("\n\n[Workflow reached maximum iterations limit]\n\n", false);
                        }
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                workflowError = ex;
                _logger?.LogError(ex, "Error during workflow stream processing");
            }
            finally
            {
                if (run != null)
                {
                    await run.DisposeAsync();
                }
            }

            if (!workflowCompleted && workflowError == null && iterations < maxIterations)
            {
                var msg = "\n\n**Warning**: Workflow stream ended without completion.\n\n";
                _logger?.LogWarning("Workflow stream ended without WorkflowOutputEvent");
                if (onTextUpdate != null) await onTextUpdate(msg, false);
                if (onError != null) await onError("Workflow ended unexpectedly", null);
            }

            if (workflowError != null)
            {
                if (onTextUpdate != null) await onTextUpdate($"\n\n**Workflow Error**: {workflowError.Message}\n\n", false);
                if (onError != null) await onError(workflowError.Message, workflowError);
                throw workflowError;
            }
        }

        /// <summary>
        /// Builds the handoff-based workflow for general requests
        /// </summary>
        private Workflow BuildHandoffWorkflow()
        {
            var client = CreateChatClient();
            var definitions = _agents.All;

            var agentList = string.Join("\n", definitions.Select(d => $"- {d.Name}: {d.Description}"));
            var triageInstructions = $"""
            You are Slapsure Assistant, an AI-powered insurance claims management assistant. Your job is to understand the user's request and route them to the appropriate specialist agent.

            Available specialists:
            {agentList}

            Routing Guidelines:
            - Uploaded documents, images, PDFs, extracting data from documents → documentanalysis
            - Creating invoices in Cosmos DB, managing invoice records, querying invoices → invoicemanager
            - Contacts, policyholders, claimants, adding/updating people → contactmanager
            - Payments, payment status, payment history, financial transactions, creating payments for invoices → paymentcreator

            ALWAYS handoff to the appropriate specialist based on the user's request.
            """;

            var triageAgent = new ChatClientAgent(
                client,
                instructions: triageInstructions,
                name: "triage",
                description: "Routes user requests to the appropriate specialist agent");

            var specialists = definitions
                .Select(d => new ChatClientAgent(
                    client,
                    instructions: d.Instructions,
                    name: d.Name,
                    description: d.Description,
                    tools: d.GetTools(_toolsFactory)))
                .ToArray();

            var builder = AgentWorkflowBuilder.CreateHandoffBuilderWith(triageAgent).WithHandoffs(triageAgent, specialists);

            foreach (var specialist in specialists)
                builder.WithHandoff(specialist, triageAgent);

            return builder.Build();
        }

        private IChatClient CreateChatClient()
        {
            return new AnthropicClient(new Anthropic.Core.ClientOptions { ApiKey = _config["Anthropic:Key"] }).AsIChatClient(_config["Anthropic:Model"]);
        }
    }
}
