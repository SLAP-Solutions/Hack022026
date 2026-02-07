using System.Runtime.Versioning;
using Microsoft.Extensions.AI;

namespace agent_api.Agents;

public class ToolsFactory
{
    private SlapsureClient slapsureClient;

    public ToolsFactory(SlapsureClient slapsureClient)
    {
        this.slapsureClient = slapsureClient;
    }

    public IReadOnlyList<AITool> ClaimTools()
    {
        return
        [
            AIFunctionFactory.Create(slapsureClient.GetClaimsAsync),
            AIFunctionFactory.Create(slapsureClient.GetClaimByIdAsync),
            AIFunctionFactory.Create(slapsureClient.CreateClaimAsync),
        ];
    }

    public IReadOnlyList<AITool> PaymentTools()
    {
        return
        [
            AIFunctionFactory.Create(slapsureClient.GetPaymentsAsync)
        ];
    }

    public IReadOnlyList<AITool> ContactTools()
    {
        return
        [
            AIFunctionFactory.Create(slapsureClient.GetContactsAsync),
            AIFunctionFactory.Create(slapsureClient.GetContactByIdAsync),
            AIFunctionFactory.Create(slapsureClient.CreateContactAsync),
        ];
    }
}
