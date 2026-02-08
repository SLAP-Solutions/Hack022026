using agent_api;
using agent_api.Agents;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJsFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient<SlapsureClient>(client =>
{
    client.BaseAddress = new Uri("http://localhost:3000");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Register ToolsFactory and Agents
builder.Services.AddScoped<ToolsFactory>();
builder.Services.AddScoped<Agents>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Enable CORS
app.UseCors("NextJsFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
