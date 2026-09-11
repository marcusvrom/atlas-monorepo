using Atlas.SharedKernel.Results;
using Atlas.SharedKernel.Types;

namespace Atlas.Catalog.Application;

public sealed class GetExerciseHandler(IExerciseReadStore readStore)
{
    public async Task<Result<ExerciseDetailDto>> HandleAsync(
        ExerciseId id,
        UserId requesterId,
        CancellationToken ct)
    {
        var detail = await readStore.GetDetailAsync(id, requesterId, ct);

        // Exercício custom de outro usuário retorna NotFound, não Forbidden:
        // 403 confirmaria a existência do recurso e permitiria enumeração.
        return detail is null
            ? Error.NotFound("exercise.not_found", "Exercício não encontrado.")
            : detail;
    }
}
