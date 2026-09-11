using Atlas.Catalog.Application;
using Atlas.Catalog.Domain;
using Atlas.SharedKernel.Results;
using Atlas.SharedKernel.Types;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Atlas.Catalog.Presentation;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1").WithTags("Catalog");

        group.MapGet("/exercises", ListExercises)
            .WithName("ListExercises")
            .Produces<CursorPage<ExerciseSummaryDto>>();

        group.MapGet("/exercises/{id:guid}", GetExercise)
            .WithName("GetExercise")
            .Produces<ExerciseDetailDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/muscle-groups", ListMuscleGroups)
            .WithName("ListMuscleGroups")
            .Produces<IReadOnlyList<MuscleGroupDto>>();

        return app;
    }

    private static async Task<IResult> ListExercises(
        string? q,
        string? muscle,
        Equipment? equipment,
        Difficulty? difficulty,
        string? cursor,
        int? limit,
        ListExercisesHandler handler,
        CancellationToken ct)
    {
        var result = await handler.HandleAsync(
            new ExerciseQuery(q, muscle, equipment, difficulty, cursor, limit ?? 20), ct);

        return result.Match(TypedResults.Ok, ToProblem);
    }

    private static async Task<IResult> GetExercise(
        Guid id,
        GetExerciseHandler handler,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var result = await handler.HandleAsync(new ExerciseId(id), currentUser.Id, ct);
        return result.Match(TypedResults.Ok, ToProblem);
    }

    private static async Task<IResult> ListMuscleGroups(
        IExerciseReadStore readStore,
        CancellationToken ct)
    {
        return TypedResults.Ok(await readStore.ListMuscleGroupsAsync(ct));
    }

    /// <summary>Error de domínio → Problem Details (RFC 9457).</summary>
    private static IResult ToProblem(Error error) => TypedResults.Problem(
        statusCode: error.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Validation => StatusCodes.Status422UnprocessableEntity,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.QuotaExceeded => StatusCodes.Status402PaymentRequired,
            _ => StatusCodes.Status500InternalServerError
        },
        title: error.Code,
        detail: error.Message);
}

public interface ICurrentUser
{
    UserId Id { get; }
    bool IsProfessional { get; }
}
