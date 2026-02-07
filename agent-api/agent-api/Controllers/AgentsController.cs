using agent_api.Agents;
using Microsoft.Agents.AI;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace agent_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AgentsController : ControllerBase
    {
        private AgentOrchestrator _orchestrator;

        [HttpGet("workflows/invoice/run")]
        public async Task<string> RunInvoiceWorkflow([FromBody] IFormFile file)
        {
            var response = string.Empty;
            await _orchestrator.RunStreamingAsync(onTextUpdate: (text, isThinking) =>
            {
                var fullResponse = new StringBuilder();
                response = fullResponse.ToString();
            });

            return response;
        }
    }
}
