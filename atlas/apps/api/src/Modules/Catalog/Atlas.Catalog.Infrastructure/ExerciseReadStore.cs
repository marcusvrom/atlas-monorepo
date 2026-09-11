using System.Data;
using Atlas.Catalog.Application;
using Atlas.SharedKernel.Types;
using Dapper;

namespace Atlas.Catalog.Infrastructure;

public interface IDbConnectionFactory
{
    Task<IDbConnection> OpenAsync(CancellationToken ct, bool readOnly = false);
}

/// <summary>
/// Leitura do catálogo com SQL explícito.
///
/// Este módulo é read-heavy e quase imutável — as queries abaixo são as mais
/// executadas do sistema e ficam atrás de cache Redis (1h para lista, 24h para
/// detalhe). Ver spec 00 §13.1.
/// </summary>
public sealed class ExerciseReadStore(IDbConnectionFactory factory) : IExerciseReadStore
{
    private const string ListSql = """
        SELECT  e.id                AS Id,
                e.name              AS Name,
                mg.code             AS PrimaryMuscleCode,
                e.equipment         AS Equipment,
                e.difficulty        AS Difficulty,
                e.thumbnail_url     AS ThumbnailUrl,
                e.owner_id IS NOT NULL AS IsCustom
        FROM    catalog.exercise e
        JOIN    catalog.muscle_activation ma
                    ON ma.exercise_id = e.id AND ma.role = 1
        JOIN    catalog.muscle_group mg ON mg.id = ma.muscle_group_id
        WHERE   e.owner_id IS NULL
          AND  (@Search     IS NULL OR e.search_vector @@ plainto_tsquery('portuguese', @Search))
          AND  (@MuscleCode IS NULL OR mg.code = @MuscleCode)
          AND  (@Equipment  IS NULL OR e.equipment = @Equipment)
          AND  (@Difficulty IS NULL OR e.difficulty = @Difficulty)
          AND  (@Cursor     IS NULL OR e.id > @Cursor::uuid)
        ORDER BY e.id
        LIMIT   @Limit;
        """;

    private const string DetailSql = """
        SELECT  e.id, e.name, e.description, e.equipment, e.difficulty,
                e.thumbnail_url, e.owner_id
        FROM    catalog.exercise e
        WHERE   e.id = @Id
          AND  (e.owner_id IS NULL OR e.owner_id = @RequesterId);
        """;

    private const string MuscleGroupSql = """
        SELECT  id AS Id, code AS Code, display_name AS DisplayName,
                svg_path_id AS SvgPathId, view AS View, parent_id AS ParentId
        FROM    catalog.muscle_group
        ORDER BY id;
        """;

    public async Task<CursorPage<ExerciseSummaryDto>> ListAsync(ExerciseQuery query, CancellationToken ct)
    {
        using var connection = await factory.OpenAsync(ct, readOnly: true);

        var rows = (await connection.QueryAsync<ExerciseSummaryDto>(
            new CommandDefinition(ListSql, new
            {
                query.Search,
                query.MuscleCode,
                Equipment = query.Equipment?.ToString(),
                Difficulty = query.Difficulty?.ToString(),
                query.Cursor,
                Limit = query.Limit + 1     // +1 detecta se há próxima página
            }, cancellationToken: ct))).AsList();

        var hasMore = rows.Count > query.Limit;
        if (hasMore) rows.RemoveAt(rows.Count - 1);

        // Cursor opaco derivado do último id: keyset pagination, estável e
        // sem OFFSET (que degrada linearmente em tabela grande).
        var nextCursor = hasMore ? rows[^1].Id.ToString() : null;
        return new CursorPage<ExerciseSummaryDto>(rows, nextCursor);
    }

    public async Task<ExerciseDetailDto?> GetDetailAsync(
        ExerciseId id,
        UserId requesterId,
        CancellationToken ct)
    {
        // ATL-CAT-001: montar o detalhe completo (mídia, ativações, cues) em
        // uma única ida ao banco com QueryMultiple, evitando N+1.
        throw new NotImplementedException("ATL-CAT-001 — ver docs/agent/task-specs/");
    }

    public async Task<IReadOnlyList<MuscleGroupDto>> ListMuscleGroupsAsync(CancellationToken ct)
    {
        using var connection = await factory.OpenAsync(ct, readOnly: true);
        var rows = await connection.QueryAsync<MuscleGroupDto>(
            new CommandDefinition(MuscleGroupSql, cancellationToken: ct));
        return rows.AsList();
    }
}
