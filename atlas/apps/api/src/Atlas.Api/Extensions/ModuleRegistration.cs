using Atlas.Catalog.Application;
using Atlas.Catalog.Infrastructure;

namespace Atlas.Api.Extensions;

public static class ModuleRegistration
{
    public static WebApplicationBuilder AddCatalogModule(this WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<IExerciseReadStore, ExerciseReadStore>();
        builder.Services.AddScoped<ListExercisesHandler>();
        builder.Services.AddScoped<GetExerciseHandler>();
        return builder;
    }

    /// <summary>
    /// ATL-INF-002 — Aurora PostgreSQL (write + réplica de leitura) e Redis.
    /// Handlers de query usam a connection string com ApplicationIntent=ReadOnly.
    /// </summary>
    public static WebApplicationBuilder AddAtlasPersistence(this WebApplicationBuilder builder) => builder;

    /// <summary>ATL-IDN-001 — autenticação JWT via Cognito. Ver ADR-0006.</summary>
    public static WebApplicationBuilder AddAtlasAuthentication(this WebApplicationBuilder builder) => builder;
}
