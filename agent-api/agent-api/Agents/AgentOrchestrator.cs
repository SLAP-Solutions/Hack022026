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
        private readonly Agents _agents;
        private readonly ToolsFactory _toolsFactory;

        public AgentOrchestrator(IConfiguration config, Agents agents, ToolsFactory toolsFactory)
        {
            _config = config;
            _agents = agents;
            _toolsFactory = toolsFactory;
        }

        public async Task RunStreamingAsync(Action<string, bool>? onTextUpdate = null)
        {
            var input = "";
            _messages.Add(new ChatMessage(ChatRole.User, input));

            var workflow = BuildWorkflow();
            var run = await InProcessExecution.StreamAsync(workflow, _messages);
            await run.TrySendMessageAsync(new TurnToken(emitEvents: true));

            await foreach (var evt in run.WatchStreamAsync())
            {
                if (evt is AgentResponseUpdateEvent e)
                {
                    onTextUpdate?.Invoke(e.Data?.ToString() ?? "", false);
                }
                else if (evt is WorkflowOutputEvent outputEvt && outputEvt.Data is List<ChatMessage> newMessages)
                {
                    foreach (var msg in newMessages.Skip(_messages.Count))
                    {
                        _messages.Add(msg);
                    }
                    break;
                }
            }
        }

        private Workflow BuildWorkflow()
        {
            var client = CreateChatClient();
            var definitions = _agents.All;

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
