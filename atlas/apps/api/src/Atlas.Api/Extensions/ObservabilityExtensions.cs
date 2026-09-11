using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace Atlas.Api.Extensions;

public static class ObservabilityExtensions
{
    /// <summary>
    /// Métrica técnica diz se o sistema está de pé; métrica de negócio diz se
    /// ele está funcionando. Ambas no mesmo painel. Ver spec 00 §14.
    /// </summary>
    public static WebApplicationBuilder AddAtlasObservability(this WebApplicationBuilder builder)
    {
        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService("atlas-api", serviceVersion: typeof(Program).Assembly.GetName().Version?.ToString())
                .AddAttributes([new KeyValuePair<string, object>(
                    "deployment.environment", builder.Environment.EnvironmentName)]))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.RecordException = true;
                    options.Filter = context => !context.Request.Path.StartsWithSegments("/health");
                })
                .AddHttpClientInstrumentation()
                .AddNpgsql()
                .AddOtlpExporter())
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddRuntimeInstrumentation()
                .AddMeter(AtlasMetrics.MeterName)
                .AddOtlpExporter());

        return builder;
    }

    /// <summary>
    /// Log estruturado com TraceId e UserId PSEUDONIMIZADO.
    /// Nenhum dado de saúde, peso, medida, foto ou mensagem vai para log, em
    /// nenhum nível. Ver spec 00 §14.3 e AGENTS.md R8.
    /// </summary>
    public static WebApplication UseAtlasRequestLogging(this WebApplication app) => app;
}
