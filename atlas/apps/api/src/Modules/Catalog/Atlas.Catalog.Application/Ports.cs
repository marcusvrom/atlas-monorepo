using Atlas.Catalog.Domain;
using Atlas.SharedKernel.Types;

namespace Atlas.Catalog.Application;

/// <summary>Escrita: agregado completo, via EF Core.</summary>
public interface IExerciseRepository
{
    Task<Exercise?> GetAsync(ExerciseId id, CancellationToken ct);
    Task AddAsync(Exercise exercise, CancellationToken ct);
    Task<int> SaveChangesAsync(CancellationToken ct);
}

/// <summary>
/// Leitura: projeções via Dapper com SQL explícito. As telas quentes do
/// catálogo são agregações que o EF gera mal, e o custo de manter esses ~15
/// SQLs à mão é menor que o de depurar planos de execução. Ver ADR do CQRS.
/// </summary>
public interface IExerciseReadStore
{
    Task<CursorPage<ExerciseSummaryDto>> ListAsync(ExerciseQuery query, CancellationToken ct);
    Task<ExerciseDetailDto?> GetDetailAsync(ExerciseId id, UserId requesterId, CancellationToken ct);
    Task<IReadOnlyList<MuscleGroupDto>> ListMuscleGroupsAsync(CancellationToken ct);
}

public sealed record ExerciseQuery(
    string? Search,
    string? MuscleCode,
    Equipment? Equipment,
    Difficulty? Difficulty,
    string? Cursor,
    int Limit);

public sealed record CursorPage<T>(IReadOnlyList<T> Items, string? NextCursor);

public sealed record ExerciseSummaryDto(
    Guid Id,
    string Name,
    string PrimaryMuscleCode,
    string Equipment,
    string Difficulty,
    string? ThumbnailUrl,
    bool IsCustom);

public sealed record ExerciseDetailDto(
    Guid Id,
    string Name,
    string PrimaryMuscleCode,
    string Equipment,
    string Difficulty,
    string? ThumbnailUrl,
    bool IsCustom,
    string Description,
    IReadOnlyList<ExerciseMediaDto> Media,
    IReadOnlyList<MuscleActivationDto> Activations,
    IReadOnlyList<string> ExecutionCues,
    IReadOnlyList<string> CommonMistakes);

public sealed record ExerciseMediaDto(string Kind, string Url, string? Angle, int? DurationMs);

public sealed record MuscleActivationDto(
    short MuscleGroupId,
    string MuscleCode,
    string Role,
    decimal ActivationWeight);

/// <summary>SvgPathId liga o dado ao &lt;path&gt; do SVG anatômico. Ver spec 11 §3.</summary>
public sealed record MuscleGroupDto(
    short Id,
    string Code,
    string DisplayName,
    string SvgPathId,
    string View,
    short? ParentId);
