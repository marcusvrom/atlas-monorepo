using Atlas.SharedKernel.Results;

namespace Atlas.Catalog.Application;

public sealed class ListExercisesHandler(IExerciseReadStore readStore)
{
    private const int MaxLimit = 50;

    public async Task<Result<CursorPage<ExerciseSummaryDto>>> HandleAsync(
        ExerciseQuery query,
        CancellationToken ct)
    {
        if (query.Limit is < 1 or > MaxLimit)
            return Error.Validation("catalog.invalid_limit", $"Limite deve estar entre 1 e {MaxLimit}.");

        return await readStore.ListAsync(query, ct);
    }
}
