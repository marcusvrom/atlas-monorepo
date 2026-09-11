using Atlas.Api.Extensions;
using Atlas.Catalog.Presentation;

var builder = WebApplication.CreateBuilder(args);

builder.AddAtlasObservability();      // OpenTelemetry + Serilog estruturado
builder.AddAtlasPersistence();        // Aurora PostgreSQL + Redis
builder.AddAtlasAuthentication();     // Cognito JWT
builder.AddCatalogModule();

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddResponseCompression();

var app = builder.Build();

app.UseAtlasRequestLogging();
app.UseExceptionHandler();
app.UseResponseCompression();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

// Cada módulo registra seus próprios endpoints. O host não conhece o interior
// de nenhum módulo — só a extensão pública de registro. Ver AGENTS.md R6.
app.MapCatalogEndpoints();

app.Run();
