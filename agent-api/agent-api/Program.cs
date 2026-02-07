using agent_api;
using agent_api.Agents;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddHttpClient<SlapsureClient>(client =>
{
    client.BaseAddress = new Uri("http://localhost:3000");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Register ToolsFactory and AgentDefinitions
builder.Services.AddScoped<ToolsFactory>();
builder.Services.AddScoped<AgentDefinitions>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
