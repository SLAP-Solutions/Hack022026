using Anthropic;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Workflows;
using Microsoft.Extensions.AI;

namespace agent_api.Agents
{
    public class AgentOrchestrator
    {

        private readonly IConfiguration _config;
        private readonly List<ChatMessage> _messages = [];
        private Agents agents;

        public AgentOrchestrator(IConfiguration config)
        {
            _config = config;
        }

        private Workflow BuildWorkflow()
        {
            var client = CreateChatClient();
            var definitions = agents.All;

            var agentList = string.Join("\n", definitions.Select(d => $"- {d.Name}: {d.Description}"));
            var triageInstructions = $"""
            You are Wingman, a helpful AI assistant. Your job is to understand the user's request and route them to the appropriate specialist agent.

            Available specialists:
            {agentList}

            ALWAYS handoff to the appropriate specialist based on the user's request. If the request doesn't clearly fit a specialist, use fileorganizer as the default.
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
                    tools: d.GetTools))
                .ToArray();

            var builder = AgentWorkflowBuilder.CreateHandoffBuilderWith(triageAgent).WithHandoffs(triageAgent, specialists);

            foreach (var specialist in specialists)
                builder.WithHandoff(specialist, triageAgent);

            return builder.Build();
        }

        private IChatClient CreateChatClient()
        {
            return new AnthropicClient(new Anthropic.Core.ClientOptions { APIKey = _config.ApiKey }).AsIChatClient(_config.Model);
        }
    }
}
