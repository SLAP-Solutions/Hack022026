using agent_api.Agents;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace agent_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AgentsController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly Agents.Agents _agents;
        private readonly ToolsFactory _toolsFactory;

        public AgentsController(IConfiguration config, Agents.Agents agents, ToolsFactory toolsFactory)
        {
            _config = config;
            _agents = agents;
            _toolsFactory = toolsFactory;
        }

        [HttpPost("workflows/invoice/run")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> RunInvoiceWorkflow(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file uploaded" });
            }

            var allowedTypes = new[] { "application/pdf", "image/png", "image/jpeg", "image/jpg" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new { error = "Invalid file type. Only PDF, PNG, and JPG are allowed." });

            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();
                var base64Content = Convert.ToBase64String(fileBytes);

                var orchestrator = new AgentOrchestrator(_config, _agents, _toolsFactory);
                
                var fullResponse = new StringBuilder();
                await orchestrator.RunStreamingAsync(
                    input: $"Process this invoice document. The file is named '{file.FileName}' and is a {file.ContentType}. Extract all relevant information including: client name, invoice amount, description, type of service, and any other relevant details. Then create payments based on the things in the invoice.",
                    documentBase64: base64Content,
                    documentMediaType: file.ContentType,
                    onTextUpdate: (text, isThinking) =>
                    {
                        if (!isThinking)
                        {
                            fullResponse.Append(text);
                        }
                    });

                return Ok(new 
                { 
                    success = true, 
                    response = fullResponse.ToString(),
                    fileName = file.FileName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process invoice", details = ex.Message });
            }
        }
    }
}
